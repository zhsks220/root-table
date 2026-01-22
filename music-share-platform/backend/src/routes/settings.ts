import { Router, Response } from 'express';
import { pool } from '../db';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { AuthRequest } from '../types';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const router = Router();

// =====================================================
// 공통 설정 API (모든 인증된 사용자)
// =====================================================

// 비밀번호 정책: 6자 이상, 영문자 + 숫자 조합 필수
const passwordSchema = z.string()
  .min(6, '비밀번호는 6자 이상이어야 합니다')
  .regex(/[a-zA-Z]/, '비밀번호에 영문자가 포함되어야 합니다')
  .regex(/[0-9]/, '비밀번호에 숫자가 포함되어야 합니다');

// 비밀번호 변경 스키마
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});

// PUT /api/settings/password - 비밀번호 변경
router.put('/password', authenticateToken as any, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    // 현재 비밀번호 확인
    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValid = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // 새 비밀번호 해싱 및 저장 (bcrypt 12 라운드)
    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPasswordHash, userId]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// PUT /api/settings/profile - 기본 프로필 수정 (이름)
router.put('/profile', authenticateToken as any, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await pool.query(
      'UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, name, role',
      [name.trim(), userId]
    );

    res.json({
      message: 'Profile updated successfully',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// GET /api/settings/me - 내 정보 조회
router.get('/me', authenticateToken as any, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const result = await pool.query(
      'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// =====================================================
// 관리자 설정 API
// =====================================================

// GET /api/settings/admin/distributors - 유통사 목록
router.get('/admin/distributors', authenticateToken as any, requireAdmin as any, async (_req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT id, name, code, commission_rate, is_active, created_at
      FROM distributors
      ORDER BY is_active DESC, name ASC
    `);

    res.json({ distributors: result.rows });
  } catch (error) {
    console.error('Get distributors error:', error);
    res.status(500).json({ error: 'Failed to get distributors' });
  }
});

// POST /api/settings/admin/distributors - 유통사 추가
router.post('/admin/distributors', authenticateToken as any, requireAdmin as any, async (req: AuthRequest, res: Response) => {
  try {
    const { name, code, commissionRate } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Name and code are required' });
    }

    const result = await pool.query(`
      INSERT INTO distributors (name, code, commission_rate, is_active)
      VALUES ($1, $2, $3, true)
      RETURNING *
    `, [name, code, commissionRate || 0]);

    res.status(201).json({
      message: 'Distributor created successfully',
      distributor: result.rows[0],
    });
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Distributor code already exists' });
    }
    console.error('Create distributor error:', error);
    res.status(500).json({ error: 'Failed to create distributor' });
  }
});

// PUT /api/settings/admin/distributors/:id - 유통사 수정
router.put('/admin/distributors/:id', authenticateToken as any, requireAdmin as any, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, code, commissionRate, isActive } = req.body;

    const result = await pool.query(`
      UPDATE distributors SET
        name = COALESCE($2, name),
        code = COALESCE($3, code),
        commission_rate = COALESCE($4, commission_rate),
        is_active = COALESCE($5, is_active),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id, name, code, commissionRate, isActive]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Distributor not found' });
    }

    res.json({
      message: 'Distributor updated successfully',
      distributor: result.rows[0],
    });
  } catch (error) {
    console.error('Update distributor error:', error);
    res.status(500).json({ error: 'Failed to update distributor' });
  }
});

// DELETE /api/settings/admin/distributors/:id - 유통사 삭제 (비활성화)
router.delete('/admin/distributors/:id', authenticateToken as any, requireAdmin as any, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      UPDATE distributors SET is_active = false, updated_at = NOW()
      WHERE id = $1
      RETURNING id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Distributor not found' });
    }

    res.json({ message: 'Distributor deactivated successfully' });
  } catch (error) {
    console.error('Delete distributor error:', error);
    res.status(500).json({ error: 'Failed to delete distributor' });
  }
});

// GET /api/settings/admin/system - 시스템 설정 조회
router.get('/admin/system', authenticateToken as any, requireAdmin as any, async (_req: AuthRequest, res: Response) => {
  try {
    // 시스템 통계
    const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE role = 'partner') as total_partners,
        (SELECT COUNT(*) FROM tracks) as total_tracks,
        (SELECT COUNT(*) FROM invitations WHERE is_used = false) as pending_invitations,
        (SELECT COUNT(*) FROM partner_invitations WHERE is_used = false) as pending_partner_invitations
    `);

    res.json({
      system: {
        stats: stats.rows[0],
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      },
    });
  } catch (error) {
    console.error('Get system settings error:', error);
    res.status(500).json({ error: 'Failed to get system settings' });
  }
});

export default router;
