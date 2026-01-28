import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import invitationRoutes from './routes/invitations';
import trackRoutes from './routes/tracks';
import adminRoutes from './routes/admin';
import cmsRoutes from './routes/cms';
import categoryRoutes from './routes/categories';
import partnerAdminRoutes from './routes/partner-admin';
import partnerRoutes from './routes/partner';
import settingsRoutes from './routes/settings';
import contactRoutes from './routes/contact';
import webtoonRoutes from './routes/webtoon';
import projectShareRoutes from './routes/project-share';
import libraryRoutes from './routes/library';
import monitoringRoutes from './routes/monitoring';
import { pool } from './db';
import { ensureWebtoonBucketExists } from './services/supabaseStorage';
import { requestLogger, slowRequestLogger } from './middleware/requestLogger';
import { errorLogger } from './middleware/errorLogger';
import { startAlertChecker, stopAlertChecker } from './services/alertChecker';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// Railway/Vercel 등 프록시 뒤에서 실행될 때 필요
app.set('trust proxy', 1);

// Rate Limiters (개발 환경에서는 제한 완화)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: isProduction ? 100 : 1000, // 프로덕션: 100, 개발: 1000
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: isProduction ? 10 : 100, // 프로덕션: 10, 개발: 100
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 미들웨어
const allowedOrigins = [
  'http://localhost:3000', // Main site
  'http://localhost:3002', // Music download site
  'http://localhost:3003', // Admin site
  'http://localhost:3004', // Partner portal
  'http://172.30.1.21:3000', // LAN 테스트용
];

// 환경변수에서 추가 CORS 도메인 로드 (Vercel 배포 등)
if (process.env.CORS_ORIGINS) {
  const additionalOrigins = process.env.CORS_ORIGINS.split(',').map(o => o.trim());
  allowedOrigins.push(...additionalOrigins);
}

// 보안 헤더 (helmet)
app.use(helmet());

// 전역 Rate Limiter
app.use(globalLimiter);

// 인증 엔드포인트 엄격한 Rate Limiter
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use(cors({
  origin: (origin, callback) => {
    // 프로덕션에서는 origin 없는 요청 거부
    if (!origin) {
      if (isProduction) {
        return callback(new Error('Origin required in production'));
      }
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 요청 로깅 미들웨어 (모니터링용)
app.use(requestLogger);
app.use(slowRequestLogger);

// 헬스체크
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 라우트
app.use('/api/auth', authRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/tracks', trackRoutes);

// 웹툰 프로젝트 라우트 (관리자 + 파트너) - adminRoutes보다 먼저 등록해야 파트너 접근 가능
app.use('/api/admin', webtoonRoutes);

app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);

// CMS 라우트 (숨겨진 경로)
app.use('/api/cms-rl2025x', cmsRoutes);

// 파트너 관리 라우트 (관리자 전용)
app.use('/api/partner/admin', partnerAdminRoutes);

// 파트너 라우트 (파트너 전용)
app.use('/api/partner', partnerRoutes);

// 설정 라우트 (공통 + 관리자)
app.use('/api/settings', settingsRoutes);

// 상담 문의 라우트 (공개 + 관리자)
app.use('/api/contact', contactRoutes);

// 프로젝트 공유 라우트 (공유 링크 접속용)
app.use('/api/project', projectShareRoutes);

// 라이브러리 관리 라우트 (관리자 전용)
app.use('/api/library', libraryRoutes);

// 모니터링 라우트 (개발자 전용)
app.use('/api/monitoring', monitoringRoutes);

// 404 처리
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// 에러 핸들러 (에러 로깅 포함)
app.use(errorLogger);

// 서버 시작
console.log(`🔧 Attempting to start server on 0.0.0.0:${PORT}...`);

const server = app.listen(Number(PORT), '0.0.0.0', async () => {
  console.log(`✅ Server listening on 0.0.0.0:${PORT}`);
  try {
    // DB 연결 테스트
    await pool.query('SELECT NOW()');
    console.log('🎵 Music Share Platform Backend');
    console.log(`✅ Database connected`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

    // 웹툰 이미지 버킷 확인 및 생성
    await ensureWebtoonBucketExists();

    // 알림 체커 시작 (백그라운드에서 1분마다 실행)
    startAlertChecker();
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    // Don't exit, just log the error - server is still running
  }
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  stopAlertChecker();
  await pool.end();
  process.exit(0);
});

export default app;
