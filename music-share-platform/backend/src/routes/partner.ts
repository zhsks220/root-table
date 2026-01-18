import { Router, Response } from 'express';
import { pool } from '../db';
import { authenticateToken } from '../middleware/auth';
import { AuthRequest } from '../types';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = Router();

// =====================================================
// 파트너 인증 (초대 코드로 회원가입)
// =====================================================

// POST /api/partner/register - 초대 코드로 파트너 회원가입
router.post('/register', async (req, res: Response) => {
  try {
    const { invitationCode, email, password, name } = req.body;

    if (!invitationCode || !email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // 초대 코드 확인
    const invitationResult = await pool.query(`
      SELECT * FROM partner_invitations
      WHERE invitation_code = $1
        AND is_used = false
        AND (expires_at IS NULL OR expires_at > NOW())
    `, [invitationCode]);

    if (invitationResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired invitation code' });
    }

    const invitation = invitationResult.rows[0];

    // 이메일 중복 확인
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 비밀번호 해시 (bcrypt 12 라운드)
      const passwordHash = await bcrypt.hash(password, 12);

      // 사용자 생성 (role: partner)
      const userResult = await client.query(`
        INSERT INTO users (email, password_hash, name, role, invitation_code)
        VALUES ($1, $2, $3, 'partner', $4)
        RETURNING id, email, name, role
      `, [email, passwordHash, name, invitationCode]);

      const user = userResult.rows[0];

      // 파트너 프로필 생성
      const partnerResult = await client.query(`
        INSERT INTO partners (
          user_id, partner_type, business_name, phone, default_share_rate, memo
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [
        user.id,
        invitation.partner_type,
        invitation.business_name || name,
        invitation.phone,
        invitation.default_share_rate,
        invitation.memo
      ]);

      const partnerId = partnerResult.rows[0].id;

      // 초대에 포함된 트랙 할당
      const invitationTracks = await client.query(`
        SELECT track_id, share_rate, role
        FROM partner_invitation_tracks
        WHERE invitation_id = $1
      `, [invitation.id]);

      for (const track of invitationTracks.rows) {
        await client.query(`
          INSERT INTO partner_tracks (partner_id, track_id, share_rate, role)
          VALUES ($1, $2, $3, $4)
        `, [partnerId, track.track_id, track.share_rate, track.role]);
      }

      // 초대 사용 처리
      await client.query(`
        UPDATE partner_invitations
        SET is_used = true, used_by = $2, used_at = NOW()
        WHERE id = $1
      `, [invitation.id, user.id]);

      await client.query('COMMIT');

      // JWT 토큰 생성
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
      }
      const token = jwt.sign(
        { id: user.id, email: user.email, role: 'partner', partnerId },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        message: 'Registration successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: 'partner',
          partnerId,
        },
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Partner registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/partner/login - 파트너 로그인
router.post('/login', async (req, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // 사용자 조회 (partner role만)
    const userResult = await pool.query(`
      SELECT u.*, p.id as partner_id, p.business_name, p.is_active as partner_active
      FROM users u
      LEFT JOIN partners p ON p.user_id = u.id
      WHERE u.email = $1 AND u.role = 'partner'
    `, [email]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = userResult.rows[0];

    // 파트너 활성화 상태 확인
    if (!user.partner_active) {
      return res.status(403).json({ error: 'Partner account is deactivated' });
    }

    // 비밀번호 확인
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
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
};

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
