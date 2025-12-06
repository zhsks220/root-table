import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { pool } from '../db';
import { generateToken } from '../middleware/auth';

const router = Router();

// 회원가입 스키마
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  invitationCode: z.string().min(1),
});

// 로그인 스키마
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// 회원가입 (초대 코드 필수)
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, invitationCode } = registerSchema.parse(req.body);

    // 초대 코드 검증
    const inviteResult = await pool.query(
      `SELECT * FROM invitations
       WHERE code = $1 AND is_used = FALSE
       AND (expires_at IS NULL OR expires_at > NOW())`,
      [invitationCode]
    );

    if (inviteResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired invitation code' });
    }

    const invitation = inviteResult.rows[0];

    // 이메일 중복 확인
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // 비밀번호 해싱
    const passwordHash = await bcrypt.hash(password, 10);

    // 트랜잭션 시작
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 사용자 생성
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, name, invitation_code)
         VALUES ($1, $2, $3, $4)
         RETURNING id, email, name, role, created_at`,
        [email, passwordHash, name, invitationCode]
      );

      const user = userResult.rows[0];

      // 초대에 할당된 음원들을 user_tracks에 매핑
      await client.query(
        `INSERT INTO user_tracks (user_id, track_id, invitation_id, can_download)
         SELECT $1, track_id, $2, TRUE
         FROM invitation_tracks
         WHERE invitation_id = $2`,
        [user.id, invitation.id]
      );

      // 초대 코드를 사용됨으로 표시
      await client.query(
        `UPDATE invitations SET is_used = TRUE, used_by = $1 WHERE id = $2`,
        [user.id, invitation.id]
      );

      await client.query('COMMIT');

      // JWT 토큰 생성
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      res.status(201).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 로그인
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // 사용자 조회
    const result = await pool.query(
      'SELECT id, email, password_hash, name, role FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // 비밀번호 검증
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // JWT 토큰 생성
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
