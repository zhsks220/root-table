import { Router, Response } from 'express';
import { pool } from '../db';
import { AuthRequest } from '../types';
import { authenticateToken } from '../middleware/auth';
import { getStreamUrl, getDownloadUrl } from '../services/s3';

const router = Router();

// 내 음원 목록
router.get('/my-tracks', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const result = await pool.query(
      `SELECT t.id, t.title, t.artist, t.album, t.duration, ut.can_download
       FROM tracks t
       INNER JOIN user_tracks ut ON t.id = ut.track_id
       WHERE ut.user_id = $1
       ORDER BY t.created_at DESC`,
      [userId]
    );

    res.json({ tracks: result.rows });
  } catch (error) {
    console.error('Get my tracks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 음원 스트리밍 URL 생성
router.get('/:trackId/stream', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { trackId } = req.params;
    const userId = req.user!.id;

    // 권한 확인
    const accessResult = await pool.query(
      `SELECT t.file_key
       FROM tracks t
       INNER JOIN user_tracks ut ON t.id = ut.track_id
       WHERE t.id = $1 AND ut.user_id = $2`,
      [trackId, userId]
    );

    if (accessResult.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const track = accessResult.rows[0];

    // S3 Pre-signed URL 생성
    const streamUrl = await getStreamUrl(track.file_key);

    res.json({ streamUrl, expiresIn: 3600 });
  } catch (error) {
    console.error('Stream error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 음원 다운로드 URL 생성
router.post('/:trackId/download', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { trackId } = req.params;
    const userId = req.user!.id;

    // 권한 확인
    const accessResult = await pool.query(
      `SELECT t.file_key, t.title, t.artist, ut.can_download
       FROM tracks t
       INNER JOIN user_tracks ut ON t.id = ut.track_id
       WHERE t.id = $1 AND ut.user_id = $2`,
      [trackId, userId]
    );

    if (accessResult.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const track = accessResult.rows[0];

    if (!track.can_download) {
      return res.status(403).json({ error: 'Download not allowed' });
    }

    // 파일명 생성
    const filename = `${track.artist} - ${track.title}.mp3`;

    // S3 Pre-signed URL 생성
    const downloadUrl = await getDownloadUrl(track.file_key, filename);

    // 다운로드 로그 기록
    await pool.query(
      `INSERT INTO download_logs (user_id, track_id, ip_address, user_agent)
       VALUES ($1, $2, $3, $4)`,
      [userId, trackId, req.ip, req.get('user-agent')]
    );

    res.json({ downloadUrl, expiresIn: 900, filename });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
