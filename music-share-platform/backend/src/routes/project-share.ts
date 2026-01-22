import { Router, Response, Request } from 'express';
import { pool } from '../db';
import { AuthRequest } from '../types';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// 공유 링크 정보 조회 (비인증 접근 가능)
router.get('/share/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const result = await pool.query(
      `SELECT ps.*, wp.title as project_title
       FROM project_shares ps
       JOIN webtoon_projects wp ON ps.project_id = wp.id
       WHERE ps.share_token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        valid: false,
        error: '유효하지 않은 링크입니다',
      });
    }

    const share = result.rows[0];

    // 만료 체크
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return res.json({
        valid: false,
        error: '링크가 만료되었습니다',
      });
    }

    // 비활성화 체크
    if (!share.is_active) {
      return res.json({
        valid: false,
        error: '링크가 비활성화되었습니다',
      });
    }

    res.json({
      valid: true,
      projectTitle: share.project_title,
      requiresPartnerAccount: true,
    });
  } catch (error) {
    console.error('Error fetching share info:', error);
    res.status(500).json({ error: 'Failed to fetch share info' });
  }
});

// 프로젝트 참여 (인증 필요 + 파트너만)
router.post('/share/:token/join', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.params;
    const user = req.user!;

    // 파트너 계정 체크
    if (user.role !== 'partner') {
      return res.status(403).json({
        error: '파트너 계정만 접근 가능합니다',
      });
    }

    // 공유 링크 유효성 확인
    const shareResult = await pool.query(
      `SELECT ps.*, wp.title as project_title
       FROM project_shares ps
       JOIN webtoon_projects wp ON ps.project_id = wp.id
       WHERE ps.share_token = $1`,
      [token]
    );

    if (shareResult.rows.length === 0) {
      return res.status(404).json({
        error: '유효하지 않은 링크입니다',
      });
    }

    const share = shareResult.rows[0];

    // 만료 체크
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return res.status(400).json({
        error: '링크가 만료되었습니다',
      });
    }

    // 비활성화 체크
    if (!share.is_active) {
      return res.status(400).json({
        error: '링크가 비활성화되었습니다',
      });
    }

    // 파트너 정보 조회
    const partnerResult = await pool.query(
      'SELECT id FROM partners WHERE user_id = $1',
      [user.id]
    );

    if (partnerResult.rows.length === 0) {
      return res.status(403).json({
        error: '파트너 프로필이 없습니다. 관리자에게 문의하세요.',
      });
    }

    const partnerId = partnerResult.rows[0].id;

    // 이미 협업자인지 확인
    const existingResult = await pool.query(
      'SELECT id FROM project_collaborators WHERE project_id = $1 AND partner_id = $2',
      [share.project_id, partnerId]
    );

    if (existingResult.rows.length > 0) {
      // 이미 협업자면 바로 리다이렉트
      return res.json({
        success: true,
        projectId: share.project_id,
        redirectUrl: `/webtoon/${share.project_id}`,
        message: '이미 참여 중인 프로젝트입니다',
      });
    }

    // 협업자로 등록
    await pool.query(
      `INSERT INTO project_collaborators (project_id, partner_id, share_id, permission)
       VALUES ($1, $2, $3, 'edit')`,
      [share.project_id, partnerId, share.id]
    );

    res.json({
      success: true,
      projectId: share.project_id,
      redirectUrl: `/webtoon/${share.project_id}`,
      message: '프로젝트에 참여했습니다',
    });
  } catch (error) {
    console.error('Error joining project:', error);
    res.status(500).json({ error: 'Failed to join project' });
  }
});

export default router;
