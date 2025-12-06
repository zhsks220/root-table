import { Router, Response } from 'express';
import { z } from 'zod';
import { pool } from '../db';
import { AuthRequest } from '../types';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// 초대 코드 검증
router.get('/:code', async (req, res: Response) => {
  try {
    const { code } = req.params;

    const result = await pool.query(
      `SELECT id, code, is_used, expires_at,
        (SELECT COUNT(*) FROM invitation_tracks WHERE invitation_id = invitations.id) as track_count
       FROM invitations
       WHERE code = $1`,
      [code]
    );

    if (result.rows.length === 0) {
      return res.json({ valid: false, error: 'Invitation not found' });
    }

    const invitation = result.rows[0];

    // 이미 사용됨
    if (invitation.is_used) {
      return res.json({ valid: false, error: 'Invitation already used' });
    }

    // 만료됨
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      return res.json({ valid: false, error: 'Invitation expired' });
    }

    res.json({
      valid: true,
      code: invitation.code,
      trackCount: parseInt(invitation.track_count),
      expiresAt: invitation.expires_at,
    });
  } catch (error) {
    console.error('Invitation validation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
