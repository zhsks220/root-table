import { Router, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import crypto from 'crypto';
import { pool } from '../db';
import { AuthRequest } from '../types';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { uploadFile, deleteFile } from '../services/s3';

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

// 음원 업로드
router.post('/tracks', upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { title, artist, album, duration } = req.body;

    if (!title || !artist) {
      return res.status(400).json({ error: 'Title and artist are required' });
    }

    // S3 키 생성
    const fileExt = req.file.originalname.split('.').pop();
    const fileKey = `tracks/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${fileExt}`;

    // S3 업로드
    await uploadFile(fileKey, req.file.buffer, req.file.mimetype);

    // DB에 저장
    const result = await pool.query(
      `INSERT INTO tracks (title, artist, album, duration, file_key, file_size, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title, artist, album || null, duration || null, fileKey, req.file.size, req.user!.id]
    );

    res.status(201).json({ success: true, track: result.rows[0] });
  } catch (error) {
    console.error('Upload track error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 음원 목록 조회
router.get('/tracks', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, title, artist, album, duration, file_size, created_at
       FROM tracks
       ORDER BY created_at DESC`
    );

    res.json({ tracks: result.rows });
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
