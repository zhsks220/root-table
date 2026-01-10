import { Router, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import crypto from 'crypto';
import { pool } from '../db';
import { AuthRequest } from '../types';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { uploadFile, deleteFile, getStreamUrl, downloadFile } from '../services/supabaseStorage';
import { transcodeToFlac, transcodeToMp3, getAudioMetadata, checkFfmpegInstalled } from '../services/transcoder';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/flac'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files allowed.'));
    }
  },
});

// 모든 라우트에 인증 + 관리자 권한 필요
router.use(authenticateToken, requireAdmin);

// 음원 업로드 (카테고리 지원 + FLAC 트랜스코딩)
router.post('/tracks', upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const {
      title, artist, album, duration,
      categoryIds, mood, language, bpm, release_year,
      is_explicit, description, tags
    } = req.body;

    if (!title || !artist) {
      return res.status(400).json({ error: 'Title and artist are required' });
    }

    // FLAC으로 트랜스코딩 (무손실 압축)
    let finalBuffer = req.file.buffer;
    let finalMimeType = req.file.mimetype;
    let compressionInfo = '';

    // FFmpeg가 설치되어 있으면 FLAC으로 변환
    const ffmpegAvailable = await checkFfmpegInstalled();
    if (ffmpegAvailable && req.file.mimetype !== 'audio/flac') {
      try {
        const result = await transcodeToFlac(req.file.buffer, req.file.mimetype);
        finalBuffer = result.buffer;
        finalMimeType = 'audio/flac';
        compressionInfo = ` (${Math.round(result.compressionRatio * 100)}% of original)`;
        console.log(`🎵 Transcoded to FLAC: ${result.originalSize} → ${result.compressedSize}${compressionInfo}`);
      } catch (transcodeError) {
        console.warn('⚠️ FLAC transcoding failed, using original file:', transcodeError);
        // 트랜스코딩 실패 시 원본 사용
      }
    }

    // 파일 키 생성 (항상 .flac 확장자 사용, 실패 시 원본 확장자)
    const fileExt = finalMimeType === 'audio/flac' ? 'flac' : req.file.originalname.split('.').pop();
    const fileKey = `tracks/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${fileExt}`;

    // 오디오 메타데이터 추출 (duration)
    let extractedDuration = duration ? parseFloat(duration) : null;
    if (!extractedDuration && ffmpegAvailable) {
      try {
        const metadata = await getAudioMetadata(req.file.buffer);
        extractedDuration = metadata.duration || null;
      } catch {}
    }

    // Supabase Storage 업로드
    await uploadFile(fileKey, finalBuffer, finalMimeType);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 태그 파싱 (쉼표로 구분된 문자열 → 배열)
      let parsedTags: string[] | null = null;
      if (tags) {
        parsedTags = typeof tags === 'string'
          ? tags.split(',').map((t: string) => t.trim()).filter((t: string) => t)
          : tags;
      }

      // DB에 저장 (압축된 파일 크기 사용)
      const result = await client.query(
        `INSERT INTO tracks (
          title, artist, album, duration, file_key, file_size, uploaded_by,
          mood, language, bpm, release_year, is_explicit, description, tags
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          title, artist, album || null, extractedDuration, fileKey, finalBuffer.length, req.user!.id,
          mood || null, language || 'ko', bpm ? parseInt(bpm) : null,
          release_year ? parseInt(release_year) : null,
          is_explicit === 'true' || is_explicit === true,
          description || null, parsedTags
        ]
      );

      const track = result.rows[0];

      // 카테고리 연결
      if (categoryIds) {
        const categoryIdArray = typeof categoryIds === 'string'
          ? JSON.parse(categoryIds)
          : categoryIds;

        for (let i = 0; i < categoryIdArray.length; i++) {
          await client.query(
            `INSERT INTO track_categories (track_id, category_id, is_primary)
             VALUES ($1, $2, $3)`,
            [track.id, categoryIdArray[i], i === 0] // 첫 번째가 primary
          );
        }
      }

      await client.query('COMMIT');

      res.status(201).json({ success: true, track });
    } catch (error) {
      await client.query('ROLLBACK');
      // S3에서 파일 삭제 (롤백 시)
      try {
        await deleteFile(fileKey);
      } catch {}
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Upload track error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 음원 목록 조회 (검색 및 필터 지원)
router.get('/tracks', async (req: AuthRequest, res: Response) => {
  try {
    const {
      q, // 검색어
      category, // 카테고리 ID
      mood, // 분위기
      language, // 언어
      sort = 'created_at', // 정렬 기준
      order = 'desc', // 정렬 방향
      page = '1', // 페이지
      limit = '50' // 페이지당 개수
    } = req.query;

    let query = `
      SELECT
        t.id, t.title, t.artist, t.album, t.duration, t.file_size, t.created_at,
        t.mood, t.language, t.bpm, t.release_year, t.is_explicit, t.description, t.tags,
        t.genre, t.theme, t.energy_level, t.tempo, t.musical_key, t.track_code,
        (
          SELECT json_agg(json_build_object(
            'id', c.id,
            'name', c.name,
            'slug', c.slug,
            'icon', c.icon,
            'is_primary', tc2.is_primary
          ))
          FROM track_categories tc2
          JOIN categories c ON tc2.category_id = c.id
          WHERE tc2.track_id = t.id
        ) as categories
      FROM tracks t
    `;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // 카테고리 필터 - EXISTS 사용하여 중복 방지
    if (category) {
      conditions.push(`EXISTS (
        SELECT 1 FROM track_categories tc
        WHERE tc.track_id = t.id
        AND (tc.category_id = $${paramIndex} OR tc.category_id IN (SELECT id FROM categories WHERE parent_id = $${paramIndex}))
      )`);
      params.push(category);
      paramIndex++;
    }

    // 검색어 필터
    if (q && typeof q === 'string' && q.trim()) {
      const searchTerm = `%${q.trim().toLowerCase()}%`;
      conditions.push(`(
        LOWER(t.title) LIKE $${paramIndex} OR
        LOWER(t.artist) LIKE $${paramIndex} OR
        LOWER(t.album) LIKE $${paramIndex} OR
        $${paramIndex + 1} = ANY(SELECT LOWER(unnest(t.tags)))
      )`);
      params.push(searchTerm, q.trim().toLowerCase());
      paramIndex += 2;
    }

    // 분위기 필터
    if (mood && typeof mood === 'string') {
      conditions.push(`t.mood = $${paramIndex}`);
      params.push(mood);
      paramIndex++;
    }

    // 언어 필터
    if (language && typeof language === 'string') {
      conditions.push(`t.language = $${paramIndex}`);
      params.push(language);
      paramIndex++;
    }

    // WHERE 절 조합
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    // 정렬
    const validSortFields = ['created_at', 'title', 'artist', 'album', 'duration'];
    const sortField = validSortFields.includes(sort as string) ? sort : 'created_at';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY t.${sortField} ${sortOrder}`;

    // 페이지네이션
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 50));
    const offset = (pageNum - 1) * limitNum;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limitNum, offset);

    const result = await pool.query(query, params);

    // 전체 개수 조회 - EXISTS 사용하므로 별도 JOIN 불필요
    let countQuery = 'SELECT COUNT(*) FROM tracks t';
    if (conditions.length > 0) {
      countQuery += ` WHERE ${conditions.join(' AND ')}`;
    }
    const countResult = await pool.query(countQuery, params.slice(0, -2));
    const total = parseInt(countResult.rows[0].count);

    res.json({
      tracks: result.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get tracks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 음원 삭제
router.delete('/tracks/:trackId', async (req: AuthRequest, res: Response) => {
  try {
    const { trackId } = req.params;

    // 음원 정보 조회
    const trackResult = await pool.query('SELECT file_key FROM tracks WHERE id = $1', [trackId]);

    if (trackResult.rows.length === 0) {
      return res.status(404).json({ error: 'Track not found' });
    }

    const { file_key } = trackResult.rows[0];

    // S3에서 삭제
    await deleteFile(file_key);

    // DB에서 삭제 (CASCADE로 관련 레코드도 삭제됨)
    await pool.query('DELETE FROM tracks WHERE id = $1', [trackId]);

    res.json({ success: true, message: 'Track deleted' });
  } catch (error) {
    console.error('Delete track error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 트랙 메타데이터 수정 (관리자 전용)
const updateTrackSchema = z.object({
  title: z.string().optional(),
  artist: z.string().optional(),
  album: z.string().optional(),
  mood: z.string().nullable().optional(),
  language: z.string().nullable().optional(),
  bpm: z.number().nullable().optional(),
  release_year: z.number().nullable().optional(),
  is_explicit: z.boolean().optional(),
  description: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  categories: z.array(z.object({
    id: z.string(),
    is_primary: z.boolean().optional()
  })).optional()
});

router.patch('/tracks/:trackId', async (req: AuthRequest, res: Response) => {
  try {
    const { trackId } = req.params;
    const updates = updateTrackSchema.parse(req.body);

    // 트랙 존재 확인
    const trackCheck = await pool.query('SELECT id FROM tracks WHERE id = $1', [trackId]);
    if (trackCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Track not found' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 기본 필드 업데이트
      const { categories, ...trackUpdates } = updates;
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      Object.entries(trackUpdates).forEach(([key, value]) => {
        if (value !== undefined) {
          updateFields.push(`${key} = $${paramIndex}`);
          updateValues.push(value);
          paramIndex++;
        }
      });

      if (updateFields.length > 0) {
        updateValues.push(trackId);
        await client.query(
          `UPDATE tracks SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex}`,
          updateValues
        );
      }

      // 카테고리 업데이트
      if (categories !== undefined) {
        // 기존 카테고리 삭제
        await client.query('DELETE FROM track_categories WHERE track_id = $1', [trackId]);

        // 새 카테고리 추가
        if (categories && categories.length > 0) {
          for (const cat of categories) {
            await client.query(
              `INSERT INTO track_categories (track_id, category_id, is_primary)
               VALUES ($1, $2, $3)`,
              [trackId, cat.id, cat.is_primary || false]
            );
          }
        }
      }

      await client.query('COMMIT');

      // 업데이트된 트랙 조회
      const result = await pool.query(`
        SELECT
          t.id, t.title, t.artist, t.album, t.duration, t.file_size, t.created_at,
          t.mood, t.language, t.bpm, t.release_year, t.is_explicit, t.description, t.tags,
          (
            SELECT json_agg(json_build_object(
              'id', c.id,
              'name', c.name,
              'slug', c.slug,
              'icon', c.icon,
              'is_primary', tc.is_primary
            ))
            FROM track_categories tc
            JOIN categories c ON tc.category_id = c.id
            WHERE tc.track_id = t.id
          ) as categories
        FROM tracks t
        WHERE t.id = $1
      `, [trackId]);

      res.json({ success: true, track: result.rows[0] });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Update track error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 단일 트랙 조회 (수정 모달용)
router.get('/tracks/:trackId', async (req: AuthRequest, res: Response) => {
  try {
    const { trackId } = req.params;

    const result = await pool.query(`
      SELECT
        t.id, t.title, t.artist, t.album, t.duration, t.file_size, t.created_at,
        t.mood, t.language, t.bpm, t.release_year, t.is_explicit, t.description, t.tags,
        t.genre, t.theme, t.energy_level, t.tempo, t.musical_key, t.track_code,
        (
          SELECT json_agg(json_build_object(
            'id', c.id,
            'name', c.name,
            'slug', c.slug,
            'icon', c.icon,
            'is_primary', tc.is_primary
          ))
          FROM track_categories tc
          JOIN categories c ON tc.category_id = c.id
          WHERE tc.track_id = t.id
        ) as categories
      FROM tracks t
      WHERE t.id = $1
    `, [trackId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Track not found' });
    }

    res.json({ track: result.rows[0] });
  } catch (error) {
    console.error('Get track error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 관리자 스트리밍 URL 조회 (user_tracks 체크 안함)
router.get('/tracks/:trackId/stream', async (req: AuthRequest, res: Response) => {
  try {
    const { trackId } = req.params;

    // 관리자는 모든 트랙에 접근 가능 - 직접 tracks 테이블에서 조회
    const result = await pool.query(
      'SELECT file_key FROM tracks WHERE id = $1',
      [trackId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Track not found' });
    }

    const { file_key } = result.rows[0];
    const streamUrl = await getStreamUrl(file_key);

    res.json({ streamUrl });
  } catch (error) {
    console.error('Admin stream URL error:', error);
    res.status(500).json({ error: 'Failed to get stream URL' });
  }
});

// 관리자 다운로드 (FLAC → MP3 실시간 변환)
router.get('/tracks/:trackId/download', async (req: AuthRequest, res: Response) => {
  try {
    const { trackId } = req.params;

    // 관리자는 모든 트랙에 접근 가능
    const result = await pool.query(
      'SELECT file_key, title, artist FROM tracks WHERE id = $1',
      [trackId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Track not found' });
    }

    const { file_key, title, artist } = result.rows[0];

    // 파일명 생성 (MP3로 다운로드)
    const filename = `${artist} - ${title}.mp3`;

    // Supabase에서 파일 다운로드
    console.log(`📥 [Admin] Downloading file for conversion: ${file_key}`);
    const fileBuffer = await downloadFile(file_key);

    // FLAC인 경우 MP3로 변환, 아니면 그대로
    let outputBuffer: Buffer;
    const isFlac = file_key.toLowerCase().endsWith('.flac');

    if (isFlac) {
      console.log(`🔄 [Admin] Converting FLAC to MP3...`);
      outputBuffer = await transcodeToMp3(fileBuffer);
    } else {
      outputBuffer = fileBuffer;
    }

    // MP3 파일 전송
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Length', outputBuffer.length);
    res.send(outputBuffer);
  } catch (error) {
    console.error('Admin download error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// 초대 생성
const createInviteSchema = z.object({
  trackIds: z.array(z.string()).min(1),
  expiresInDays: z.number().optional(),
});

router.post('/invitations', async (req: AuthRequest, res: Response) => {
  try {
    const { trackIds, expiresInDays } = createInviteSchema.parse(req.body);

    // 초대 코드 생성
    const code = `INV-${crypto.randomBytes(8).toString('hex')}`;

    // 만료일 계산
    let expiresAt = null;
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 초대 생성
      const inviteResult = await client.query(
        `INSERT INTO invitations (code, created_by, expires_at)
         VALUES ($1, $2, $3)
         RETURNING id, code, expires_at`,
        [code, req.user!.id, expiresAt]
      );

      const invitation = inviteResult.rows[0];

      // 음원 할당
      for (const trackId of trackIds) {
        await client.query(
          `INSERT INTO invitation_tracks (invitation_id, track_id)
           VALUES ($1, $2)`,
          [invitation.id, trackId]
        );
      }

      await client.query('COMMIT');

      // 초대 URL 생성
      const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite/${code}`;

      res.status(201).json({
        success: true,
        invitation: {
          code: invitation.code,
          inviteUrl,
          trackCount: trackIds.length,
          expiresAt: invitation.expires_at,
        },
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Create invitation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 초대 목록 조회
router.get('/invitations', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT i.id, i.code, i.is_used, i.expires_at, i.created_at,
         u.email as used_by_email,
         (SELECT COUNT(*) FROM invitation_tracks WHERE invitation_id = i.id) as track_count
       FROM invitations i
       LEFT JOIN users u ON i.used_by = u.id
       ORDER BY i.created_at DESC`
    );

    res.json({ invitations: result.rows });
  } catch (error) {
    console.error('Get invitations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 사용자 목록 조회
router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.name, u.role, u.created_at,
         (SELECT COUNT(*) FROM user_tracks WHERE user_id = u.id) as track_count
       FROM users u
       ORDER BY u.created_at DESC`
    );

    res.json({ users: result.rows });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
