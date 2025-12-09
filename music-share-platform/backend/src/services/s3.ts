import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';

const USE_LOCAL_STORAGE = process.env.USE_LOCAL_STORAGE === 'true';
const LOCAL_STORAGE_PATH = process.env.LOCAL_STORAGE_PATH || './uploads';

// S3 클라이언트 (로컬 모드가 아닐 때만 초기화)
let s3Client: S3Client | null = null;
let BUCKET: string = '';

if (!USE_LOCAL_STORAGE) {
  s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
  BUCKET = process.env.S3_BUCKET!;
}

// 로컬 저장 경로 확인 및 생성
function ensureLocalDir() {
  const tracksDir = path.join(LOCAL_STORAGE_PATH, 'tracks');
  if (!fs.existsSync(tracksDir)) {
    fs.mkdirSync(tracksDir, { recursive: true });
  }
}

// 파일 업로드
export async function uploadFile(key: string, body: Buffer, contentType: string) {
  if (USE_LOCAL_STORAGE) {
    ensureLocalDir();
    const filePath = path.join(LOCAL_STORAGE_PATH, key);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, body);
    console.log(`📁 File saved locally: ${filePath}`);
    return key;
  }

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await s3Client!.send(command);
  return key;
}

// 스트리밍용 URL 생성 (1시간 유효)
export async function getStreamUrl(key: string): Promise<string> {
  if (USE_LOCAL_STORAGE) {
    // 로컬 모드: Express 정적 파일 서빙 URL 반환
    return `http://localhost:${process.env.PORT || 3001}/files/${key}`;
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  return await getSignedUrl(s3Client!, command, { expiresIn: 3600 });
}

// 다운로드용 URL 생성 (15분 유효)
export async function getDownloadUrl(key: string, filename: string): Promise<string> {
  if (USE_LOCAL_STORAGE) {
    // 로컬 모드: Express 다운로드 URL 반환
    return `http://localhost:${process.env.PORT || 3001}/files/${key}?download=true&filename=${encodeURIComponent(filename)}`;
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${encodeURIComponent(filename)}"`,
  });

  return await getSignedUrl(s3Client!, command, { expiresIn: 900 });
}

// 파일 삭제
export async function deleteFile(key: string) {
  if (USE_LOCAL_STORAGE) {
    const filePath = path.join(LOCAL_STORAGE_PATH, key);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ File deleted locally: ${filePath}`);
    }
    return;
  }

  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  await s3Client!.send(command);
}

// 로컬 파일 읽기 (Express 라우트에서 사용)
export function getLocalFilePath(key: string): string | null {
  if (!USE_LOCAL_STORAGE) return null;
  const filePath = path.join(LOCAL_STORAGE_PATH, key);
  return fs.existsSync(filePath) ? filePath : null;
}

export { USE_LOCAL_STORAGE, LOCAL_STORAGE_PATH };
