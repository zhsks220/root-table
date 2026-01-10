import { pool } from './index';
import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { spawn } from 'child_process';
import os from 'os';
import crypto from 'crypto';

// Supabase 클라이언트
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET_NAME = 'music-files';

// 유니코드 정규화
function normalizeTitle(title: string): string {
  return title.normalize('NFC').trim();
}

// 시간 파싱
function parseDuration(duration: any): number | null {
  if (!duration) return null;
  if (duration instanceof Date) {
    return duration.getHours() * 3600 + duration.getMinutes() * 60 + duration.getSeconds();
  }
  const str = String(duration);
  const parts = str.split(':');
  if (parts.length === 3) {
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
  }
  return null;
}

// FLAC 변환
async function transcodeToFlac(inputBuffer: Buffer): Promise<Buffer> {
  const tempId = crypto.randomBytes(8).toString('hex');
  const tempDir = os.tmpdir();
  const inputPath = path.join(tempDir, `input-${tempId}.mp3`);
  const outputPath = path.join(tempDir, `output-${tempId}.flac`);

  try {
    await fs.promises.writeFile(inputPath, inputBuffer);

    await new Promise<void>((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-y', '-i', inputPath,
        '-c:a', 'flac',
        '-compression_level', '8',
        '-sample_fmt', 's16',
        '-ar', '44100',
        outputPath
      ]);

      ffmpeg.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg failed with code ${code}`));
      });
      ffmpeg.on('error', reject);
    });

    return await fs.promises.readFile(outputPath);
  } finally {
    await fs.promises.unlink(inputPath).catch(() => {});
    await fs.promises.unlink(outputPath).catch(() => {});
  }
}

// 오디오 메타데이터 추출
async function getAudioDuration(inputBuffer: Buffer): Promise<number> {
  const tempId = crypto.randomBytes(8).toString('hex');
  const tempPath = path.join(os.tmpdir(), `probe-${tempId}.mp3`);

  try {
    await fs.promises.writeFile(tempPath, inputBuffer);

    return new Promise((resolve) => {
      const ffprobe = spawn('ffprobe', [
        '-v', 'quiet', '-print_format', 'json',
        '-show_format', tempPath
      ]);

      let stdout = '';
      ffprobe.stdout.on('data', (data) => { stdout += data.toString(); });
      ffprobe.on('close', () => {
        try {
          const data = JSON.parse(stdout);
          resolve(parseFloat(data.format?.duration) || 0);
        } catch {
          resolve(0);
        }
      });
      ffprobe.on('error', () => resolve(0));
    });
  } finally {
    await fs.promises.unlink(tempPath).catch(() => {});
  }
}

async function seedLibrary() {
  console.log('🎵 음원 라이브러리 시드 시작...\n');

  // 버킷 확인/생성
  console.log('📦 Supabase 버킷 확인 중...');
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);
  if (!bucketExists) {
    console.log(`   버킷 "${BUCKET_NAME}" 생성 중...`);
    const { error } = await supabase.storage.createBucket(BUCKET_NAME, { public: false });
    if (error) {
      console.log(`   ⚠️ 버킷 생성 실패: ${error.message}`);
    } else {
      console.log(`   ✅ 버킷 생성 완료`);
    }
  } else {
    console.log(`   ✅ 버킷 "${BUCKET_NAME}" 존재함`);
  }

  const excelPath = '/Users/routelabel/Desktop/routelabel/음원 라이브러리 1차.xlsx';
  const audioFolder = '/Users/routelabel/Desktop/routelabel/root-table/drive-download-20260110T062115Z-3-001';

  // 1. 엑셀 파일 읽기
  console.log('📊 엑셀 파일 읽는 중...');
  const workbook = xlsx.readFile(excelPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  // 직접 셀 읽기 (엑셀 시작 범위가 B3부터임)
  const range = xlsx.utils.decode_range(sheet['!ref'] || 'A1');
  console.log(`   범위: R${range.s.r}-${range.e.r}, C${range.s.c}-${range.e.c}`);

  // 수동으로 데이터 추출
  const tracks: any[] = [];
  for (let r = range.s.r; r <= range.e.r; r++) {
    const getCell = (c: number) => {
      const addr = xlsx.utils.encode_cell({ r, c });
      return sheet[addr]?.v ?? null;
    };

    const title = getCell(1); // B열
    if (!title) continue;

    tracks.push({
      title: normalizeTitle(String(title)),
      track_code: getCell(3) || null,   // D열
      track_type: getCell(4) || 'WEBTOON_BGM', // E열
      duration_raw: getCell(5),  // F열 (소수점 형태)
      bpm: getCell(6),           // G열
      release_date: getCell(7),  // H열
      musical_key: getCell(8),   // I열
      status: getCell(9) || 'Active', // J열
      artist: getCell(10) || 'ROUTELABEL', // K열
      energy_level: getCell(11), // L열
      genre: getCell(13),        // N열
      webtoon: getCell(14),      // O열
      has_license: getCell(15) === 'Yes', // P열
      is_public: getCell(17) === 'Yes',   // R열
      release_status: getCell(18) || 'Released', // S열
      mood: getCell(19),         // T열
      tempo: getCell(20),        // U열
      theme: getCell(21),        // V열
      usage_status: getCell(22)  // W열
    });
  }

  console.log(`   ${tracks.length}개 트랙 데이터 발견`);
  if (tracks.length > 0) {
    console.log(`   첫 번째 트랙: ${tracks[0].title}`)
  }

  // 2. 웹툰 생성
  console.log('📺 웹툰 데이터 생성 중...');
  const webtoonResult = await pool.query(
    `INSERT INTO webtoons (title) VALUES ($1)
     ON CONFLICT (title) DO UPDATE SET title = EXCLUDED.title
     RETURNING id`,
    ['외모지상주의']
  );
  const webtoonId = webtoonResult.rows[0].id;
  console.log(`   ✅ 웹툰 "외모지상주의" ID: ${webtoonId}`);

  // 3. 음원 파일 목록
  const audioFiles = fs.readdirSync(audioFolder).filter(f => f.endsWith('.mp3'));
  console.log(`\n📁 음원 파일 ${audioFiles.length}개 발견\n`);

  // 파일명 → 파일 경로 맵
  const audioMap: Record<string, string> = {};
  for (const file of audioFiles) {
    // "1. 인천 MASTER (320).mp3" → "인천"
    let title = file.replace(/^\d+\.\s*/, '').replace(/\s*MASTER\s*\(\d+\)\.mp3$/i, '').replace(/\s*\(\d+\)\.mp3$/i, '').trim();
    audioMap[normalizeTitle(title)] = path.join(audioFolder, file);
  }

  // 4. 트랙 데이터 처리
  let insertedCount = 0;
  let uploadedCount = 0;

  for (let i = 0; i < tracks.length; i++) {
    const trackData = tracks[i];
    const title = trackData.title;
    const trackCode = trackData.track_code || `RL_2026_${String(i + 1).padStart(4, '0')}`;

    console.log(`\n[${i + 1}] 처리 중: ${title}`);

    // duration 변환 (엑셀에서 소수점으로 저장됨: 0.155... = 3시간44분)
    let duration = null;
    if (trackData.duration_raw) {
      // 엑셀 시간 형식: 0.155555... = 3:44:00
      duration = Math.round(trackData.duration_raw * 24 * 60 * 60);
    }

    // bpm 변환
    const bpm = trackData.bpm ? parseInt(trackData.bpm) : null;

    // 날짜 변환 (엑셀 시리얼 넘버 → Date)
    let releaseDate = null;
    if (trackData.release_date && typeof trackData.release_date === 'number') {
      // 엑셀 날짜 시리얼: 1900년 1월 1일 기준
      const excelEpoch = new Date(1899, 11, 30);
      releaseDate = new Date(excelEpoch.getTime() + trackData.release_date * 24 * 60 * 60 * 1000);
    } else if (trackData.release_date instanceof Date) {
      releaseDate = trackData.release_date;
    }

    // DB 삽입
    const insertResult = await pool.query(
      `INSERT INTO tracks (
        title, artist, duration, bpm, mood, track_code, track_type,
        musical_key, status, energy_level, genre, tempo, theme,
        has_license, is_public, release_status, usage_status, release_date,
        file_key
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
       ON CONFLICT (track_code) DO UPDATE SET
         title = EXCLUDED.title,
         artist = EXCLUDED.artist
       RETURNING id`,
      [
        title, trackData.artist, duration, bpm, trackData.mood,
        trackCode, trackData.track_type, trackData.musical_key, trackData.status,
        trackData.energy_level, trackData.genre, trackData.tempo, trackData.theme,
        trackData.has_license, trackData.is_public, trackData.release_status, trackData.usage_status,
        releaseDate, 'pending'
      ]
    );
    const trackId = insertResult.rows[0].id;
    insertedCount++;
    console.log(`   📝 DB 삽입 완료 (ID: ${trackId})`);

    // 웹툰 연결
    await pool.query(
      `INSERT INTO track_webtoons (track_id, webtoon_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [trackId, webtoonId]
    );

    // 5. 음원 파일 매칭 및 업로드
    const baseTitle = title.split('(')[0].trim();
    let audioPath = audioMap[title] || audioMap[baseTitle];

    // 부분 매칭 시도
    if (!audioPath) {
      for (const [key, val] of Object.entries(audioMap)) {
        if (key.includes(baseTitle) || baseTitle.includes(key)) {
          audioPath = val;
          break;
        }
      }
    }

    if (audioPath) {
      console.log(`   🎵 음원 파일 발견: ${path.basename(audioPath)}`);

      // 파일 읽기
      const audioBuffer = await fs.promises.readFile(audioPath);
      const originalSize = audioBuffer.length;

      // FLAC 변환
      console.log(`   🔄 FLAC 변환 중...`);
      const flacBuffer = await transcodeToFlac(audioBuffer);
      const compressedSize = flacBuffer.length;
      const ratio = Math.round((compressedSize / originalSize) * 100);
      console.log(`   📦 ${(originalSize / 1024 / 1024).toFixed(1)}MB → ${(compressedSize / 1024 / 1024).toFixed(1)}MB (${ratio}%)`);

      // duration 추출
      const duration = await getAudioDuration(audioBuffer);

      // Supabase 업로드 (파일명을 track_code로 변경하여 한글 문제 해결)
      const flacFilename = `${trackCode}.flac`;
      const fileKey = `tracks/${trackCode}/${flacFilename}`;

      console.log(`   ☁️ Supabase 업로드 중...`);
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileKey, flacBuffer, {
          contentType: 'audio/flac',
          upsert: true
        });

      if (error) {
        console.log(`   ❌ 업로드 실패: ${error.message}`);
      } else {
        // DB 업데이트
        await pool.query(
          `UPDATE tracks SET file_key = $1, file_size = $2, duration = $3 WHERE id = $4`,
          [fileKey, compressedSize, Math.round(duration), trackId]
        );
        uploadedCount++;
        console.log(`   ✅ 업로드 완료: ${fileKey}`);
      }
    } else {
      console.log(`   ⚠️ 매칭되는 음원 파일 없음`);
    }
  }

  console.log('\n========================================');
  console.log(`✅ 완료: ${insertedCount}개 트랙 삽입, ${uploadedCount}개 음원 업로드`);
  console.log('========================================\n');

  process.exit(0);
}

seedLibrary().catch(err => {
  console.error('❌ 에러:', err);
  process.exit(1);
});
