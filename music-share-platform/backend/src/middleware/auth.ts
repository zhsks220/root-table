import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JWTPayload, RefreshTokenPayload } from '../types';

// JWT Access Token 검증 미들웨어
export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// 관리자 권한 검증 미들웨어
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
}

// JWT Access Token 생성 헬퍼 (15분 만료)
export function generateToken(user: JWTPayload): string {
  return jwt.sign(user, process.env.JWT_SECRET!, {
    expiresIn: '15m', // 15분 유효
  });
}

// JWT Refresh Token 생성 헬퍼 (7일 만료)
export function generateRefreshToken(user: RefreshTokenPayload): string {
  return jwt.sign(user, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: '7d', // 7일 유효
  });
}

// JWT Refresh Token 검증 헬퍼
export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as RefreshTokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}
