import { Router, Response } from 'express';
import { pool } from '../db';
import { AuthRequest } from '../types';
import { authenticateToken, requireDeveloper } from '../middleware/auth';

const router = Router();

// 모든 모니터링 라우트는 개발자 권한 필요
router.use(authenticateToken, requireDeveloper);

// ============================================
// Overview - 전체 상태 요약
// ============================================
router.get('/overview', async (req: AuthRequest, res: Response) => {
  try {
    const [
      serverStatus,
      dbStatus,
      errorCount,
      userCount,
      trackCount
    ] = await Promise.all([
      getServerStatus(),
      getDatabaseStatus(),
      getRecentErrorCount(),
      getUserCount(),
      getTrackCount()
    ]);

    res.json({
      server: serverStatus,
      database: dbStatus,
      metrics: {
        errors24h: errorCount,
        totalUsers: userCount,
        totalTracks: trackCount
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Overview error:', error);
    res.status(500).json({ error: 'Failed to get overview' });
  }
});

// ============================================
// System - 서버 상태
// ============================================
router.get('/system', async (req: AuthRequest, res: Response) => {
  try {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    res.json({
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: {
        seconds: uptime,
        formatted: formatUptime(uptime)
      },
      memory: {
        heapUsed: formatBytes(memoryUsage.heapUsed),
        heapTotal: formatBytes(memoryUsage.heapTotal),
        rss: formatBytes(memoryUsage.rss),
        external: formatBytes(memoryUsage.external),
        heapUsedBytes: memoryUsage.heapUsed,
        heapTotalBytes: memoryUsage.heapTotal,
        heapUsedPercent: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
      },
      environment: process.env.NODE_ENV || 'development',
      pid: process.pid,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('System error:', error);
    res.status(500).json({ error: 'Failed to get system status' });
  }
});

// ============================================
// Errors - 에러 로그
// ============================================
router.get('/errors', async (req: AuthRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const statusCode = req.query.status_code as string;

    let query = `
      SELECT id, error_type, message, stack, endpoint, method, status_code,
             user_id, ip_address, created_at
      FROM error_logs
    `;
    const params: any[] = [];

    if (statusCode) {
      query += ` WHERE status_code = $1`;
      params.push(parseInt(statusCode));
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const [result, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(
        statusCode
          ? `SELECT COUNT(*) FROM error_logs WHERE status_code = $1`
          : `SELECT COUNT(*) FROM error_logs`,
        statusCode ? [parseInt(statusCode)] : []
      )
    ]);

    res.json({
      errors: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset
    });
  } catch (error) {
    console.error('Errors fetch error:', error);
    res.status(500).json({ error: 'Failed to get errors' });
  }
});

// ============================================
// Database - DB 통계
// ============================================
router.get('/database', async (req: AuthRequest, res: Response) => {
  try {
    // 테이블별 레코드 수
    const tables = ['users', 'tracks', 'invitations', 'user_tracks', 'categories',
                    'partners', 'webtoon_projects', 'webtoon_scenes'];

    const tableStats = await Promise.all(
      tables.map(async (table) => {
        try {
          const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
          return { table, count: parseInt(result.rows[0].count) };
        } catch {
          return { table, count: 0, error: 'Table not found' };
        }
      })
    );

    // 활성 커넥션 수
    const connectionResult = await pool.query(`
      SELECT count(*) as total,
             count(*) FILTER (WHERE state = 'active') as active,
             count(*) FILTER (WHERE state = 'idle') as idle
      FROM pg_stat_activity
      WHERE datname = current_database()
    `);

    // 데이터베이스 크기
    const sizeResult = await pool.query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `);

    res.json({
      tables: tableStats,
      connections: connectionResult.rows[0],
      databaseSize: sizeResult.rows[0]?.size || 'unknown',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database stats error:', error);
    res.status(500).json({ error: 'Failed to get database stats' });
  }
});

// ============================================
// API Stats - 요청 통계
// ============================================
router.get('/api-stats', async (req: AuthRequest, res: Response) => {
  try {
    const period = req.query.period as string || '24h';
    let interval = '24 hours';
    if (period === '1h') interval = '1 hour';
    else if (period === '7d') interval = '7 days';

    // 총 요청 수 및 평균 응답 시간
    const statsResult = await pool.query(`
      SELECT
        COUNT(*) as total_requests,
        ROUND(AVG(response_time)::numeric, 2) as avg_response_time,
        ROUND((PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time))::numeric, 2) as p95_response_time,
        COUNT(*) FILTER (WHERE status_code >= 200 AND status_code < 300) as success_count,
        COUNT(*) FILTER (WHERE status_code >= 400 AND status_code < 500) as client_error_count,
        COUNT(*) FILTER (WHERE status_code >= 500) as server_error_count
      FROM request_logs
      WHERE created_at > NOW() - INTERVAL '${interval}'
    `);

    // 엔드포인트별 통계
    const endpointResult = await pool.query(`
      SELECT
        endpoint,
        COUNT(*) as count,
        ROUND(AVG(response_time)::numeric, 2) as avg_time
      FROM request_logs
      WHERE created_at > NOW() - INTERVAL '${interval}'
      GROUP BY endpoint
      ORDER BY count DESC
      LIMIT 20
    `);

    // 시간별 요청 수 (최근 24시간)
    const hourlyResult = await pool.query(`
      SELECT
        date_trunc('hour', created_at) as hour,
        COUNT(*) as count
      FROM request_logs
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY date_trunc('hour', created_at)
      ORDER BY hour
    `);

    // 상태 코드 분포
    const statusResult = await pool.query(`
      SELECT
        status_code,
        COUNT(*) as count
      FROM request_logs
      WHERE created_at > NOW() - INTERVAL '${interval}'
      GROUP BY status_code
      ORDER BY count DESC
    `);

    res.json({
      summary: statsResult.rows[0],
      endpoints: endpointResult.rows,
      hourly: hourlyResult.rows,
      statusCodes: statusResult.rows,
      period,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('API stats error:', error);
    res.status(500).json({ error: 'Failed to get API stats' });
  }
});

// ============================================
// Users - 사용자 활동 통계
// ============================================
router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    // 역할별 사용자 수
    const roleResult = await pool.query(`
      SELECT role, COUNT(*) as count
      FROM users
      GROUP BY role
    `);

    // 최근 가입자 (7일)
    const recentSignups = await pool.query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE created_at > NOW() - INTERVAL '7 days'
    `);

    // 최근 로그인 기록 (request_logs의 /api/auth/login 성공)
    const recentLogins = await pool.query(`
      SELECT COUNT(DISTINCT user_id) as count
      FROM request_logs
      WHERE endpoint = '/api/auth/login'
        AND status_code = 200
        AND created_at > NOW() - INTERVAL '24 hours'
    `);

    // 활성 사용자 (24시간 내 요청)
    const activeUsers = await pool.query(`
      SELECT COUNT(DISTINCT user_id) as count
      FROM request_logs
      WHERE user_id IS NOT NULL
        AND created_at > NOW() - INTERVAL '24 hours'
    `);

    // 최근 가입자 목록
    const recentUserList = await pool.query(`
      SELECT id, email, name, role, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 10
    `);

    res.json({
      byRole: roleResult.rows,
      recentSignups7d: parseInt(recentSignups.rows[0]?.count || '0'),
      activeUsers24h: parseInt(activeUsers.rows[0]?.count || '0'),
      logins24h: parseInt(recentLogins.rows[0]?.count || '0'),
      recentUsers: recentUserList.rows,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Users stats error:', error);
    res.status(500).json({ error: 'Failed to get user stats' });
  }
});

// ============================================
// Alerts - 알림 규칙 CRUD
// ============================================

// 알림 규칙 목록
router.get('/alerts', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT ar.*, u.email as created_by_email
      FROM alert_rules ar
      LEFT JOIN users u ON ar.created_by = u.id
      ORDER BY ar.created_at DESC
    `);
    res.json({ alerts: result.rows });
  } catch (error) {
    console.error('Alerts fetch error:', error);
    res.status(500).json({ error: 'Failed to get alerts' });
  }
});

// 알림 규칙 생성
router.post('/alerts', async (req: AuthRequest, res: Response) => {
  try {
    const { name, metric, operator, threshold, webhook_url, enabled } = req.body;

    if (!name || !metric || !operator || threshold === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const validMetrics = ['error_rate', 'response_time', 'error_count', 'request_count'];
    const validOperators = ['>', '<', '>=', '<=', '='];

    if (!validMetrics.includes(metric)) {
      return res.status(400).json({ error: 'Invalid metric' });
    }
    if (!validOperators.includes(operator)) {
      return res.status(400).json({ error: 'Invalid operator' });
    }

    const result = await pool.query(`
      INSERT INTO alert_rules (name, metric, operator, threshold, webhook_url, enabled, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [name, metric, operator, threshold, webhook_url || null, enabled !== false, req.user?.id]);

    res.status(201).json({ alert: result.rows[0] });
  } catch (error) {
    console.error('Alert create error:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

// 알림 규칙 수정
router.put('/alerts/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, metric, operator, threshold, webhook_url, enabled } = req.body;

    const result = await pool.query(`
      UPDATE alert_rules
      SET name = COALESCE($1, name),
          metric = COALESCE($2, metric),
          operator = COALESCE($3, operator),
          threshold = COALESCE($4, threshold),
          webhook_url = COALESCE($5, webhook_url),
          enabled = COALESCE($6, enabled),
          updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `, [name, metric, operator, threshold, webhook_url, enabled, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({ alert: result.rows[0] });
  } catch (error) {
    console.error('Alert update error:', error);
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

// 알림 규칙 삭제
router.delete('/alerts/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM alert_rules WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Alert delete error:', error);
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

// 알림 히스토리
router.get('/alerts/history', async (req: AuthRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    const result = await pool.query(`
      SELECT ah.*, ar.name as alert_name, ar.metric
      FROM alert_history ah
      JOIN alert_rules ar ON ah.alert_rule_id = ar.id
      ORDER BY ah.created_at DESC
      LIMIT $1
    `, [limit]);

    res.json({ history: result.rows });
  } catch (error) {
    console.error('Alert history error:', error);
    res.status(500).json({ error: 'Failed to get alert history' });
  }
});

// 텔레그램 테스트 메시지 전송
router.post('/telegram/test', async (req: AuthRequest, res: Response) => {
  try {
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      return res.status(400).json({
        success: false,
        error: '텔레그램 설정이 없습니다. TELEGRAM_BOT_TOKEN과 TELEGRAM_CHAT_ID 환경변수를 설정하세요.'
      });
    }

    const text = `✅ <b>테스트 메시지</b>\n\n모니터링 시스템 텔레그램 알림이 정상 작동합니다.\n\n⏰ ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`;

    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text,
          parse_mode: 'HTML'
        })
      }
    );

    if (response.ok) {
      res.json({ success: true, message: '텔레그램 테스트 메시지 전송 완료' });
    } else {
      const error = await response.json();
      res.status(500).json({ success: false, error: error.description || '전송 실패' });
    }
  } catch (error) {
    console.error('Telegram test error:', error);
    res.status(500).json({ success: false, error: 'Failed to send test message' });
  }
});

// 텔레그램 설정 상태 확인
router.get('/telegram/status', async (req: AuthRequest, res: Response) => {
  const configured = !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
  res.json({
    configured,
    botToken: configured ? '****' + process.env.TELEGRAM_BOT_TOKEN!.slice(-4) : null,
    chatId: process.env.TELEGRAM_CHAT_ID || null
  });
});

// ============================================
// Helper Functions
// ============================================

async function getServerStatus() {
  const memoryUsage = process.memoryUsage();
  const heapUsedBytes = memoryUsage.heapUsed;
  const GB = 1024 * 1024 * 1024;

  // Railway Hobby 플랜 기준 (8GB 제한): 4GB 이상 위험, 1GB 이상 주의
  const status = heapUsedBytes > 4 * GB ? 'critical' : heapUsedBytes > 1 * GB ? 'warning' : 'healthy';

  return {
    status,
    uptime: formatUptime(process.uptime()),
    memoryUsed: formatBytes(heapUsedBytes),
    memoryUsedBytes: heapUsedBytes,
    memoryPercent: Math.round((heapUsedBytes / memoryUsage.heapTotal) * 100)
  };
}

async function getDatabaseStatus() {
  try {
    const start = Date.now();
    await pool.query('SELECT 1');
    const latency = Date.now() - start;

    // 현실적인 기준: 200ms 미만 정상, 500ms 미만 주의, 그 이상 위험
    return {
      status: latency < 200 ? 'healthy' : latency < 500 ? 'warning' : 'critical',
      latency: `${latency}ms`
    };
  } catch {
    return { status: 'critical', latency: null };
  }
}

async function getRecentErrorCount() {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) FROM error_logs
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `);
    return parseInt(result.rows[0].count);
  } catch {
    return 0;
  }
}

async function getUserCount() {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM users');
    return parseInt(result.rows[0].count);
  } catch {
    return 0;
  }
}

async function getTrackCount() {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM tracks');
    return parseInt(result.rows[0].count);
  } catch {
    return 0;
  }
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.join(' ') || '0m';
}

function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0;
  let value = bytes;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(2)} ${units[unitIndex]}`;
}

export default router;
