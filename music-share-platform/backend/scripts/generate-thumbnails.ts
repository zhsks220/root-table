import { Pool } from 'pg';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
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

const BUCKET_NAME = 'webtoon-images';

// 썸네일 생성: 너비 320px, 종횡비 유지
async function createThumbnail(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(320, null, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({
      quality: 70,
      progressive: true,
    })
    .toBuffer();
}

async function generateThumbnails() {
  console.log('🚀 기존 이미지 썸네일 생성 시작...\n');

  try {
    // 모든 scene 조회 (썸네일 재생성)
    const { rows: scenes } = await pool.query(`
      SELECT id, project_id, image_key
      FROM webtoon_scenes
      WHERE image_key IS NOT NULL
      ORDER BY created_at
    `);

    console.log(`📊 썸네일 생성 필요: ${scenes.length}개\n`);

    if (scenes.length === 0) {
      console.log('✅ 모든 이미지에 썸네일이 있습니다.');
      return;
    }

    let success = 0;
    let failed = 0;

    for (const scene of scenes) {
      try {
        console.log(`⏳ 처리 중: ${scene.id}`);

        // 1. 원본 이미지 다운로드
        const { data: imageData, error: downloadError } = await supabase.storage
          .from(BUCKET_NAME)
          .download(scene.image_key);

        if (downloadError || !imageData) {
          console.log(`  ❌ 다운로드 실패: ${downloadError?.message}`);
          failed++;
          continue;
        }

        // 2. 썸네일 생성
        const arrayBuffer = await imageData.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const thumbnailBuffer = await createThumbnail(buffer);

        // 3. 썸네일 키 생성
        const thumbnailKey = scene.image_key.replace('.jpg', '_thumb.jpg').replace('.jpeg', '_thumb.jpeg');

        // 3.5 기존 썸네일 삭제
        await supabase.storage.from(BUCKET_NAME).remove([thumbnailKey]);

        // 4. 썸네일 업로드
        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(thumbnailKey, thumbnailBuffer, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (uploadError) {
          console.log(`  ❌ 업로드 실패: ${uploadError.message}`);
          failed++;
          continue;
        }

        // 5. DB 업데이트
        await pool.query(
          'UPDATE webtoon_scenes SET thumbnail_key = $1 WHERE id = $2',
          [thumbnailKey, scene.id]
        );

        console.log(`  ✅ 완료 (${(thumbnailBuffer.length / 1024).toFixed(0)}KB)`);
        success++;

      } catch (error: any) {
        console.log(`  ❌ 에러: ${error.message}`);
        failed++;
      }
    }

    console.log(`\n📊 결과: 성공 ${success}개, 실패 ${failed}개`);

  } catch (error) {
    console.error('❌ 스크립트 실패:', error);
  } finally {
    await pool.end();
  }
}

generateThumbnails();
