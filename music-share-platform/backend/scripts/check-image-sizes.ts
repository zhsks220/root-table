import { Pool } from 'pg';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function checkSizes() {
  console.log('📊 원본 이미지 크기 확인\n');

  const { rows } = await pool.query(`
    SELECT id, image_key, thumbnail_key
    FROM webtoon_scenes
    ORDER BY created_at
    LIMIT 5
  `);

  for (const row of rows) {
    try {
      // 원본 이미지 크기
      const { data: origData } = await supabase.storage
        .from('webtoon-images')
        .download(row.image_key);

      // 썸네일 크기
      let thumbSize = 0;
      if (row.thumbnail_key) {
        const { data: thumbData } = await supabase.storage
          .from('webtoon-images')
          .download(row.thumbnail_key);
        if (thumbData) thumbSize = thumbData.size;
      }

      if (origData) {
        const origSize = origData.size;
        console.log(`원본: ${(origSize / 1024).toFixed(0)}KB | 썸네일: ${(thumbSize / 1024).toFixed(0)}KB`);
      }
    } catch (e: any) {
      console.log(`에러: ${e.message}`);
    }
  }

  await pool.end();
}

checkSizes();
