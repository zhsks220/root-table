import { Response, NextFunction } from 'express';
import { pool } from '../db';
import { AuthRequest } from '../types';

// 로깅 제외 경로 (헬스체크, 정적 파일 등)
const EXCLUDED_PATHS = [
  '/health',
  '/api/health',
  '/favicon.ico',
  '/api/monitoring', // 모니터링 API 자체는 로깅하지 않음 (무한 루프 방지)
];

// 로깅 제외 메서드
const EXCLUDED_METHODS = ['OPTIONS'];

// 요청 로깅 미들웨어
export function requestLogger(req: AuthRequest, res: Response, next: NextFunction) {
  // 제외 경로 체크
  if (EXCLUDED_PATHS.some(path => req.path.startsWith(path))) {
    return next();
  }

  // 제외 메서드 체크
  if (EXCLUDED_METHODS.includes(req.method)) {
    return next();
  }

  const startTime = Date.now();

  // 응답 완료 시 로깅
  res.on('finish', async () => {
    const responseTime = Date.now() - startTime;
    const userId = req.user?.id || null;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || null;

    try {
      // request_logs에 기록
      await pool.query(
        `INSERT INTO request_logs (endpoint, method, status_code, response_time, user_id, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          req.path.substring(0, 255),
          req.method,
          res.statusCode,
          responseTime,
          userId,
          typeof ipAddress === 'string' ? ipAddress.substring(0, 45) : null,
          userAgent ? userAgent.substring(0, 500) : null
        ]
      );

      // 5xx 에러면 error_logs에도 자동 기록
      if (res.statusCode >= 500) {
        await pool.query(
          `INSERT INTO error_logs (error_type, message, endpoint, method, status_code, user_id, ip_address, user_agent)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            'ServerError',
            `${res.statusCode} error on ${req.method} ${req.path}`,
            req.path.substring(0, 255),
            req.method,
            res.statusCode,
            userId,
            typeof ipAddress === 'string' ? ipAddress.substring(0, 45) : null,
            userAgent ? userAgent.substring(0, 500) : null
          ]
        );
      }
    } catch (error) {
      // 로깅 실패해도 서비스에 영향 없도록
      console.error('Failed to log request:', error);
    }
  });

  next();
}

// 슬로우 요청 경고 (3초 이상)
export function slowRequestLogger(req: AuthRequest, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const SLOW_THRESHOLD = 3000; // 3초

  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    if (responseTime > SLOW_THRESHOLD) {
      console.warn(`⚠️ Slow request: ${req.method} ${req.path} took ${responseTime}ms`);
    }
  });

  next();
}
