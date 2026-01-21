import { Response, NextFunction } from 'express';
import { pool } from '../db';
import { AuthRequest } from '../types';

interface ErrorWithStatus extends Error {
  status?: number;
  statusCode?: number;
}

// 에러 로깅 미들웨어 (Express 에러 핸들러)
export function errorLogger(
  err: ErrorWithStatus,
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const statusCode = err.status || err.statusCode || 500;
  const userId = req.user?.id || null;
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'] || null;

  // 에러 로그 저장 (비동기, 실패해도 응답에 영향 없음)
  logError({
    errorType: err.name || 'Error',
    message: err.message,
    stack: err.stack || null,
    endpoint: req.path,
    method: req.method,
    statusCode,
    userId,
    ipAddress: typeof ipAddress === 'string' ? ipAddress : null,
    userAgent
  }).catch(logErr => {
    console.error('Failed to save error log:', logErr);
  });

  // 콘솔에도 출력
  console.error(`❌ [${new Date().toISOString()}] ${req.method} ${req.path}:`, err.message);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  // 에러 응답
  res.status(statusCode).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
}

// 에러 로그 저장 함수
async function logError(data: {
  errorType: string;
  message: string;
  stack: string | null;
  endpoint: string;
  method: string;
  statusCode: number;
  userId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
}) {
  try {
    await pool.query(
      `INSERT INTO error_logs
       (error_type, message, stack, endpoint, method, status_code, user_id, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        data.errorType.substring(0, 100),
        data.message,
        data.stack,
        data.endpoint.substring(0, 255),
        data.method,
        data.statusCode,
        data.userId,
        data.ipAddress?.substring(0, 45),
        data.userAgent?.substring(0, 500)
      ]
    );
  } catch (error) {
    throw error;
  }
}

// 수동으로 에러 로그 저장 (try-catch 블록에서 사용)
export async function logErrorManually(
  error: Error,
  context?: {
    endpoint?: string;
    method?: string;
    userId?: string;
    statusCode?: number;
  }
) {
  try {
    await pool.query(
      `INSERT INTO error_logs
       (error_type, message, stack, endpoint, method, status_code, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        error.name || 'Error',
        error.message,
        error.stack || null,
        context?.endpoint || 'unknown',
        context?.method || 'unknown',
        context?.statusCode || 500,
        context?.userId || null
      ]
    );
  } catch (logError) {
    console.error('Failed to log error manually:', logError);
  }
}
