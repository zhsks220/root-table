import { Router, Response } from 'express';
import { pool } from '../db';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { AuthRequest } from '../types';
import crypto from 'crypto';

const router = Router();

// 모든 파트너 관리 API는 인증 + 관리자 권한 필요
router.use(authenticateToken as any);
router.use(requireAdmin as any);

// =====================================================
// 파트너 CRUD
// =====================================================

// GET /api/partner/admin/partners - 파트너 목록 조회
router.get('/partners', async (req: AuthRequest, res: Response) => {
  try {
    const { type, status, search } = req.query;

    let query = `
      SELECT
        p.id,
        p.partner_type,
        p.business_name,
        p.representative_name,
        p.phone,
        p.default_share_rate,
        p.is_active,
        p.created_at,
        u.email,
        u.name as user_name,
        (SELECT COUNT(*) FROM partner_tracks pt WHERE pt.partner_id = p.id AND pt.is_active = true) as track_count,
        (SELECT COALESCE(SUM(ps.partner_share), 0) FROM partner_settlements ps WHERE ps.partner_id = p.id) as total_settlement
      FROM partners p
      LEFT JOIN users u ON u.id = p.user_id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (type) {
      query += ` AND p.partner_type = $${paramIndex++}`;
      params.push(type);
    }

    if (status === 'active') {
      query += ` AND p.is_active = true`;
    } else if (status === 'inactive') {
      query += ` AND p.is_active = false`;
    }

    if (search) {
      // ILIKE 와일드카드 이스케이프 처리
      const safeSearch = (search as string).replace(/[%_\\]/g, '\\$&');
      query += ` AND (p.business_name ILIKE $${paramIndex} OR p.representative_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
      params.push(`%${safeSearch}%`);
      paramIndex++;
    }

    query += ` ORDER BY p.created_at DESC`;

    const result = await pool.query(query, params);

    res.json({
      partners: result.rows.map(row => ({
        id: row.id,
        partnerType: row.partner_type,
        businessName: row.business_name,
        representativeName: row.representative_name,
        phone: row.phone,
        email: row.email,
        userName: row.user_name,
        defaultShareRate: Number(row.default_share_rate),
        isActive: row.is_active,
        trackCount: Number(row.track_count),
        totalSettlement: Number(row.total_settlement),
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    console.error('Partners list error:', error);
    res.status(500).json({ error: 'Failed to fetch partners' });
  }
});

// GET /api/partner/admin/partners/:id - 파트너 상세 조회
router.get('/partners/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT
        p.*,
        u.email,
        u.name as user_name
      FROM partners p
      LEFT JOIN users u ON u.id = p.user_id
      WHERE p.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    const partner = result.rows[0];

    // 파트너의 트랙 목록
    const tracksResult = await pool.query(`
      SELECT
        pt.id,
        pt.track_id,
        pt.share_rate,
        pt.role,
        pt.is_active,
        t.title,
        t.artist,
        t.album
      FROM partner_tracks pt
      JOIN tracks t ON t.id = pt.track_id
      WHERE pt.partner_id = $1
      ORDER BY t.title ASC
    `, [id]);

    // 최근 정산 내역
    const settlementsResult = await pool.query(`
      SELECT
        ps.id,
        ps.year_month,
        ps.total_gross_revenue,
        ps.partner_share,
        ps.status,
        ps.created_at
      FROM partner_settlements ps
      WHERE ps.partner_id = $1
      ORDER BY ps.year_month DESC
      LIMIT 12
    `, [id]);

    res.json({
      partner: {
        id: partner.id,
        userId: partner.user_id,
        partnerType: partner.partner_type,
        businessName: partner.business_name,
        representativeName: partner.representative_name,
        businessNumber: partner.business_number,
        phone: partner.phone,
        address: partner.address,
        bankName: partner.bank_name,
        bankAccount: partner.bank_account,
        bankHolder: partner.bank_holder,
        contractStartDate: partner.contract_start_date,
        contractEndDate: partner.contract_end_date,
        defaultShareRate: Number(partner.default_share_rate),
        memo: partner.memo,
        isActive: partner.is_active,
        email: partner.email,
        userName: partner.user_name,
        createdAt: partner.created_at,
      },
      tracks: tracksResult.rows.map(row => ({
        id: row.id,
        trackId: row.track_id,
        shareRate: Number(row.share_rate),
        role: row.role,
        isActive: row.is_active,
        title: row.title,
        artist: row.artist,
        album: row.album,
      })),
      recentSettlements: settlementsResult.rows.map(row => ({
        id: row.id,
        yearMonth: row.year_month,
        grossRevenue: Number(row.total_gross_revenue),
        partnerShare: Number(row.partner_share),
        status: row.status,
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    console.error('Partner detail error:', error);
    res.status(500).json({ error: 'Failed to fetch partner details' });
  }
});

// PUT /api/partner/admin/partners/:id - 파트너 수정
router.put('/partners/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      partnerType,
      businessName,
      representativeName,
      businessNumber,
      phone,
      address,
      bankName,
      bankAccount,
      bankHolder,
      contractStartDate,
      contractEndDate,
      defaultShareRate,
      memo,
      isActive,
    } = req.body;

    const result = await pool.query(`
      UPDATE partners SET
        partner_type = COALESCE($2, partner_type),
        business_name = COALESCE($3, business_name),
        representative_name = COALESCE($4, representative_name),
        business_number = COALESCE($5, business_number),
        phone = COALESCE($6, phone),
        address = COALESCE($7, address),
        bank_name = COALESCE($8, bank_name),
        bank_account = COALESCE($9, bank_account),
        bank_holder = COALESCE($10, bank_holder),
        contract_start_date = COALESCE($11, contract_start_date),
        contract_end_date = COALESCE($12, contract_end_date),
        default_share_rate = COALESCE($13, default_share_rate),
        memo = COALESCE($14, memo),
        is_active = COALESCE($15, is_active),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [
      id,
      partnerType,
      businessName,
      representativeName,
      businessNumber,
      phone,
      address,
      bankName,
      bankAccount,
      bankHolder,
      contractStartDate,
      contractEndDate,
      defaultShareRate,
      memo,
      isActive,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    res.json({
      message: 'Partner updated successfully',
      partner: result.rows[0],
    });
  } catch (error) {
    console.error('Partner update error:', error);
    res.status(500).json({ error: 'Failed to update partner' });
  }
});

// DELETE /api/partner/admin/partners/:id - 파트너 비활성화
router.delete('/partners/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // 실제 삭제가 아닌 비활성화
    const result = await pool.query(`
      UPDATE partners SET is_active = false, updated_at = NOW()
      WHERE id = $1
      RETURNING id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    res.json({ message: 'Partner deactivated successfully' });
  } catch (error) {
    console.error('Partner delete error:', error);
    res.status(500).json({ error: 'Failed to deactivate partner' });
  }
});

// =====================================================
// 파트너-트랙 관리
// =====================================================

// GET /api/partner/admin/partners/:id/tracks - 파트너의 트랙 목록
router.get('/partners/:id/tracks', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT
        pt.id,
        pt.track_id,
        pt.share_rate,
        pt.role,
        pt.contract_start_date,
        pt.contract_end_date,
        pt.is_active,
        t.title,
        t.artist,
        t.album
      FROM partner_tracks pt
      JOIN tracks t ON t.id = pt.track_id
      WHERE pt.partner_id = $1
      ORDER BY pt.is_active DESC, t.title ASC
    `, [id]);

    res.json({
      tracks: result.rows.map(row => ({
        id: row.id,
        trackId: row.track_id,
        shareRate: Number(row.share_rate),
        role: row.role,
        contractStartDate: row.contract_start_date,
        contractEndDate: row.contract_end_date,
        isActive: row.is_active,
        title: row.title,
        artist: row.artist,
        album: row.album,
      })),
    });
  } catch (error) {
    console.error('Partner tracks error:', error);
    res.status(500).json({ error: 'Failed to fetch partner tracks' });
  }
});

// POST /api/partner/admin/partners/:id/tracks - 트랙 할당
router.post('/partners/:id/tracks', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { trackId, shareRate, role = 'artist', contractStartDate, contractEndDate } = req.body;

    if (!trackId) {
      return res.status(400).json({ error: 'Track ID is required' });
    }

    const result = await pool.query(`
      INSERT INTO partner_tracks (partner_id, track_id, share_rate, role, contract_start_date, contract_end_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (partner_id, track_id)
      DO UPDATE SET
        share_rate = $3,
        role = $4,
        contract_start_date = $5,
        contract_end_date = $6,
        is_active = true,
        updated_at = NOW()
      RETURNING *
    `, [id, trackId, shareRate || 0, role, contractStartDate, contractEndDate]);

    res.json({
      message: 'Track assigned successfully',
      partnerTrack: result.rows[0],
    });
  } catch (error) {
    console.error('Assign track error:', error);
    res.status(500).json({ error: 'Failed to assign track' });
  }
});

// DELETE /api/partner/admin/partners/:partnerId/tracks/:trackId - 트랙 할당 해제
router.delete('/partners/:partnerId/tracks/:trackId', async (req: AuthRequest, res: Response) => {
  try {
    const { partnerId, trackId } = req.params;

    const result = await pool.query(`
      UPDATE partner_tracks SET is_active = false, updated_at = NOW()
      WHERE partner_id = $1 AND track_id = $2
      RETURNING id
    `, [partnerId, trackId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Partner track not found' });
    }

    res.json({ message: 'Track unassigned successfully' });
  } catch (error) {
    console.error('Unassign track error:', error);
    res.status(500).json({ error: 'Failed to unassign track' });
  }
});

// =====================================================
// 파트너 초대 관리
// =====================================================

// GET /api/partner/admin/invitations - 초대 목록
router.get('/invitations', async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT
        pi.*,
        u.name as created_by_name,
        ub.name as used_by_name,
        ub.email as used_by_email,
        (SELECT COUNT(*) FROM partner_invitation_tracks pit WHERE pit.invitation_id = pi.id) as track_count
      FROM partner_invitations pi
      LEFT JOIN users u ON u.id = pi.created_by
      LEFT JOIN users ub ON ub.id = pi.used_by
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status === 'pending') {
      query += ` AND pi.is_used = false AND (pi.expires_at IS NULL OR pi.expires_at > NOW())`;
    } else if (status === 'used') {
      query += ` AND pi.is_used = true`;
    } else if (status === 'expired') {
      query += ` AND pi.is_used = false AND pi.expires_at < NOW()`;
    }

    query += ` ORDER BY pi.created_at DESC`;

    const result = await pool.query(query, params);

    res.json({
      invitations: result.rows.map(row => ({
        id: row.id,
        invitationCode: row.invitation_code,
        partnerType: row.partner_type,
        businessName: row.business_name,
        email: row.email,
        phone: row.phone,
        defaultShareRate: Number(row.default_share_rate),
        memo: row.memo,
        isUsed: row.is_used,
        usedByName: row.used_by_name,
        usedByEmail: row.used_by_email,
        usedAt: row.used_at,
        expiresAt: row.expires_at,
        createdByName: row.created_by_name,
        createdAt: row.created_at,
        trackCount: Number(row.track_count),
      })),
    });
  } catch (error) {
    console.error('Invitations list error:', error);
    res.status(500).json({ error: 'Failed to fetch invitations' });
  }
});

// POST /api/partner/admin/invitations - 파트너 초대 생성
router.post('/invitations', async (req: AuthRequest, res: Response) => {
  try {
    const {
      partnerType,
      businessName,
      email,
      phone,
      defaultShareRate,
      memo,
      expiresInDays = 30,
      tracks = [],
    } = req.body;

    if (!partnerType) {
      return res.status(400).json({ error: 'Partner type is required' });
    }

    // 초대 코드 생성
    const invitationCode = 'PT-' + crypto.randomBytes(8).toString('hex').toUpperCase();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 초대 생성
      const invitationResult = await client.query(`
        INSERT INTO partner_invitations (
          invitation_code, partner_type, business_name, email, phone,
          default_share_rate, memo, expires_at, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        invitationCode,
        partnerType,
        businessName,
        email,
        phone,
        defaultShareRate || 0,
        memo,
        expiresAt,
        req.user!.id,
      ]);

      const invitation = invitationResult.rows[0];

      // 트랙 할당
      if (tracks.length > 0) {
        for (const track of tracks) {
          await client.query(`
            INSERT INTO partner_invitation_tracks (invitation_id, track_id, share_rate, role)
            VALUES ($1, $2, $3, $4)
          `, [invitation.id, track.trackId, track.shareRate || 0, track.role || 'artist']);
        }
      }

      await client.query('COMMIT');

      res.json({
        message: 'Invitation created successfully',
        invitation: {
          id: invitation.id,
          invitationCode: invitation.invitation_code,
          partnerType: invitation.partner_type,
          businessName: invitation.business_name,
          email: invitation.email,
          expiresAt: invitation.expires_at,
          trackCount: tracks.length,
        },
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Create invitation error:', error);
    res.status(500).json({ error: 'Failed to create invitation' });
  }
});

// DELETE /api/partner/admin/invitations/:id - 초대 취소
router.delete('/invitations/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      DELETE FROM partner_invitations
      WHERE id = $1 AND is_used = false
      RETURNING id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invitation not found or already used' });
    }

    res.json({ message: 'Invitation cancelled successfully' });
  } catch (error) {
    console.error('Cancel invitation error:', error);
    res.status(500).json({ error: 'Failed to cancel invitation' });
  }
});

// =====================================================
// 정산 할당 관리
// =====================================================

// POST /api/partner/admin/settlements/allocate - 정산 데이터 할당
router.post('/settlements/allocate', async (req: AuthRequest, res: Response) => {
  try {
    const { yearMonth } = req.body;

    if (!yearMonth) {
      return res.status(400).json({ error: 'Year-month is required' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 활성 파트너 목록 조회
      const partnersResult = await client.query(`
        SELECT DISTINCT p.id, p.business_name
        FROM partners p
        JOIN partner_tracks pt ON pt.partner_id = p.id AND pt.is_active = true
        WHERE p.is_active = true
      `);

      let allocatedCount = 0;

      for (const partner of partnersResult.rows) {
        // 해당 파트너의 트랙들의 정산 데이터 집계
        const settlementData = await client.query(`
          SELECT
            pt.track_id,
            pt.share_rate,
            ms.distributor_id,
            ms.gross_revenue,
            ms.net_revenue,
            ms.stream_count,
            ms.download_count,
            ms.id as source_settlement_id
          FROM partner_tracks pt
          JOIN monthly_settlements ms ON ms.track_id = pt.track_id
          WHERE pt.partner_id = $1
            AND pt.is_active = true
            AND ms.year_month = $2
        `, [partner.id, yearMonth]);

        if (settlementData.rows.length === 0) continue;

        // 파트너 정산 합계 계산
        let totalGross = 0;
        let totalNet = 0;
        let totalPartnerShare = 0;
        let totalStreams = 0;
        let totalDownloads = 0;

        for (const row of settlementData.rows) {
          const partnerShare = Number(row.net_revenue) * (Number(row.share_rate) / 100);
          totalGross += Number(row.gross_revenue);
          totalNet += Number(row.net_revenue);
          totalPartnerShare += partnerShare;
          totalStreams += Number(row.stream_count);
          totalDownloads += Number(row.download_count);
        }

        const managementFee = totalNet - totalPartnerShare;

        // 파트너 정산 레코드 생성/업데이트
        const partnerSettlementResult = await client.query(`
          INSERT INTO partner_settlements (
            partner_id, year_month, total_gross_revenue, total_net_revenue,
            partner_share, management_fee, total_streams, total_downloads,
            status, created_by
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9)
          ON CONFLICT (partner_id, year_month)
          DO UPDATE SET
            total_gross_revenue = $3,
            total_net_revenue = $4,
            partner_share = $5,
            management_fee = $6,
            total_streams = $7,
            total_downloads = $8,
            updated_at = NOW()
          RETURNING id
        `, [
          partner.id, yearMonth, totalGross, totalNet,
          totalPartnerShare, managementFee, totalStreams, totalDownloads,
          req.user!.id
        ]);

        const partnerSettlementId = partnerSettlementResult.rows[0].id;

        // 기존 상세 내역 삭제 후 재생성
        await client.query(`
          DELETE FROM partner_settlement_details WHERE partner_settlement_id = $1
        `, [partnerSettlementId]);

        // 상세 내역 생성
        for (const row of settlementData.rows) {
          const partnerShare = Number(row.net_revenue) * (Number(row.share_rate) / 100);

          await client.query(`
            INSERT INTO partner_settlement_details (
              partner_settlement_id, track_id, distributor_id,
              gross_revenue, net_revenue, share_rate, partner_share,
              stream_count, download_count, source_settlement_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `, [
            partnerSettlementId, row.track_id, row.distributor_id,
            row.gross_revenue, row.net_revenue, row.share_rate, partnerShare,
            row.stream_count, row.download_count, row.source_settlement_id
          ]);
        }

        // 알림 생성
        await client.query(`
          INSERT INTO settlement_notifications (
            partner_id, partner_settlement_id, notification_type, title, message
          )
          VALUES ($1, $2, 'settlement_ready', $3, $4)
        `, [
          partner.id,
          partnerSettlementId,
          `${yearMonth} 정산 데이터가 등록되었습니다`,
          `${yearMonth}월 정산 금액: ${totalPartnerShare.toLocaleString()}원`
        ]);

        allocatedCount++;
      }

      await client.query('COMMIT');

      res.json({
        message: 'Settlement allocation completed',
        yearMonth,
        allocatedPartners: allocatedCount,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Settlement allocation error:', error);
    res.status(500).json({ error: 'Failed to allocate settlements' });
  }
});

// GET /api/partner/admin/settlements - 파트너별 정산 현황
router.get('/settlements', async (req: AuthRequest, res: Response) => {
  try {
    const { yearMonth, partnerId, status } = req.query;

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
        ps.created_at,
        p.business_name,
        p.partner_type,
        p.representative_name
      FROM partner_settlements ps
      JOIN partners p ON p.id = ps.partner_id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (yearMonth) {
      query += ` AND ps.year_month = $${paramIndex++}`;
      params.push(yearMonth);
    }

    if (partnerId) {
      query += ` AND ps.partner_id = $${paramIndex++}`;
      params.push(partnerId);
    }

    if (status) {
      query += ` AND ps.status = $${paramIndex++}`;
      params.push(status);
    }

    query += ` ORDER BY ps.year_month DESC, ps.partner_share DESC`;

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
        businessName: row.business_name,
        partnerType: row.partner_type,
        representativeName: row.representative_name,
      })),
    });
  } catch (error) {
    console.error('Partner settlements error:', error);
    res.status(500).json({ error: 'Failed to fetch partner settlements' });
  }
});

// PUT /api/partner/admin/settlements/:id/status - 정산 상태 변경
router.put('/settlements/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, paymentRef } = req.body;

    if (!['pending', 'confirmed', 'paid'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    let updateFields = 'status = $2, updated_at = NOW()';
    const params: any[] = [id, status];

    if (status === 'confirmed') {
      updateFields += ', confirmed_at = NOW()';
    } else if (status === 'paid') {
      updateFields += ', paid_at = NOW()';
      if (paymentRef) {
        updateFields += ', payment_ref = $3';
        params.push(paymentRef);
      }
    }

    const result = await pool.query(`
      UPDATE partner_settlements SET ${updateFields}
      WHERE id = $1
      RETURNING *
    `, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Settlement not found' });
    }

    // 상태 변경 알림 생성
    const settlement = result.rows[0];
    let notificationType = 'general';
    let title = '';

    if (status === 'confirmed') {
      notificationType = 'settlement_confirmed';
      title = `${settlement.year_month} 정산이 확정되었습니다`;
    } else if (status === 'paid') {
      notificationType = 'payment_complete';
      title = `${settlement.year_month} 정산금이 지급되었습니다`;
    }

    if (title) {
      await pool.query(`
        INSERT INTO settlement_notifications (
          partner_id, partner_settlement_id, notification_type, title
        )
        VALUES ($1, $2, $3, $4)
      `, [settlement.partner_id, settlement.id, notificationType, title]);
    }

    res.json({
      message: 'Settlement status updated',
      settlement: result.rows[0],
    });
  } catch (error) {
    console.error('Update settlement status error:', error);
    res.status(500).json({ error: 'Failed to update settlement status' });
  }
});

// GET /api/partner/admin/tracks - 할당 가능한 트랙 목록
router.get('/tracks', async (req: AuthRequest, res: Response) => {
  try {
    const { search } = req.query;

    let query = `
      SELECT id, title, artist, album, created_at
      FROM tracks
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      // ILIKE 와일드카드 이스케이프 처리
      const safeSearch = (search as string).replace(/[%_\\]/g, '\\$&');
      query += ` AND (title ILIKE $1 OR artist ILIKE $1 OR album ILIKE $1)`;
      params.push(`%${safeSearch}%`);
    }

    query += ` ORDER BY title ASC LIMIT 100`;

    const result = await pool.query(query, params);

    res.json({
      tracks: result.rows.map(row => ({
        id: row.id,
        title: row.title,
        artist: row.artist,
        album: row.album,
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    console.error('Tracks list error:', error);
    res.status(500).json({ error: 'Failed to fetch tracks' });
  }
});

export default router;
