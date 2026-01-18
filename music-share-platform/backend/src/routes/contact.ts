import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { AuthRequest } from '../types';
import { sendContactNotification, sendChatbotNotification } from '../services/emailService';

const router = Router();

// =====================================================
// 공개 API (인증 불필요)
// =====================================================

// POST /api/contact - 상담 신청 접수
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, organization, email, workLink, message } = req.body;

    // 필수 필드 검증
    if (!name || !email || !workLink) {
      return res.status(400).json({
        error: '필수 항목을 입력해주세요.',
        required: ['name', 'email', 'workLink']
      });
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: '유효한 이메일 주소를 입력해주세요.' });
    }

    // URL 형식 검증 및 SSRF 방어
    try {
      const parsedUrl = new URL(workLink);

      // SSRF 방어: 내부 네트워크 접근 차단
      const hostname = parsedUrl.hostname.toLowerCase();
      const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '[::1]'];
      if (blockedHosts.includes(hostname)) {
        return res.status(400).json({ error: '허용되지 않는 URL입니다.' });
      }

      // 내부 IP 대역 차단 (10.x.x.x, 172.16-31.x.x, 192.168.x.x)
      const ipMatch = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
      if (ipMatch) {
        const [, a, b] = ipMatch.map(Number);
        if (a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) {
          return res.status(400).json({ error: '허용되지 않는 URL입니다.' });
        }
      }

      // 허용된 프로토콜만 (http, https)
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return res.status(400).json({ error: '허용되지 않는 URL 프로토콜입니다.' });
      }
    } catch {
      return res.status(400).json({ error: '유효한 작품 링크를 입력해주세요.' });
    }

    // 상담 신청 저장
    const result = await pool.query(`
      INSERT INTO contact_inquiries (name, organization, email, work_link, message)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, created_at
    `, [name, organization || null, email, workLink, message || null]);

    const inquiry = result.rows[0];

    // 이메일 알림 발송 (비동기, 실패해도 응답에 영향 없음)
    sendContactNotification({
      name,
      organization,
      email,
      workLink,
      message,
      createdAt: inquiry.created_at
    }).catch(err => {
      console.error('Failed to send contact notification email:', err);
    });

    res.status(201).json({
      success: true,
      message: '상담 신청이 접수되었습니다. 빠른 시일 내에 연락드리겠습니다.',
      inquiryId: inquiry.id,
      createdAt: inquiry.created_at
    });
  } catch (error) {
    console.error('Contact submission error:', error);
    res.status(500).json({ error: '상담 신청 중 오류가 발생했습니다.' });
  }
});

