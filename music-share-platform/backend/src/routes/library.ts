import { Router, Response } from 'express';
import { pool } from '../db';
import { AuthRequest } from '../types';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import multer from 'multer';
import xlsx from 'xlsx';
import path from 'path';
import { uploadFile } from '../services/supabaseStorage';
import { transcodeToMp3, getAudioMetadata } from '../services/transcoder';

const router = Router();

// Multer 설정 - 메모리 저장
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

// 유니코드 정규화 함수
function normalizeTitle(title: string): string {
  return title.normalize('NFC').trim();
}

// 제목에서 기본 제목 추출 (괄호 전까지)
function extractBaseTitle(title: string): string {
  const normalized = normalizeTitle(title);
  // Ballad Ver. 같은 경우는 전체 유지
  if (normalized.includes('Ballad') || normalized.includes('Ver.')) {
    return normalized;
  }
  return normalized.split('(')[0].trim();
}

// 시간 문자열을 초로 변환 (03:44:00 -> 224)
function parseDuration(duration: any): number | null {
  if (!duration) return null;

  // Date 객체인 경우
  if (duration instanceof Date) {
    const hours = duration.getHours();
    const minutes = duration.getMinutes();
    const seconds = duration.getSeconds();
    return hours * 3600 + minutes * 60 + seconds;
  }

  // 문자열인 경우
  const str = String(duration);
  const parts = str.split(':');
  if (parts.length === 3) {
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
  } else if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }
  return null;
}

