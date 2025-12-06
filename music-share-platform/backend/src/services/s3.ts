import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.S3_BUCKET!;

// 파일 업로드
export async function uploadFile(key: string, body: Buffer, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await s3Client.send(command);
  return key;
}

// 스트리밍용 Pre-signed URL 생성 (1시간 유효)
export async function getStreamUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

// 다운로드용 Pre-signed URL 생성 (15분 유효)
export async function getDownloadUrl(key: string, filename: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${encodeURIComponent(filename)}"`,
  });

  return await getSignedUrl(s3Client, command, { expiresIn: 900 });
}

// 파일 삭제
export async function deleteFile(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  await s3Client.send(command);
}