// POST /api/contact/chatbot - 챗봇 문의 접수
router.post('/chatbot', async (req: Request, res: Response) => {
  try {
    const {
      clientType,
      workTitle,
      workLink,
      genres,
      musicTypes,
      estimatedTracks,
      timeline,
      budget,
      additionalNotes,
      name,
      email,
      organization,
      sessionId,
    } = req.body;

    // 필수 필드 검증
    if (!clientType || !workTitle || !name || !email) {
      return res.status(400).json({
        error: '필수 항목을 입력해주세요.',
        required: ['clientType', 'workTitle', 'name', 'email']
      });
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: '유효한 이메일 주소를 입력해주세요.' });
    }

    // URL 형식 검증 및 SSRF 방어 (제공된 경우)
    if (workLink) {
      try {
        const parsedUrl = new URL(workLink);

        // SSRF 방어: 내부 네트워크 접근 차단
        const hostname = parsedUrl.hostname.toLowerCase();
        const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '[::1]'];
        if (blockedHosts.includes(hostname)) {
          return res.status(400).json({ error: '허용되지 않는 URL입니다.' });
        }

        // 내부 IP 대역 차단
        const ipMatch = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
        if (ipMatch) {
          const [, a, b] = ipMatch.map(Number);
          if (a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) {
            return res.status(400).json({ error: '허용되지 않는 URL입니다.' });
          }
        }

        // 허용된 프로토콜만
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          return res.status(400).json({ error: '허용되지 않는 URL 프로토콜입니다.' });
        }
      } catch {
        return res.status(400).json({ error: '유효한 작품 링크를 입력해주세요.' });
      }
    }

    // 챗봇 문의 저장 (기존 contact_inquiries 테이블에 추가 정보와 함께 저장)
    // message 필드에 챗봇 데이터를 JSON으로 저장
    const chatbotData = {
      clientType,
      genres: genres || [],
      musicTypes: musicTypes || [],
      estimatedTracks,
      timeline,
      budget,
      additionalNotes,
      sessionId,
      source: 'chatbot',
    };

    const result = await pool.query(`
      INSERT INTO contact_inquiries (name, organization, email, work_link, message)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, created_at
    `, [
      name,
      organization || null,
      email,
      workLink || workTitle, // workLink가 없으면 workTitle을 저장
      JSON.stringify(chatbotData)
    ]);

    const inquiry = result.rows[0];

    // 이메일 알림 발송 (비동기)
    sendChatbotNotification({
      clientType,
      workTitle,
      workLink,
      genres: genres || [],
      musicTypes: musicTypes || [],
      estimatedTracks,
      timeline,
      budget,
      additionalNotes,
      name,
      email,
      organization,
      sessionId,
      createdAt: inquiry.created_at,
    }).catch(err => {
      console.error('Failed to send chatbot notification email:', err);
    });

    res.status(201).json({
      success: true,
      message: '프로젝트 문의가 접수되었습니다. 빠른 시일 내에 연락드리겠습니다.',
      inquiryId: inquiry.id,
      createdAt: inquiry.created_at
    });
  } catch (error) {
    console.error('Chatbot submission error:', error);
    res.status(500).json({ error: '문의 접수 중 오류가 발생했습니다.' });
  }
});

// =====================================================
// 관리자 API (CMS 전용)
// =====================================================

