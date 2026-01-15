/**
 * 기존 웹툰 이미지를 JPEG 80% + Progressive로 마이그레이션
 *
 * 실행: npx ts-node scripts/migrate-webtoon-images.ts
 */

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import dotenv from 'dotenv';
import path from 'path';

// 환경 변수 로드
dotenv.config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const WEBTOON_BUCKET = 'webtoon-images';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_URL 또는 SUPABASE_SERVICE_KEY가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function optimizeImage(buffer: Buffer): Promise<Buffer> {
  const optimized = await sharp(buffer)
    .jpeg({
      quality: 80,
      progressive: true,
    })
    .toBuffer();

  return optimized;
}

async function listAllImages(prefix: string = ''): Promise<string[]> {
  const allFiles: string[] = [];

  const { data, error } = await supabase.storage
    .from(WEBTOON_BUCKET)
    .list(prefix, { limit: 1000 });

  if (error) {
    console.error(`❌ 파일 목록 조회 실패 (${prefix}):`, error.message);
    return [];
  }

  for (const item of data || []) {
    const fullPath = prefix ? `${prefix}/${item.name}` : item.name;

    if (item.id === null) {
      // 폴더인 경우 재귀 호출
      const subFiles = await listAllImages(fullPath);
      allFiles.push(...subFiles);
    } else {
      // 파일인 경우
      allFiles.push(fullPath);
    }
  }

  return allFiles;
}

async function migrateImage(imageKey: string): Promise<{ success: boolean; saved: number }> {
  try {
    // 1. 이미지 다운로드
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from(WEBTOON_BUCKET)
      .download(imageKey);

    if (downloadError || !downloadData) {
      console.error(`  ❌ 다운로드 실패: ${imageKey}`);
      return { success: false, saved: 0 };
    }

    const originalBuffer = Buffer.from(await downloadData.arrayBuffer());
    const originalSize = originalBuffer.length;

    // 2. 이미 JPEG인지 확인 (매직 바이트)
    const isJpeg = originalBuffer[0] === 0xFF && originalBuffer[1] === 0xD8;

    // 3. 최적화
    const optimizedBuffer = await optimizeImage(originalBuffer);
    const optimizedSize = optimizedBuffer.length;

    // 4. 새 키 생성 (.jpg 확장자)
    const newKey = imageKey.replace(/\.(png|webp|jpeg)$/i, '.jpg');

    // 5. 업로드 (덮어쓰기)
    const { error: uploadError } = await supabase.storage
      .from(WEBTOON_BUCKET)
      .upload(newKey, optimizedBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error(`  ❌ 업로드 실패: ${newKey}`, uploadError.message);
      return { success: false, saved: 0 };
    }

    // 6. 기존 파일이 다른 확장자였으면 삭제
    if (newKey !== imageKey) {
      await supabase.storage.from(WEBTOON_BUCKET).remove([imageKey]);
    }

    const savedBytes = originalSize - optimizedSize;
    const savedPercent = ((savedBytes / originalSize) * 100).toFixed(1);

    console.log(`  ✅ ${imageKey}`);
    console.log(`     ${(originalSize / 1024).toFixed(0)}KB → ${(optimizedSize / 1024).toFixed(0)}KB (${savedPercent}% 절약)`);

    return { success: true, saved: savedBytes };
  } catch (error) {
    console.error(`  ❌ 처리 실패: ${imageKey}`, error);
    return { success: false, saved: 0 };
  }
}

async function main() {
  console.log('🚀 웹툰 이미지 마이그레이션 시작\n');

  // 모든 이미지 목록 조회
  console.log('📋 이미지 목록 조회 중...');
  const allImages = await listAllImages('webtoon-images');

  // 이미지 파일만 필터링
  const imageFiles = allImages.filter(f =>
    /\.(jpg|jpeg|png|webp)$/i.test(f)
  );

  console.log(`\n📁 총 ${imageFiles.length}개 이미지 발견\n`);

  if (imageFiles.length === 0) {
    console.log('✅ 마이그레이션할 이미지가 없습니다.');
    return;
  }

  let successCount = 0;
  let failCount = 0;
  let totalSaved = 0;

  for (let i = 0; i < imageFiles.length; i++) {
    const imageKey = imageFiles[i];
    console.log(`\n[${i + 1}/${imageFiles.length}] 처리 중...`);

    const result = await migrateImage(imageKey);

    if (result.success) {
      successCount++;
      totalSaved += result.saved;
    } else {
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 마이그레이션 완료');
  console.log('='.repeat(50));
  console.log(`✅ 성공: ${successCount}개`);
  console.log(`❌ 실패: ${failCount}개`);
  console.log(`💾 총 절약: ${(totalSaved / 1024 / 1024).toFixed(2)}MB`);
}

main().catch(console.error);
