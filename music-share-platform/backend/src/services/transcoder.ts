import { spawn } from 'child_process';
import { Readable, Writable } from 'stream';
import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';

/**
 * FFmpeg를 사용한 오디오 트랜스코딩 서비스
 * WAV/MP3 → FLAC 무손실 압축 (용량 50% 절약, 음질 100% 보존)
 */

interface TranscodeResult {
  buffer: Buffer;
  format: 'flac';
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

/**
 * 오디오 파일을 FLAC으로 변환
 * @param inputBuffer - 원본 오디오 버퍼 (WAV, MP3, FLAC 등)
 * @param inputMimeType - 입력 파일의 MIME 타입
 * @returns FLAC으로 변환된 버퍼와 메타데이터
 */
export async function transcodeToFlac(
  inputBuffer: Buffer,
  inputMimeType: string
): Promise<TranscodeResult> {
  const originalSize = inputBuffer.length;

  // 이미 FLAC인 경우 그대로 반환
  if (inputMimeType === 'audio/flac') {
    return {
      buffer: inputBuffer,
      format: 'flac',
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
    };
  }

  // 임시 파일 경로 생성
  const tempId = crypto.randomBytes(8).toString('hex');
  const tempDir = os.tmpdir();
  const inputPath = path.join(tempDir, `input-${tempId}.tmp`);
  const outputPath = path.join(tempDir, `output-${tempId}.flac`);

  try {
    // 입력 버퍼를 임시 파일로 저장
    await fs.promises.writeFile(inputPath, inputBuffer);

    // FFmpeg로 FLAC 변환
    await new Promise<void>((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-y',                    // 덮어쓰기
        '-i', inputPath,         // 입력 파일
        '-c:a', 'flac',          // FLAC 코덱
        '-compression_level', '8', // 최대 압축 (0-12, 8이 적정)
        '-sample_fmt', 's16',    // 16-bit (CD 품질)
        '-ar', '44100',          // 44.1kHz 샘플레이트
        outputPath               // 출력 파일
      ]);

      let stderr = '';
      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg failed with code ${code}: ${stderr}`));
        }
      });

      ffmpeg.on('error', (err) => {
        reject(new Error(`FFmpeg spawn error: ${err.message}`));
      });
    });

    // 변환된 파일 읽기
    const compressedBuffer = await fs.promises.readFile(outputPath);
    const compressedSize = compressedBuffer.length;
    const compressionRatio = compressedSize / originalSize;

    console.log(`🎵 Transcoded: ${formatBytes(originalSize)} → ${formatBytes(compressedSize)} (${Math.round(compressionRatio * 100)}%)`);

    return {
      buffer: compressedBuffer,
      format: 'flac',
      originalSize,
      compressedSize,
      compressionRatio,
    };
  } finally {
    // 임시 파일 정리
    try {
      await fs.promises.unlink(inputPath).catch(() => {});
      await fs.promises.unlink(outputPath).catch(() => {});
    } catch {}
  }
}

/**
 * 오디오 파일의 메타데이터 추출 (duration 등)
 */
export async function getAudioMetadata(inputBuffer: Buffer): Promise<{
  duration: number;
  sampleRate?: number;
  channels?: number;
  bitrate?: number;
}> {
  const tempId = crypto.randomBytes(8).toString('hex');
  const tempPath = path.join(os.tmpdir(), `probe-${tempId}.tmp`);

  try {
    await fs.promises.writeFile(tempPath, inputBuffer);

    return new Promise((resolve, reject) => {
      const ffprobe = spawn('ffprobe', [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        tempPath
      ]);

      let stdout = '';
      ffprobe.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      ffprobe.on('close', (code) => {
        if (code === 0) {
          try {
            const data = JSON.parse(stdout);
            const audioStream = data.streams?.find((s: any) => s.codec_type === 'audio');
            const format = data.format || {};

            resolve({
              duration: parseFloat(format.duration) || 0,
              sampleRate: audioStream?.sample_rate ? parseInt(audioStream.sample_rate) : undefined,
              channels: audioStream?.channels,
              bitrate: format.bit_rate ? parseInt(format.bit_rate) : undefined,
            });
          } catch {
            resolve({ duration: 0 });
          }
        } else {
          resolve({ duration: 0 });
        }
      });

      ffprobe.on('error', () => {
        resolve({ duration: 0 });
      });
    });
  } finally {
    await fs.promises.unlink(tempPath).catch(() => {});
  }
}

/**
 * FFmpeg가 설치되어 있는지 확인
 */
export async function checkFfmpegInstalled(): Promise<boolean> {
  return new Promise((resolve) => {
    const ffmpeg = spawn('ffmpeg', ['-version']);
    ffmpeg.on('close', (code) => resolve(code === 0));
    ffmpeg.on('error', () => resolve(false));
  });
}

/**
 * FLAC 파일을 MP3로 변환 (다운로드용)
 * @param inputBuffer - FLAC 오디오 버퍼
 * @returns MP3로 변환된 버퍼
 */
export async function transcodeToMp3(inputBuffer: Buffer): Promise<Buffer> {
  const tempId = crypto.randomBytes(8).toString('hex');
  const tempDir = os.tmpdir();
  const inputPath = path.join(tempDir, `input-${tempId}.flac`);
  const outputPath = path.join(tempDir, `output-${tempId}.mp3`);

  try {
    // 입력 버퍼를 임시 파일로 저장
    await fs.promises.writeFile(inputPath, inputBuffer);

    // FFmpeg로 MP3 변환 (320kbps 고품질)
    await new Promise<void>((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-y',                    // 덮어쓰기
        '-i', inputPath,         // 입력 파일
        '-c:a', 'libmp3lame',    // MP3 코덱
        '-b:a', '320k',          // 320kbps 비트레이트 (최고 품질)
        '-ar', '44100',          // 44.1kHz 샘플레이트
        outputPath               // 출력 파일
      ]);

      let stderr = '';
      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg MP3 conversion failed with code ${code}: ${stderr}`));
        }
      });

      ffmpeg.on('error', (err) => {
        reject(new Error(`FFmpeg spawn error: ${err.message}`));
      });
    });

    // 변환된 파일 읽기
    const mp3Buffer = await fs.promises.readFile(outputPath);
    console.log(`🎵 Converted to MP3: ${formatBytes(inputBuffer.length)} → ${formatBytes(mp3Buffer.length)}`);

    return mp3Buffer;
  } finally {
    // 임시 파일 정리
    try {
      await fs.promises.unlink(inputPath).catch(() => {});
      await fs.promises.unlink(outputPath).catch(() => {});
    } catch {}
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
