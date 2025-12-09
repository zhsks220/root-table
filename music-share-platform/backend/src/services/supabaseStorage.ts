import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

// Service Role Key를 사용하여 RLS 우회
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BUCKET_NAME = 'tracks';

// 파일 업로드
export async function uploadFile(key: string, body: Buffer, contentType: string): Promise<string> {
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
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(key);

  return data.publicUrl;
}

export { supabase, BUCKET_NAME };
