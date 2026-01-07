import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

// Service Role Key를 사용하여 RLS 우회
// 키가 없으면 null로 초기화 (Storage 기능 비활성화)
let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
  console.log('✅ Supabase Storage initialized');
} else {
  console.warn('⚠️ Supabase Storage disabled - missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
}

const BUCKET_NAME = 'tracks';

// Storage 사용 가능 여부 확인
export function isStorageAvailable(): boolean {
  return supabase !== null;
}

// 파일 업로드
export async function uploadFile(key: string, body: Buffer, contentType: string): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase Storage is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY.');
  }

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(key, body, {
      contentType,
      upsert: true,
    });

  if (error) {
    console.error('Supabase Storage upload error:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  console.log(`📁 File uploaded to Supabase Storage: ${key}`);
  return key;
}

// 스트리밍용 Signed URL 생성 (1시간 유효)
export async function getStreamUrl(key: string): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase Storage is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY.');
  }

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(key, 3600); // 1시간

  if (error) {
    console.error('Supabase Storage signed URL error:', error);
    throw new Error(`Failed to get stream URL: ${error.message}`);
  }

  return data.signedUrl;
}

// 다운로드용 Signed URL 생성 (15분 유효)
export async function getDownloadUrl(key: string, filename: string): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase Storage is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY.');
  }

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(key, 900, {
      download: filename,
    });

  if (error) {
    console.error('Supabase Storage download URL error:', error);
    throw new Error(`Failed to get download URL: ${error.message}`);
  }

  return data.signedUrl;
}

// 파일 삭제
export async function deleteFile(key: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase Storage is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY.');
  }

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([key]);

  if (error) {
    console.error('Supabase Storage delete error:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }

  console.log(`🗑️ File deleted from Supabase Storage: ${key}`);
}

// Public URL 가져오기 (버킷이 public일 경우)
export function getPublicUrl(key: string): string {
  if (!supabase) {
    throw new Error('Supabase Storage is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY.');
  }

  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(key);

  return data.publicUrl;
}

// 파일 다운로드 (버퍼로 반환)
export async function downloadFile(key: string): Promise<Buffer> {
  if (!supabase) {
    throw new Error('Supabase Storage is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY.');
  }

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .download(key);

  if (error) {
    console.error('Supabase Storage download error:', error);
    throw new Error(`Failed to download file: ${error.message}`);
  }

  // Blob을 Buffer로 변환
  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// 웹툰 이미지 버킷 자동 생성
export async function ensureWebtoonBucketExists(): Promise<void> {
  if (!supabase) {
    console.warn('⚠️ Supabase Storage not configured - skipping bucket creation');
    return;
  }

  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('Failed to list buckets:', listError);
      return;
    }

    const webtoonBucketExists = buckets?.some(b => b.name === 'webtoon-images');

    if (!webtoonBucketExists) {
      console.log('📦 Creating webtoon-images bucket...');
      const { error: createError } = await supabase.storage.createBucket('webtoon-images', {
        public: false,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
      });

      if (createError) {
        console.error('❌ Failed to create webtoon-images bucket:', createError);
      } else {
        console.log('✅ webtoon-images bucket created successfully');
      }
    } else {
      console.log('✅ webtoon-images bucket already exists');
    }
  } catch (error) {
    console.error('Error ensuring webtoon bucket exists:', error);
  }
}

export { supabase, BUCKET_NAME };
