import { Router, Response } from 'express';
import { pool } from '../db';
import { authenticateToken } from '../middleware/auth';
import { AuthRequest } from '../types';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getStreamUrl, downloadFile } from '../services/supabaseStorage';
import { transcodeToMp3 } from '../services/transcoder';

const router = Router();

// =====================================================
// 파트너 인증
// =====================================================

// POST /api/partner/register - 비활성화됨 (어드민에서 계정 생성)
router.post('/register', async (_req, res: Response) => {
  return res.status(403).json({
    error: '파트너 가입은 관리자를 통해서만 가능합니다. 관리자에게 문의하세요.'
  });
});

// POST /api/partner/login - 파트너 로그인
router.post('/login', async (req, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: '사용자명/이메일과 비밀번호를 입력해주세요' });
    }

    // 사용자 조회 (partner role만) - username 또는 email로 검색
    const userResult = await pool.query(`
      SELECT u.*, p.id as partner_id, p.business_name, p.is_active as partner_active
      FROM users u
      LEFT JOIN partners p ON p.user_id = u.id
      WHERE (u.email = $1 OR u.username = $1) AND u.role = 'partner'
    `, [email]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: '사용자명/이메일 또는 비밀번호가 잘못되었습니다' });
    }

    const user = userResult.rows[0];

    // 파트너 활성화 상태 확인
    if (!user.partner_active) {
      return res.status(403).json({ error: '파트너 계정이 비활성화되었습니다' });
    }

    // 비밀번호 확인
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: '사용자명/이메일 또는 비밀번호가 잘못되었습니다' });
    }

    // JWT 토큰 생성
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, role: 'partner', partnerId: user.partner_id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: 'partner',
        partnerId: user.partner_id,
        businessName: user.business_name,
      },
    });
  } catch (error) {
    console.error('Partner login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/partner/validate-invitation/:code - 초대 코드 유효성 확인
router.get('/validate-invitation/:code', async (req, res: Response) => {
  try {
    const { code } = req.params;

    const result = await pool.query(`
      SELECT
        invitation_code,
        partner_type,
        business_name,
        email,
        expires_at
      FROM partner_invitations
      WHERE invitation_code = $1
        AND is_used = false
        AND (expires_at IS NULL OR expires_at > NOW())
    `, [code]);

    if (result.rows.length === 0) {
      return res.status(404).json({ valid: false, error: 'Invalid or expired invitation' });
    }

    res.json({
      valid: true,
      invitation: result.rows[0],
    });
  } catch (error) {
    console.error('Validate invitation error:', error);
    res.status(500).json({ error: 'Failed to validate invitation' });
  }
});

// =====================================================
// 파트너 대시보드 (인증 필요)
// =====================================================

// 파트너 전용 미들웨어
const requirePartner = async (req: AuthRequest, res: Response, next: any) => {
  try {
    if (req.user?.role !== 'partner') {
      return res.status(403).json({ error: 'Partner access only' });
    }

    // 파트너 ID 조회
    const partnerResult = await pool.query(
      'SELECT id FROM partners WHERE user_id = $1 AND is_active = true',
      [req.user.id]
    );

    if (partnerResult.rows.length === 0) {
      return res.status(403).json({ error: 'Partner not found or inactive' });
    }

    (req as any).partnerId = partnerResult.rows[0].id;
    next();
  } catch (error) {
    console.error('requirePartner middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/partner/accept-invitation/:code - 초대 코드로 트랙 할당 받기
router.post('/accept-invitation/:code', authenticateToken as any, requirePartner, async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.params;
    const partnerId = (req as any).partnerId;

    // 초대 코드 조회
    const inviteResult = await pool.query(`
      SELECT id, is_used, expires_at
      FROM invitations
      WHERE code = $1
    `, [code]);

    if (inviteResult.rows.length === 0) {
      return res.status(404).json({ error: '유효하지 않은 초대 코드입니다' });
    }

    const invitation = inviteResult.rows[0];

    // 이미 사용된 초대 코드인지 확인
    if (invitation.is_used) {
      return res.status(400).json({ error: '이미 사용된 초대 코드입니다' });
    }

    // 만료 확인
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      return res.status(400).json({ error: '만료된 초대 코드입니다' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 초대에 연결된 트랙들을 파트너에게 할당
      const tracksResult = await client.query(`
        INSERT INTO partner_tracks (partner_id, track_id, is_active)
        SELECT $1, it.track_id, true
        FROM invitation_tracks it
        WHERE it.invitation_id = $2
        ON CONFLICT (partner_id, track_id) DO NOTHING
        RETURNING track_id
      `, [partnerId, invitation.id]);

      // 초대 코드를 사용됨으로 표시
      await client.query(`
        UPDATE invitations SET is_used = TRUE, used_by = $1 WHERE id = $2
      `, [req.user!.id, invitation.id]);

      await client.query('COMMIT');

      res.json({
        success: true,
        assignedCount: tracksResult.rowCount,
        message: `${tracksResult.rowCount}개의 음원이 할당되었습니다`
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Accept invitation error:', error);
    res.status(500).json({ error: '초대 수락에 실패했습니다' });
  }
});

// GET /api/partner/dashboard - 대시보드 요약
router.get('/dashboard', authenticateToken as any, requirePartner, async (req: AuthRequest, res: Response) => {
  try {
    const partnerId = (req as any).partnerId;

    // 파트너 정보
    const partnerResult = await pool.query(`
      SELECT p.*, u.email, u.name as user_name
      FROM partners p
      JOIN users u ON u.id = p.user_id
      WHERE p.id = $1
    `, [partnerId]);

    const partner = partnerResult.rows[0];

    // 전체 정산 합계
    const totalResult = await pool.query(`
      SELECT
        COALESCE(SUM(partner_share), 0) as total_share,
        COALESCE(SUM(total_gross_revenue), 0) as total_gross,
        COALESCE(SUM(total_streams), 0) as total_streams,
        COALESCE(SUM(total_downloads), 0) as total_downloads
      FROM partner_settlements
      WHERE partner_id = $1
    `, [partnerId]);

    // 최근 6개월 정산 추이
    const trendResult = await pool.query(`
      SELECT
        year_month,
        partner_share,
        total_gross_revenue,
        status
      FROM partner_settlements
      WHERE partner_id = $1
      ORDER BY year_month DESC
      LIMIT 6
    `, [partnerId]);

    // 트랙 수
    const trackCountResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM partner_tracks
      WHERE partner_id = $1 AND is_active = true
    `, [partnerId]);

    // 읽지 않은 알림 수
    const unreadResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM settlement_notifications
      WHERE partner_id = $1 AND is_read = false
    `, [partnerId]);

    res.json({
      partner: {
        id: partner.id,
        businessName: partner.business_name,
        partnerType: partner.partner_type,
        email: partner.email,
        userName: partner.user_name,
      },
      summary: {
        totalPartnerShare: Number(totalResult.rows[0].total_share),
        totalGrossRevenue: Number(totalResult.rows[0].total_gross),
        totalStreams: Number(totalResult.rows[0].total_streams),
        totalDownloads: Number(totalResult.rows[0].total_downloads),
        trackCount: Number(trackCountResult.rows[0].count),
        unreadNotifications: Number(unreadResult.rows[0].count),
      },
      recentSettlements: trendResult.rows.map(row => ({
        yearMonth: row.year_month,
        partnerShare: Number(row.partner_share),
        grossRevenue: Number(row.total_gross_revenue),
        status: row.status,
      })),
    });
  } catch (error) {
    console.error('Partner dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// GET /api/partner/settlements - 정산 내역 목록
router.get('/settlements', authenticateToken as any, requirePartner, async (req: AuthRequest, res: Response) => {
  try {
    const partnerId = (req as any).partnerId;
    const { year } = req.query;

    let query = `
      SELECT
        ps.id,
        ps.year_month,
        ps.total_gross_revenue,
        ps.total_net_revenue,
        ps.partner_share,
        ps.management_fee,
        ps.total_streams,
        ps.total_downloads,
        ps.status,
        ps.confirmed_at,
        ps.paid_at,
        ps.created_at
      FROM partner_settlements ps
      WHERE ps.partner_id = $1
    `;
    const params: any[] = [partnerId];

    if (year) {
      // LIKE 와일드카드 이스케이프 처리
      const safeYear = String(year).replace(/[%_\\]/g, '\\$&');
      query += ` AND ps.year_month LIKE $2`;
      params.push(`${safeYear}%`);
    }

    query += ` ORDER BY ps.year_month DESC`;

    const result = await pool.query(query, params);

    res.json({
      settlements: result.rows.map(row => ({
        id: row.id,
        yearMonth: row.year_month,
        grossRevenue: Number(row.total_gross_revenue),
        netRevenue: Number(row.total_net_revenue),
        partnerShare: Number(row.partner_share),
        managementFee: Number(row.management_fee),
        totalStreams: Number(row.total_streams),
        totalDownloads: Number(row.total_downloads),
        status: row.status,
        confirmedAt: row.confirmed_at,
        paidAt: row.paid_at,
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    console.error('Partner settlements error:', error);
    res.status(500).json({ error: 'Failed to fetch settlements' });
  }
});

// GET /api/partner/settlements/:id - 정산 상세 조회
router.get('/settlements/:id', authenticateToken as any, requirePartner, async (req: AuthRequest, res: Response) => {
  try {
    const partnerId = (req as any).partnerId;
    const { id } = req.params;

    // 정산 기본 정보
    const settlementResult = await pool.query(`
      SELECT * FROM partner_settlements
      WHERE id = $1 AND partner_id = $2
    `, [id, partnerId]);

    if (settlementResult.rows.length === 0) {
      return res.status(404).json({ error: 'Settlement not found' });
    }

    const settlement = settlementResult.rows[0];

    // 상세 내역 (트랙별)
    const detailsResult = await pool.query(`
      SELECT
        psd.*,
        t.title as track_title,
        t.artist as track_artist,
        d.name as distributor_name
      FROM partner_settlement_details psd
      JOIN tracks t ON t.id = psd.track_id
      LEFT JOIN distributors d ON d.id = psd.distributor_id
      WHERE psd.partner_settlement_id = $1
      ORDER BY psd.partner_share DESC
    `, [id]);

    res.json({
      settlement: {
        id: settlement.id,
        yearMonth: settlement.year_month,
        grossRevenue: Number(settlement.total_gross_revenue),
        netRevenue: Number(settlement.total_net_revenue),
        partnerShare: Number(settlement.partner_share),
        managementFee: Number(settlement.management_fee),
        totalStreams: Number(settlement.total_streams),
        totalDownloads: Number(settlement.total_downloads),
        status: settlement.status,
        confirmedAt: settlement.confirmed_at,
        paidAt: settlement.paid_at,
        paymentRef: settlement.payment_ref,
        memo: settlement.memo,
      },
      details: detailsResult.rows.map(row => ({
        id: row.id,
        trackTitle: row.track_title,
        trackArtist: row.track_artist,
        distributorName: row.distributor_name,
        grossRevenue: Number(row.gross_revenue),
        netRevenue: Number(row.net_revenue),
        shareRate: Number(row.share_rate),
        partnerShare: Number(row.partner_share),
        streamCount: Number(row.stream_count),
        downloadCount: Number(row.download_count),
      })),
    });
  } catch (error) {
    console.error('Settlement detail error:', error);
    res.status(500).json({ error: 'Failed to fetch settlement details' });
  }
});

// GET /api/partner/library - 전체 트랙 목록 (할당 여부 포함)
router.get('/library', authenticateToken as any, requirePartner, async (req: AuthRequest, res: Response) => {
  try {
    const partnerId = (req as any).partnerId;
    const { q, category, mood, language, sort = 'created_at', order = 'desc', page = 1, limit = 20, assigned_only } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
    const offset = (pageNum - 1) * limitNum;
    const assignedOnlyMode = assigned_only === 'true';

    // 조건 배열
    const conditions: string[] = [];
    const params: any[] = [partnerId];
    let paramIndex = 2;

    // 검색어
    if (q) {
      conditions.push(`(t.title ILIKE $${paramIndex} OR t.artist ILIKE $${paramIndex} OR t.album ILIKE $${paramIndex})`);
      params.push(`%${q}%`);
      paramIndex++;
    }

    // 카테고리 필터 (admin.ts와 동일)
    if (category) {
      conditions.push(`EXISTS (
        SELECT 1 FROM track_categories tc
        WHERE tc.track_id = t.id
        AND (tc.category_id = $${paramIndex} OR tc.category_id IN (SELECT id FROM categories WHERE parent_id = $${paramIndex}))
      )`);
      params.push(category);
      paramIndex++;
    }

    // 분위기 필터
    if (mood) {
      conditions.push(`t.mood = $${paramIndex}`);
      params.push(mood);
      paramIndex++;
    }

    // 언어 필터
    if (language) {
      conditions.push(`t.language = $${paramIndex}`);
      params.push(language);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 정렬
    const validSorts = ['created_at', 'title', 'artist'];
    const sortColumn = validSorts.includes(sort as string) ? sort : 'created_at';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

    // 트랙 조회 (할당 여부 포함)
    // assigned_only 모드에서는 INNER JOIN으로 할당된 트랙만 조회
    const partnerTrackJoin = assignedOnlyMode
      ? `INNER JOIN partner_tracks pt ON pt.track_id = t.id AND pt.partner_id = $1 AND pt.is_active = true`
      : `LEFT JOIN partner_tracks pt ON pt.track_id = t.id AND pt.partner_id = $1 AND pt.is_active = true`;

    // 총 개수 (항상 동일한 JOIN 사용)
    const countResult = await pool.query(
      `SELECT COUNT(DISTINCT t.id) FROM tracks t ${partnerTrackJoin} ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(`
      SELECT
        t.id,
        t.title,
        t.artist,
        t.album,
        t.duration,
        t.mood,
        t.language,
        t.bpm,
        t.release_year,
        t.is_explicit,
        t.created_at,
        CASE WHEN pt.id IS NOT NULL THEN true ELSE false END as is_assigned,
        pt.share_rate,
        pt.role,
        (
          SELECT json_agg(json_build_object('id', c.id, 'name', c.name, 'is_primary', tc.is_primary))
          FROM track_categories tc
          JOIN categories c ON tc.category_id = c.id
          WHERE tc.track_id = t.id
        ) as categories
      FROM tracks t
      ${partnerTrackJoin}
      ${whereClause}
      ORDER BY t.${sortColumn} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, limitNum, offset]);

    res.json({
      tracks: result.rows.map(row => ({
        id: row.id,
        title: row.title,
        artist: row.artist,
        album: row.album,
        duration: row.duration,
        mood: row.mood,
        language: row.language,
        bpm: row.bpm,
        release_year: row.release_year,
        is_explicit: row.is_explicit,
        created_at: row.created_at,
        categories: row.categories || [],
        isAssigned: row.is_assigned,
        shareRate: row.share_rate ? Number(row.share_rate) : null,
        role: row.role,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Partner library error:', error);
    res.status(500).json({ error: 'Failed to fetch library' });
  }
});

// GET /api/partner/library/:trackId/stream - 트랙 스트리밍 (할당된 트랙만)
router.get('/library/:trackId/stream', authenticateToken as any, requirePartner, async (req: AuthRequest, res: Response) => {
  try {
    const partnerId = (req as any).partnerId;
    const { trackId } = req.params;

    // 할당된 트랙인지 확인
    const assignedResult = await pool.query(
      `SELECT pt.id FROM partner_tracks pt
       WHERE pt.partner_id = $1 AND pt.track_id = $2 AND pt.is_active = true`,
      [partnerId, trackId]
    );

    if (assignedResult.rows.length === 0) {
      return res.status(403).json({ error: '이 트랙에 대한 접근 권한이 없습니다' });
    }

    // 트랙 정보 조회
    const trackResult = await pool.query(
      'SELECT file_key FROM tracks WHERE id = $1',
      [trackId]
    );

    if (trackResult.rows.length === 0 || !trackResult.rows[0].file_key) {
      return res.status(404).json({ error: '트랙 파일을 찾을 수 없습니다' });
    }

    const streamUrl = await getStreamUrl(trackResult.rows[0].file_key);
    res.json({ streamUrl });
  } catch (error) {
    console.error('Partner stream error:', error);
    res.status(500).json({ error: 'Failed to get stream URL' });
  }
});

// GET /api/partner/library/:trackId/download - 트랙 다운로드 (할당된 트랙만)
router.get('/library/:trackId/download', authenticateToken as any, requirePartner, async (req: AuthRequest, res: Response) => {
  try {
    const partnerId = (req as any).partnerId;
    const { trackId } = req.params;

    // 할당된 트랙인지 확인
    const assignedResult = await pool.query(
      `SELECT pt.id FROM partner_tracks pt
       WHERE pt.partner_id = $1 AND pt.track_id = $2 AND pt.is_active = true`,
      [partnerId, trackId]
    );

    if (assignedResult.rows.length === 0) {
      return res.status(403).json({ error: '이 트랙에 대한 다운로드 권한이 없습니다' });
    }

    // 트랙 정보 조회
    const trackResult = await pool.query(
      'SELECT file_key, title, artist FROM tracks WHERE id = $1',
      [trackId]
    );

    if (trackResult.rows.length === 0 || !trackResult.rows[0].file_key) {
      return res.status(404).json({ error: '트랙 파일을 찾을 수 없습니다' });
    }

    const { file_key, title, artist } = trackResult.rows[0];
    const filename = `${artist} - ${title}.mp3`;

    // Supabase에서 파일 다운로드
    const fileBuffer = await downloadFile(file_key);

    // FLAC인 경우 MP3로 변환
    let outputBuffer: Buffer;
    const isFlac = file_key.toLowerCase().endsWith('.flac');

    if (isFlac) {
      const result = await transcodeToMp3(fileBuffer);
      outputBuffer = result.buffer;
    } else {
      outputBuffer = fileBuffer;
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Length', outputBuffer.length);
    res.send(outputBuffer);
  } catch (error) {
    console.error('Partner download error:', error);
    res.status(500).json({ error: 'Failed to download track' });
  }
});

// GET /api/partner/tracks - 내 트랙 목록
router.get('/tracks', authenticateToken as any, requirePartner, async (req: AuthRequest, res: Response) => {
  try {
    const partnerId = (req as any).partnerId;

    const result = await pool.query(`
      SELECT
        pt.id,
        pt.share_rate,
        pt.role,
        pt.is_active,
        t.id as track_id,
        t.title,
        t.artist,
        t.album
      FROM partner_tracks pt
      JOIN tracks t ON t.id = pt.track_id
      WHERE pt.partner_id = $1
      ORDER BY pt.is_active DESC, t.title ASC
    `, [partnerId]);

    res.json({
      tracks: result.rows.map(row => ({
        id: row.id,
        trackId: row.track_id,
        shareRate: Number(row.share_rate),
        role: row.role,
        isActive: row.is_active,
        title: row.title,
        artist: row.artist,
        album: row.album,
      })),
    });
  } catch (error) {
    console.error('Partner tracks error:', error);
    res.status(500).json({ error: 'Failed to fetch tracks' });
  }
});

// GET /api/partner/notifications - 알림 목록
router.get('/notifications', authenticateToken as any, requirePartner, async (req: AuthRequest, res: Response) => {
  try {
    const partnerId = (req as any).partnerId;

    const result = await pool.query(`
      SELECT
        sn.id,
        sn.notification_type,
        sn.title,
        sn.message,
        sn.is_read,
        sn.read_at,
        sn.created_at,
        ps.year_month
      FROM settlement_notifications sn
      LEFT JOIN partner_settlements ps ON ps.id = sn.partner_settlement_id
      WHERE sn.partner_id = $1
      ORDER BY sn.created_at DESC
      LIMIT 50
    `, [partnerId]);

    res.json({
      notifications: result.rows.map(row => ({
        id: row.id,
        type: row.notification_type,
        title: row.title,
        message: row.message,
        isRead: row.is_read,
        readAt: row.read_at,
        createdAt: row.created_at,
        yearMonth: row.year_month,
      })),
    });
  } catch (error) {
    console.error('Partner notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// PUT /api/partner/notifications/:id/read - 알림 읽음 처리
router.put('/notifications/:id/read', authenticateToken as any, requirePartner, async (req: AuthRequest, res: Response) => {
  try {
    const partnerId = (req as any).partnerId;
    const { id } = req.params;

    const result = await pool.query(`
      UPDATE settlement_notifications
      SET is_read = true, read_at = NOW()
      WHERE id = $1 AND partner_id = $2
      RETURNING id
    `, [id, partnerId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// PUT /api/partner/notifications/read-all - 모든 알림 읽음 처리
router.put('/notifications/read-all', authenticateToken as any, requirePartner, async (req: AuthRequest, res: Response) => {
  try {
    const partnerId = (req as any).partnerId;

    await pool.query(`
      UPDATE settlement_notifications
      SET is_read = true, read_at = NOW()
      WHERE partner_id = $1 AND is_read = false
    `, [partnerId]);

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// =====================================================
// 웹툰 프로젝트 (협업자)
// =====================================================

// GET /api/partner/projects - 협업자로 참여 중인 프로젝트 목록
router.get('/projects', authenticateToken as any, requirePartner, async (req: AuthRequest, res: Response) => {
  try {
    const partnerId = (req as any).partnerId;

    const result = await pool.query(`
      SELECT
        wp.id,
        wp.title,
        wp.description,
        wp.cover_image_key,
        wp.status,
        wp.created_at,
        wp.updated_at,
        pc.permission,
        pc.joined_at,
        u.name as creator_name,
        (SELECT COUNT(*) FROM webtoon_scenes ws WHERE ws.project_id = wp.id) as scene_count
      FROM project_collaborators pc
      JOIN webtoon_projects wp ON wp.id = pc.project_id
      LEFT JOIN users u ON u.id = wp.created_by
      WHERE pc.partner_id = $1
      ORDER BY pc.joined_at DESC
    `, [partnerId]);

    res.json({
      projects: result.rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        coverImageKey: row.cover_image_key,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        permission: row.permission,
        joinedAt: row.joined_at,
        creatorName: row.creator_name,
        sceneCount: Number(row.scene_count),
      })),
    });
  } catch (error) {
    console.error('Partner projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// GET /api/partner/projects/:id - 프로젝트 상세 조회
router.get('/projects/:id', authenticateToken as any, requirePartner, async (req: AuthRequest, res: Response) => {
  try {
    const partnerId = (req as any).partnerId;
    const { id } = req.params;

    // 협업자 권한 확인
    const collabResult = await pool.query(
      'SELECT permission FROM project_collaborators WHERE project_id = $1 AND partner_id = $2',
      [id, partnerId]
    );

    if (collabResult.rows.length === 0) {
      return res.status(403).json({ error: '이 프로젝트에 대한 접근 권한이 없습니다' });
    }

    // 프로젝트 정보
    const projectResult = await pool.query(`
      SELECT wp.*, u.name as creator_name
      FROM webtoon_projects wp
      LEFT JOIN users u ON u.id = wp.created_by
      WHERE wp.id = $1
    `, [id]);

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다' });
    }

    const project = projectResult.rows[0];

    // 장면 목록
    const scenesResult = await pool.query(`
      SELECT
        ws.id,
        ws.image_key,
        ws.thumbnail_key,
        ws.display_order,
        ws.memo,
        ws.scroll_trigger_position,
        (
          SELECT json_agg(json_build_object(
            'id', st.id,
            'trackId', t.id,
            'title', t.title,
            'artist', t.artist,
            'displayOrder', st.display_order
          ) ORDER BY st.display_order)
          FROM scene_tracks st
          JOIN tracks t ON t.id = st.track_id
          WHERE st.scene_id = ws.id
        ) as tracks
      FROM webtoon_scenes ws
      WHERE ws.project_id = $1
      ORDER BY ws.display_order
    `, [id]);

    res.json({
      project: {
        id: project.id,
        title: project.title,
        description: project.description,
        coverImageKey: project.cover_image_key,
        status: project.status,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
        creatorName: project.creator_name,
      },
      permission: collabResult.rows[0].permission,
      scenes: scenesResult.rows.map(row => ({
        id: row.id,
        imageKey: row.image_key,
        thumbnailKey: row.thumbnail_key,
        displayOrder: row.display_order,
        memo: row.memo,
        scrollTriggerPosition: row.scroll_trigger_position,
        tracks: row.tracks || [],
      })),
    });
  } catch (error) {
    console.error('Partner project detail error:', error);
    res.status(500).json({ error: 'Failed to fetch project details' });
  }
});

// GET /api/partner/profile - 내 프로필 조회
router.get('/profile', authenticateToken as any, requirePartner, async (req: AuthRequest, res: Response) => {
  try {
    const partnerId = (req as any).partnerId;

    const result = await pool.query(`
      SELECT p.*, u.email, u.name as user_name
      FROM partners p
      JOIN users u ON u.id = p.user_id
      WHERE p.id = $1
    `, [partnerId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    const partner = result.rows[0];

    res.json({
      profile: {
        id: partner.id,
        email: partner.email,
        userName: partner.user_name,
        partnerType: partner.partner_type,
        businessName: partner.business_name,
        representativeName: partner.representative_name,
        phone: partner.phone,
        address: partner.address,
        bankName: partner.bank_name,
        bankAccount: partner.bank_account,
        bankHolder: partner.bank_holder,
        createdAt: partner.created_at,
      },
    });
  } catch (error) {
    console.error('Partner profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PUT /api/partner/profile - 프로필 수정 (제한된 필드만)
router.put('/profile', authenticateToken as any, requirePartner, async (req: AuthRequest, res: Response) => {
  try {
    const partnerId = (req as any).partnerId;
    const { phone, address, bankName, bankAccount, bankHolder } = req.body;

    const result = await pool.query(`
      UPDATE partners SET
        phone = COALESCE($2, phone),
        address = COALESCE($3, address),
        bank_name = COALESCE($4, bank_name),
        bank_account = COALESCE($5, bank_account),
        bank_holder = COALESCE($6, bank_holder),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [partnerId, phone, address, bankName, bankAccount, bankHolder]);

    res.json({
      message: 'Profile updated successfully',
      profile: result.rows[0],
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
