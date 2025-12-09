import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// DATABASE_URL 확인
const databaseUrl = process.env.DATABASE_URL;
console.log('🔍 DATABASE_URL exists:', !!databaseUrl);
console.log('🔍 DATABASE_URL starts with:', databaseUrl?.substring(0, 30) + '...');

if (!databaseUrl) {
  console.error('❌ DATABASE_URL is not set!');
  console.error('Available env vars:', Object.keys(process.env).filter(k => !k.startsWith('npm_')).join(', '));
}

// PostgreSQL 연결 풀 생성
export const pool = new Pool({
  connectionString: databaseUrl,
  max: 20, // 최대 연결 수
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 연결 테스트
pool.on('connect', () => {
  console.log('✅ Database connected');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  process.exit(-1);
});

// 쿼리 헬퍼 함수
export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

export default pool;
