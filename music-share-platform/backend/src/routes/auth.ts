import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { pool } from '../db';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../middleware/auth';

const router = Router();

// 비밀번호 정책: 12자 이상, 대문자, 소문자, 숫자, 특수문자 포함 필수
const passwordSchema = z.string()
  .min(12, '비밀번호는 12자 이상이어야 합니다')
  .regex(/[A-Z]/, '비밀번호에 대문자가 포함되어야 합니다')
  .regex(/[a-z]/, '비밀번호에 소문자가 포함되어야 합니다')
  .regex(/[0-9]/, '비밀번호에 숫자가 포함되어야 합니다')
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, '비밀번호에 특수문자가 포함되어야 합니다');

// 회원가입 스키마
const registerSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  name: z.string().min(1),
  invitationCode: z.string().min(1),
});

// 로그인 스키마 (이메일 또는 사용자명 허용)
const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string(),
});

// Refresh Token 스키마
const refreshSchema = z.object({
  refreshToken: z.string().min(1),
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

    // 비밀번호 해싱 (bcrypt 12 라운드)
    const passwordHash = await bcrypt.hash(password, 12);

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

      // JWT Access Token 생성 (15분 만료)
      const accessToken = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      // JWT Refresh Token 생성 (7일 만료)
      const refreshToken = generateRefreshToken({
        id: user.id,
        email: user.email,
        role: user.role,
        tokenType: 'refresh',
      });

      res.status(201).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        accessToken,
        refreshToken,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const isProduction = process.env.NODE_ENV === 'production';
      return res.status(400).json({
        error: 'Invalid input',
        ...(isProduction ? {} : { details: error.errors })
      });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 로그인 (이메일 또는 username으로 로그인 가능)
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // 사용자 조회 (이메일 또는 username으로 검색, 계정 잠금 정보 포함)
    const result = await pool.query(
      'SELECT id, username, email, password_hash, name, role, force_password_change, login_attempts, locked_until FROM users WHERE email = $1 OR username = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // 계정 잠금 여부 확인
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const remainingTime = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 1000 / 60);
      return res.status(423).json({
        error: 'Account is locked',
        message: `Too many failed login attempts. Please try again in ${remainingTime} minute(s).`,
        lockedUntil: user.locked_until
      });
    }

    // 비밀번호 검증
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      // 로그인 실패: login_attempts 증가
      const newAttempts = (user.login_attempts || 0) + 1;

      if (newAttempts >= 5) {
        // 5회 이상 실패: 15분 잠금
        const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        await pool.query(
          'UPDATE users SET login_attempts = $1, locked_until = $2 WHERE id = $3',
          [newAttempts, lockUntil, user.id]
        );
        return res.status(423).json({
          error: 'Account is locked',
          message: 'Too many failed login attempts. Account locked for 15 minutes.',
          lockedUntil: lockUntil
        });
      } else {
        // 5회 미만: 시도 횟수만 증가
        await pool.query(
          'UPDATE users SET login_attempts = $1 WHERE id = $2',
          [newAttempts, user.id]
        );
        return res.status(401).json({
          error: 'Invalid email or password',
          remainingAttempts: 5 - newAttempts
        });
      }
    }

    // 로그인 성공: login_attempts 초기화, locked_until NULL로 설정
    await pool.query(
      'UPDATE users SET login_attempts = 0, locked_until = NULL WHERE id = $1',
      [user.id]
    );

    // JWT Access Token 생성 (15분 만료)
    const accessToken = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // JWT Refresh Token 생성 (7일 만료)
    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role,
      tokenType: 'refresh',
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        forcePasswordChange: user.force_password_change || false,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const isProduction = process.env.NODE_ENV === 'production';
      return res.status(400).json({
        error: 'Invalid input',
        ...(isProduction ? {} : { details: error.errors })
      });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refresh Token으로 새 Access Token 발급
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);

    // Refresh Token 검증
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // tokenType 검증
    if (decoded.tokenType !== 'refresh') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    // 사용자가 여전히 존재하는지 확인
    const result = await pool.query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // 새 Access Token 생성
    const accessToken = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Refresh Token 회전: 새 Refresh Token도 발급
    const newRefreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role,
      tokenType: 'refresh',
    });

    res.json({
      success: true,
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const isProduction = process.env.NODE_ENV === 'production';
      return res.status(400).json({
        error: 'Invalid input',
        ...(isProduction ? {} : { details: error.errors })
      });
    }
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 로그아웃
router.post('/logout', async (req: Request, res: Response) => {
  // 클라이언트에서 토큰 삭제하도록 안내
  // 서버측에서는 토큰 블랙리스트 없이 간단히 처리
  res.json({
    success: true,
    message: 'Logged out successfully. Please remove tokens from client.',
  });
});

// 비밀번호 변경 스키마
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, '현재 비밀번호를 입력해주세요'),
  newPassword: passwordSchema,
});

// 비밀번호 변경 (인증된 사용자만)
router.post('/change-password', async (req: Request, res: Response) => {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '인증이 필요합니다' });
    }

    const token = authHeader.split(' ')[1];

    // 토큰 검증
    const jwt = require('jsonwebtoken');
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: '유효하지 않은 토큰입니다' });
    }

    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    // 사용자 조회
    const result = await pool.query(
      'SELECT id, password_hash FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    const user = result.rows[0];

    // 현재 비밀번호 확인
    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      return res.status(400).json({ error: '현재 비밀번호가 일치하지 않습니다' });
    }

    // 새 비밀번호가 현재 비밀번호와 같은지 확인
    const isSame = await bcrypt.compare(newPassword, user.password_hash);
    if (isSame) {
      return res.status(400).json({ error: '새 비밀번호는 현재 비밀번호와 달라야 합니다' });
    }

    // 새 비밀번호 해싱
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // 비밀번호 업데이트 및 force_password_change를 false로 설정
    await pool.query(
      `UPDATE users SET password_hash = $1, force_password_change = false, updated_at = NOW()
       WHERE id = $2`,
      [newPasswordHash, decoded.id]
    );

    res.json({
      success: true,
      message: '비밀번호가 변경되었습니다',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const isProduction = process.env.NODE_ENV === 'production';
      return res.status(400).json({
        error: 'Invalid input',
        ...(isProduction ? {} : { details: error.errors })
      });
    }
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
