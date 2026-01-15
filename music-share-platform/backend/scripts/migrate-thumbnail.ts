import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  console.log('🚀 썸네일 컬럼 마이그레이션 시작...');

  try {
    // thumbnail_key 컬럼 추가
    await pool.query(`
      ALTER TABLE webtoon_scenes
      ADD COLUMN IF NOT EXISTS thumbnail_key VARCHAR(500);
    `);

    console.log('✅ thumbnail_key 컬럼 추가 완료');

    // 확인
    const result = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'webtoon_scenes'
      AND column_name = 'thumbnail_key';
    `);

    if (result.rows.length > 0) {
      console.log('✅ 컬럼 확인:', result.rows[0]);
    }

  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
  } finally {
    await pool.end();
  }
}

migrate();
