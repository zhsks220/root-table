import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import invitationRoutes from './routes/invitations';
import trackRoutes from './routes/tracks';
import adminRoutes from './routes/admin';
import { pool } from './db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어
const allowedOrigins = [
  'http://localhost:3000', // Main site
  'http://localhost:3002', // Music download site
  'http://localhost:3003', // Admin site
];

// 환경변수에서 추가 CORS 도메인 로드 (Vercel 배포 등)
if (process.env.CORS_ORIGINS) {
  const additionalOrigins = process.env.CORS_ORIGINS.split(',').map(o => o.trim());
  allowedOrigins.push(...additionalOrigins);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

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

// 헬스체크
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 라우트
app.use('/api/auth', authRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/tracks', trackRoutes);
app.use('/api/admin', adminRoutes);

// 404 처리
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// 에러 핸들러
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 서버 시작
app.listen(PORT, async () => {
  try {
    // DB 연결 테스트
    await pool.query('SELECT NOW()');
    console.log('🎵 Music Share Platform Backend');
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`✅ Database connected`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await pool.end();
  process.exit(0);
});

export default app;