// 엑셀 업로드 및 트랙 메타데이터 저장
router.post('/upload-excel', authenticateToken, requireAdmin, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    const tracks: any[] = [];
    const errors: string[] = [];

    // 행 2부터 시작 (0,1은 헤더/빈 행)
    for (let i = 2; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      // 컬럼 매핑 (엑셀 양식 기준)
      const title = row[1];
      if (!title) continue;

      const trackData = {
        title: normalizeTitle(String(title)),
        track_code: row[3] || null,
        track_type: row[4] || 'WEBTOON_BGM',
        duration: parseDuration(row[5]),
        bpm: row[6] ? parseInt(row[6]) : null,
        release_date: row[7] || null,
        musical_key: row[8] || null,
        status: row[9] || 'Active',
        artist: row[10] || 'ROUTELABEL',
        energy_level: row[11] || null,
        genre: row[13] || null,
        webtoon: row[14] || null,
        has_license: row[15] === 'Yes',
        is_public: row[17] === 'Yes',
        release_status: row[18] || 'Released',
        mood: row[19] || null,
        tempo: row[20] || null,
        theme: row[21] || null,
        usage_status: row[22] || null
      };

      tracks.push(trackData);
    }

    // DB에 삽입
    let insertedCount = 0;
    let updatedCount = 0;

    for (const track of tracks) {
      try {
        // 웹툰 처리 (있으면 생성하거나 가져오기)
        let webtoonId = null;
        if (track.webtoon) {
          const webtoonResult = await pool.query(
            `INSERT INTO webtoons (title) VALUES ($1)
             ON CONFLICT (title) DO UPDATE SET title = EXCLUDED.title
             RETURNING id`,
            [track.webtoon]
          );
          webtoonId = webtoonResult.rows[0].id;
        }

        // 트랙 코드로 기존 트랙 확인
        const existingTrack = track.track_code
          ? await pool.query('SELECT id FROM tracks WHERE track_code = $1', [track.track_code])
          : { rows: [] };

        let trackId: string;

        if (existingTrack.rows.length > 0) {
          // 기존 트랙 업데이트
          trackId = existingTrack.rows[0].id;
          await pool.query(
            `UPDATE tracks SET
              title = $1, artist = $2, duration = $3, bpm = $4, mood = $5,
              track_type = $6, musical_key = $7, status = $8, energy_level = $9,
              genre = $10, tempo = $11, theme = $12, has_license = $13,
              is_public = $14, release_status = $15, usage_status = $16, release_date = $17
             WHERE id = $18`,
            [
              track.title, track.artist, track.duration, track.bpm, track.mood,
              track.track_type, track.musical_key, track.status, track.energy_level,
              track.genre, track.tempo, track.theme, track.has_license,
              track.is_public, track.release_status, track.usage_status, track.release_date,
              trackId
            ]
          );
          updatedCount++;
        } else {
          // 새 트랙 삽입 (file_key는 임시값 또는 null)
          const insertResult = await pool.query(
            `INSERT INTO tracks (
              title, artist, duration, bpm, mood, track_code, track_type,
              musical_key, status, energy_level, genre, tempo, theme,
              has_license, is_public, release_status, usage_status, release_date,
              file_key
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
             RETURNING id`,
            [
              track.title, track.artist, track.duration, track.bpm, track.mood,
              track.track_code, track.track_type, track.musical_key, track.status,
              track.energy_level, track.genre, track.tempo, track.theme,
              track.has_license, track.is_public, track.release_status, track.usage_status,
              track.release_date, 'pending' // file_key는 음원 업로드 시 매칭
            ]
          );
          trackId = insertResult.rows[0].id;
          insertedCount++;
        }

        // 웹툰-트랙 연결
        if (webtoonId) {
          await pool.query(
            `INSERT INTO track_webtoons (track_id, webtoon_id) VALUES ($1, $2)
             ON CONFLICT (track_id, webtoon_id) DO NOTHING`,
            [trackId, webtoonId]
          );
        }
      } catch (err: any) {
        errors.push(`트랙 "${track.title}" 저장 실패: ${err.message}`);
      }
    }

    res.json({
      success: true,
      message: `${insertedCount}개 신규 추가, ${updatedCount}개 업데이트됨`,
      totalProcessed: tracks.length,
      inserted: insertedCount,
      updated: updatedCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    console.error('Excel upload error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 음원 파일 업로드 및 제목 기반 매칭
router.post('/upload-audio', authenticateToken, requireAdmin, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const originalFilename = req.file.originalname;

    // 파일명에서 제목 추출
    // 형식: "1. 인천 MASTER (320).mp3" -> "인천"
    let extractedTitle = originalFilename;

    // 번호. 제거
    if (/^\d+\.\s*/.test(extractedTitle)) {
      extractedTitle = extractedTitle.replace(/^\d+\.\s*/, '');
    }

    // MASTER (320).mp3 또는 (320).mp3 제거
    extractedTitle = extractedTitle
      .replace(/\s*MASTER\s*\(\d+\)\.mp3$/i, '')
      .replace(/\s*\(\d+\)\.mp3$/i, '')
      .replace(/\.mp3$/i, '')
      .replace(/\.wav$/i, '')
      .replace(/\.flac$/i, '')
      .trim();

    const baseTitle = extractBaseTitle(extractedTitle);
    const normalizedTitle = normalizeTitle(extractedTitle);

    console.log(`📁 업로드 파일: ${originalFilename}`);
    console.log(`🔍 추출된 제목: ${extractedTitle}`);
    console.log(`🔍 기본 제목: ${baseTitle}`);

    // DB에서 매칭되는 트랙 찾기
    // 1. 정확한 제목 매칭
    // 2. 기본 제목 (괄호 전) 매칭
    // 3. 부분 매칭
    let matchResult = await pool.query(
      `SELECT id, title, track_code, file_key FROM tracks
       WHERE LOWER(title) = LOWER($1) OR LOWER(title) LIKE LOWER($2)
       ORDER BY
         CASE WHEN LOWER(title) = LOWER($1) THEN 0 ELSE 1 END,
         created_at DESC
       LIMIT 1`,
      [normalizedTitle, `%${baseTitle}%`]
    );

    if (matchResult.rows.length === 0) {
      return res.status(404).json({
        error: 'No matching track found',
        extractedTitle,
        baseTitle,
        suggestion: '엑셀 파일을 먼저 업로드해주세요'
      });
    }

    const track = matchResult.rows[0];

    // 모든 오디오 → MP3 320kbps 변환
    console.log(`🔄 MP3 변환 중...`);
    const transcodeResult = await transcodeToMp3(req.file.buffer, req.file.mimetype);

    // 오디오 메타데이터 추출 (duration 등)
    const metadata = await getAudioMetadata(req.file.buffer);

    // MP3 파일로 저장
    const mp3Filename = originalFilename.replace(/\.(mp3|wav|flac)$/i, '.mp3');
    const fileKey = `tracks/${track.track_code || track.id}/${mp3Filename}`;
    await uploadFile(fileKey, transcodeResult.buffer, 'audio/mpeg');

    console.log(`✅ 변환 완료: ${transcodeResult.originalSize} → ${transcodeResult.compressedSize} (${Math.round(transcodeResult.compressionRatio * 100)}%)`);

    // DB의 file_key 및 메타데이터 업데이트
    await pool.query(
      `UPDATE tracks SET file_key = $1, file_size = $2, duration = $3, updated_at = NOW() WHERE id = $4`,
      [fileKey, transcodeResult.compressedSize, Math.round(metadata.duration), track.id]
    );

    res.json({
      success: true,
      message: `음원 파일이 "${track.title}" 트랙과 매칭되어 업로드되었습니다`,
      track: {
        id: track.id,
        title: track.title,
        track_code: track.track_code,
        file_key: fileKey
      }
    });
  } catch (error: any) {
    console.error('Audio upload error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 여러 음원 파일 일괄 업로드
router.post('/upload-audio-batch', authenticateToken, requireAdmin, upload.array('files', 50), async (req: AuthRequest, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const results: any[] = [];
    const errors: string[] = [];

    for (const file of files) {
      try {
        const originalFilename = file.originalname;

        // 파일명에서 제목 추출
        let extractedTitle = originalFilename;

        if (/^\d+\.\s*/.test(extractedTitle)) {
          extractedTitle = extractedTitle.replace(/^\d+\.\s*/, '');
        }

        extractedTitle = extractedTitle
          .replace(/\s*MASTER\s*\(\d+\)\.mp3$/i, '')
          .replace(/\s*\(\d+\)\.mp3$/i, '')
          .replace(/\.mp3$/i, '')
          .replace(/\.wav$/i, '')
          .replace(/\.flac$/i, '')
          .trim();

        const baseTitle = extractBaseTitle(extractedTitle);
        const normalizedTitle = normalizeTitle(extractedTitle);

        // DB에서 매칭되는 트랙 찾기
        const matchResult = await pool.query(
          `SELECT id, title, track_code, file_key FROM tracks
           WHERE LOWER(title) = LOWER($1) OR LOWER(title) LIKE LOWER($2)
           ORDER BY
             CASE WHEN LOWER(title) = LOWER($1) THEN 0 ELSE 1 END,
             created_at DESC
           LIMIT 1`,
          [normalizedTitle, `%${baseTitle}%`]
        );

        if (matchResult.rows.length === 0) {
          errors.push(`"${originalFilename}" - 매칭되는 트랙 없음`);
          continue;
        }

        const track = matchResult.rows[0];

        // 모든 오디오 → MP3 320kbps 변환
        console.log(`🔄 MP3 변환 중: ${originalFilename}`);
        const transcodeResult = await transcodeToMp3(file.buffer, file.mimetype);
        const metadata = await getAudioMetadata(file.buffer);

        // MP3 파일로 저장
        const mp3Filename = originalFilename.replace(/\.(mp3|wav|flac)$/i, '.mp3');
        const fileKey = `tracks/${track.track_code || track.id}/${mp3Filename}`;
        await uploadFile(fileKey, transcodeResult.buffer, 'audio/mpeg');

        // DB의 file_key 및 메타데이터 업데이트
        await pool.query(
          `UPDATE tracks SET file_key = $1, file_size = $2, duration = $3, updated_at = NOW() WHERE id = $4`,
          [fileKey, transcodeResult.compressedSize, Math.round(metadata.duration), track.id]
        );

        results.push({
          filename: originalFilename,
          matchedTitle: track.title,
          trackCode: track.track_code,
          originalSize: transcodeResult.originalSize,
          compressedSize: transcodeResult.compressedSize
        });
      } catch (err: any) {
        errors.push(`"${file.originalname}" - ${err.message}`);
      }
    }

    res.json({
      success: true,
      message: `${results.length}/${files.length}개 파일 매칭 및 업로드 완료`,
      matched: results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    console.error('Batch audio upload error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 매칭되지 않은 트랙 목록 (file_key가 'pending'인 트랙)
router.get('/unmatched-tracks', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, title, track_code, artist, created_at
       FROM tracks
       WHERE file_key = 'pending' OR file_key IS NULL
       ORDER BY created_at DESC`
    );

    res.json({
      count: result.rows.length,
      tracks: result.rows
    });
  } catch (error: any) {
    console.error('Get unmatched tracks error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 전체 라이브러리 목록
router.get('/all', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT t.*,
              CASE WHEN t.file_key = 'pending' OR t.file_key IS NULL THEN false ELSE true END as has_audio,
              array_agg(w.title) as webtoons
       FROM tracks t
       LEFT JOIN track_webtoons tw ON t.id = tw.track_id
       LEFT JOIN webtoons w ON tw.webtoon_id = w.id
       GROUP BY t.id
       ORDER BY t.created_at DESC`
    );

    res.json({
      count: result.rows.length,
      tracks: result.rows
    });
  } catch (error: any) {
    console.error('Get all tracks error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;
