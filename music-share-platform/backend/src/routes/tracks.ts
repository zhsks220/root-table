import { Router, Response } from 'express';
import { pool } from '../db';
import { AuthRequest } from '../types';
import { authenticateToken } from '../middleware/auth';
import { getStreamUrl, downloadFile } from '../services/supabaseStorage';
import { transcodeToMp3 } from '../services/transcoder';

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

// 음원 다운로드 (FLAC → MP3 실시간 변환)
router.get('/:trackId/download', authenticateToken, async (req: AuthRequest, res: Response) => {
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

    // 파일명 생성 (MP3로 다운로드)
    const filename = `${track.artist} - ${track.title}.mp3`;

    // Supabase에서 파일 다운로드
    console.log(`📥 Downloading file for conversion: ${track.file_key}`);
    const fileBuffer = await downloadFile(track.file_key);

    // FLAC인 경우 MP3로 변환, 아니면 그대로
    let outputBuffer: Buffer;
    const isFlac = track.file_key.toLowerCase().endsWith('.flac');

    if (isFlac) {
      console.log(`🔄 Converting FLAC to MP3...`);
      outputBuffer = await transcodeToMp3(fileBuffer);
    } else {
      outputBuffer = fileBuffer;
    }

    // 다운로드 로그 기록
    await pool.query(
      `INSERT INTO download_logs (user_id, track_id, ip_address, user_agent)
       VALUES ($1, $2, $3, $4)`,
      [userId, trackId, req.ip, req.get('user-agent')]
    );

    // MP3 파일 전송
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Length', outputBuffer.length);
    res.send(outputBuffer);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