// GET /api/contact/admin - 문의 목록 조회
router.get('/admin', authenticateToken as any, requireAdmin as any, async (req: AuthRequest, res: Response) => {
  try {
    const { status, page = '1', limit = '20', search } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const offset = (pageNum - 1) * limitNum;

    let query = `
      SELECT
        ci.*,
        u.name as responded_by_name
      FROM contact_inquiries ci
      LEFT JOIN users u ON u.id = ci.responded_by
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    // 상태 필터
    if (status && status !== 'all') {
      query += ` AND ci.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // 검색 (이름, 이메일, 소속)
    if (search) {
      // SQL Injection 방어: ILIKE 와일드카드 이스케이프
      const safeSearch = (search as string).replace(/[%_\\]/g, '\\$&');
      query += ` AND (ci.name ILIKE $${paramIndex} OR ci.email ILIKE $${paramIndex} OR ci.organization ILIKE $${paramIndex})`;
      params.push(`%${safeSearch}%`);
      paramIndex++;
    }

    // 전체 개수 조회
    const countQuery = query.replace('SELECT\n        ci.*,\n        u.name as responded_by_name', 'SELECT COUNT(*) as total');
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // 정렬 및 페이지네이션
    query += ` ORDER BY ci.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limitNum, offset);

    const result = await pool.query(query, params);

    res.json({
      inquiries: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        organization: row.organization,
        email: row.email,
        workLink: row.work_link,
        message: row.message,
        status: row.status,
        adminNotes: row.admin_notes,
        respondedAt: row.responded_at,
        respondedByName: row.responded_by_name,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Admin inquiries list error:', error);
    res.status(500).json({ error: '문의 목록 조회 중 오류가 발생했습니다.' });
  }
});

// GET /api/contact/admin/stats - 문의 통계
router.get('/admin/stats', authenticateToken as any, requireAdmin as any, async (req: AuthRequest, res: Response) => {
  try {
    const statsResult = await pool.query(`
      SELECT
        status,
        COUNT(*) as count
      FROM contact_inquiries
      GROUP BY status
    `);

    const todayResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM contact_inquiries
      WHERE DATE(created_at) = CURRENT_DATE
    `);

    const weekResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM contact_inquiries
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `);

    const statusCounts: Record<string, number> = {
      pending: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0
    };

    statsResult.rows.forEach(row => {
      statusCounts[row.status] = parseInt(row.count);
    });

    const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

    res.json({
      total,
      byStatus: statusCounts,
      today: parseInt(todayResult.rows[0].count),
      thisWeek: parseInt(weekResult.rows[0].count)
    });
  } catch (error) {
    console.error('Admin inquiries stats error:', error);
    res.status(500).json({ error: '통계 조회 중 오류가 발생했습니다.' });
  }
});

// GET /api/contact/admin/:id - 문의 상세 조회
router.get('/admin/:id', authenticateToken as any, requireAdmin as any, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT
        ci.*,
        u.name as responded_by_name
      FROM contact_inquiries ci
      LEFT JOIN users u ON u.id = ci.responded_by
      WHERE ci.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '문의를 찾을 수 없습니다.' });
    }

    const row = result.rows[0];

    res.json({
      inquiry: {
        id: row.id,
        name: row.name,
        organization: row.organization,
        email: row.email,
        workLink: row.work_link,
        message: row.message,
        status: row.status,
        adminNotes: row.admin_notes,
        respondedAt: row.responded_at,
        respondedByName: row.responded_by_name,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }
    });
  } catch (error) {
    console.error('Admin inquiry detail error:', error);
    res.status(500).json({ error: '문의 상세 조회 중 오류가 발생했습니다.' });
  }
});

// PUT /api/contact/admin/:id - 문의 상태 변경
router.put('/admin/:id', authenticateToken as any, requireAdmin as any, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    // 상태 검증
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        error: '유효하지 않은 상태입니다.',
        validStatuses
      });
    }

    // 현재 문의 확인
    const checkResult = await pool.query('SELECT id FROM contact_inquiries WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: '문의를 찾을 수 없습니다.' });
    }

    // 업데이트 쿼리 구성
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      updates.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;

      // 완료 상태로 변경 시 응답 시간 기록
      if (status === 'completed' || status === 'in_progress') {
        updates.push(`responded_at = NOW()`);
        updates.push(`responded_by = $${paramIndex}`);
        params.push(req.user!.id);
        paramIndex++;
      }
    }

    if (adminNotes !== undefined) {
      updates.push(`admin_notes = $${paramIndex}`);
      params.push(adminNotes);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: '변경할 내용이 없습니다.' });
    }

    params.push(id);
    const updateQuery = `
      UPDATE contact_inquiries
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(updateQuery, params);
    const row = result.rows[0];

    res.json({
      success: true,
      message: '문의가 업데이트되었습니다.',
      inquiry: {
        id: row.id,
        status: row.status,
        adminNotes: row.admin_notes,
        respondedAt: row.responded_at,
        updatedAt: row.updated_at
      }
    });
  } catch (error) {
    console.error('Admin inquiry update error:', error);
    res.status(500).json({ error: '문의 업데이트 중 오류가 발생했습니다.' });
  }
});

// DELETE /api/contact/admin/:id - 문의 삭제
router.delete('/admin/:id', authenticateToken as any, requireAdmin as any, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM contact_inquiries WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '문의를 찾을 수 없습니다.' });
    }

    res.json({
      success: true,
      message: '문의가 삭제되었습니다.',
      deletedId: id
    });
  } catch (error) {
    console.error('Admin inquiry delete error:', error);
    res.status(500).json({ error: '문의 삭제 중 오류가 발생했습니다.' });
  }
});

export default router;
