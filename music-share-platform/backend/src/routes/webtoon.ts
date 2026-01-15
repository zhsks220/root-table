import { Router, Response } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import sharp from 'sharp';
import { pool } from '../db';
import { AuthRequest } from '../types';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { uploadFile, deleteFile, getStreamUrl, supabase } from '../services/supabaseStorage';

const router = Router();

// 웹툰 이미지용 버킷 이름
const WEBTOON_BUCKET = 'webtoon-images';

// 웹툰 이미지 업로드 함수
async function uploadWebtoonImage(key: string, body: Buffer, contentType: string): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase Storage is not configured');
  }

  const { data, error } = await supabase.storage
    .from(WEBTOON_BUCKET)
    .upload(key, body, {
      contentType,
      upsert: true,
    });

  if (error) {
    console.error('Webtoon image upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  console.log(`📁 Webtoon image uploaded: ${key}`);
  return key;
}

// 웹툰 이미지 URL 생성 함수
async function getWebtoonImageUrl(key: string): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase Storage is not configured');
  }

  const { data, error } = await supabase.storage
    .from(WEBTOON_BUCKET)
    .createSignedUrl(key, 3600); // 1시간

  if (error) {
    console.error('Webtoon image URL error:', error);
    throw new Error(`Failed to get image URL: ${error.message}`);
  }

  return data.signedUrl;
}

// 웹툰 이미지 삭제 함수
async function deleteWebtoonImage(key: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase Storage is not configured');
  }

  const { error } = await supabase.storage
    .from(WEBTOON_BUCKET)
    .remove([key]);

  if (error) {
    console.error('Webtoon image delete error:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }

  console.log(`🗑️ Webtoon image deleted: ${key}`);
}

// 이미지 최적화: JPEG 80% + Progressive
async function optimizeImage(buffer: Buffer): Promise<Buffer> {
  const optimized = await sharp(buffer)
    .jpeg({
      quality: 80,
      progressive: true,
    })
    .toBuffer();

  console.log(`📦 이미지 최적화: ${(buffer.length / 1024).toFixed(0)}KB → ${(optimized.length / 1024).toFixed(0)}KB`);
  return optimized;
}

// URL 캐시 (API 호출 줄이기)
const urlCache = new Map<string, { url: string; expires: number }>();

async function getCachedWebtoonImageUrl(key: string): Promise<string> {
  const cached = urlCache.get(key);
  const now = Date.now();

  if (cached && cached.expires > now + 10 * 60 * 1000) {
    return cached.url;
  }

  const url = await getWebtoonImageUrl(key);
  urlCache.set(key, { url, expires: now + 55 * 60 * 1000 });
  return url;
}

// 이미지 업로드 설정 (10MB 제한)
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images allowed (jpeg, png, webp).'));
    }
  },
});

// 모든 라우트에 인증 필요 (관리자 또는 파트너)
router.use(authenticateToken);

// 권한 체크 미들웨어 (관리자 또는 파트너)
const requireAdminOrPartner = (req: AuthRequest, res: Response, next: any) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  if (req.user.role !== 'admin' && req.user.role !== 'partner') {
    return res.status(403).json({ error: 'Admin or Partner access required' });
  }
  next();
};

router.use(requireAdminOrPartner);

// ===== 프로젝트 CRUD =====

// 프로젝트 목록 조회 (검색, 필터, 페이지네이션)
router.get('/webtoon-projects', async (req: AuthRequest, res: Response) => {
  try {
    const { q, status, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 100);
    const offset = (pageNum - 1) * limitNum;

    let query = `
      SELECT
        wp.id,
        wp.title,
        wp.description,
        wp.cover_image_key,
        wp.created_by,
        wp.status,
        wp.created_at,
        wp.updated_at,
        u.name as creator_name,
        COUNT(ws.id)::int as scene_count
      FROM webtoon_projects wp
      LEFT JOIN users u ON wp.created_by = u.id
      LEFT JOIN webtoon_scenes ws ON wp.id = ws.project_id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    // 파트너는 본인 프로젝트만 조회
    if (req.user?.role === 'partner') {
      query += ` AND wp.created_by = $${paramIndex}`;
      params.push(req.user.id);
      paramIndex++;
    }

    // 검색
    if (q) {
      query += ` AND (wp.title ILIKE $${paramIndex} OR wp.description ILIKE $${paramIndex})`;
      params.push(`%${q}%`);
      paramIndex++;
    }

    // 상태 필터
    if (status) {
      query += ` AND wp.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` GROUP BY wp.id, wp.title, wp.description, wp.cover_image_key, wp.created_by, wp.status, wp.created_at, wp.updated_at, u.name ORDER BY wp.created_at DESC`;

    // 전체 개수 조회
    const countQuery = query
      .replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(DISTINCT wp.id) FROM')
      .replace(/GROUP BY.*ORDER BY.*/, '');
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count, 10);

    // 페이지네이션 적용
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limitNum, offset);

    const result = await pool.query(query, params);

    // 커버 이미지 URL 생성
    const projects = await Promise.all(result.rows.map(async (project) => {
      let cover_image_url = null;
      if (project.cover_image_key) {
        try {
          cover_image_url = await getStreamUrl(project.cover_image_key);
        } catch (error) {
          console.error('Failed to generate cover image URL:', error);
        }
      }
      return { ...project, cover_image_url };
    }));

    res.json({
      projects,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching webtoon projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// 프로젝트 생성 (커버 이미지 선택)
router.post('/webtoon-projects', imageUpload.single('cover_image'), async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, status = 'draft' } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    let coverImageKey: string | null = null;

    // 커버 이미지 업로드
    if (req.file) {
      const fileExt = req.file.originalname.split('.').pop() || 'jpg';
      const projectId = crypto.randomUUID();
      coverImageKey = `webtoon-images/projects/${projectId}/cover.${fileExt}`;
      await uploadFile(coverImageKey, req.file.buffer, req.file.mimetype);
    }

    const result = await pool.query(
      `INSERT INTO webtoon_projects (title, description, cover_image_key, created_by, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, description || null, coverImageKey, req.user!.id, status]
    );

    const project = result.rows[0];

    // 커버 이미지 URL 생성
    let cover_image_url = null;
    if (project.cover_image_key) {
      cover_image_url = await getStreamUrl(project.cover_image_key);
    }

    res.status(201).json({
      success: true,
      project: { ...project, cover_image_url },
    });
  } catch (error) {
    console.error('Error creating webtoon project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// 프로젝트 상세 조회 (장면 + 음원 포함)
router.get('/webtoon-projects/:projectId', async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;

    // 프로젝트 조회
    const projectResult = await pool.query(
      `SELECT wp.*, u.name as creator_name
       FROM webtoon_projects wp
       LEFT JOIN users u ON wp.created_by = u.id
       WHERE wp.id = $1`,
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projectResult.rows[0];

    // 권한 체크 (파트너는 본인 것만)
    if (req.user?.role === 'partner' && project.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // 장면 조회
    const scenesResult = await pool.query(
      `SELECT * FROM webtoon_scenes
       WHERE project_id = $1
       ORDER BY display_order ASC`,
      [projectId]
    );

    // 각 장면의 음원 조회
    const scenes = await Promise.all(scenesResult.rows.map(async (scene) => {
      const tracksResult = await pool.query(
        `SELECT st.*, t.title, t.artist, t.duration
         FROM scene_tracks st
         JOIN tracks t ON st.track_id = t.id
         WHERE st.scene_id = $1
         ORDER BY st.display_order ASC`,
        [scene.id]
      );

      // 이미지 URL 생성 (캐시 사용)
      let image_url = null;
      if (scene.image_key) {
        try {
          image_url = await getCachedWebtoonImageUrl(scene.image_key);
        } catch (error) {
          console.error('Failed to generate scene image URL:', error);
        }
      }

      return {
        ...scene,
        image_url,
        tracks: tracksResult.rows,
      };
    }));

    // 커버 이미지 URL 생성
    let cover_image_url = null;
    if (project.cover_image_key) {
      try {
        cover_image_url = await getStreamUrl(project.cover_image_key);
      } catch (error) {
        console.error('Failed to generate cover image URL:', error);
      }
    }

    res.json({
      project: {
        ...project,
        cover_image_url,
        scenes,
      },
    });
  } catch (error) {
    console.error('Error fetching project details:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// 프로젝트 수정
router.patch('/webtoon-projects/:projectId', imageUpload.single('cover_image'), async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { title, description, status } = req.body;

    // 프로젝트 존재 확인
    const projectResult = await pool.query(
      'SELECT * FROM webtoon_projects WHERE id = $1',
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projectResult.rows[0];

    // 권한 체크
    if (req.user?.role === 'partner' && project.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let coverImageKey = project.cover_image_key;

    // 새 커버 이미지 업로드
    if (req.file) {
      // 기존 이미지 삭제
      if (coverImageKey) {
        try {
          await deleteFile(coverImageKey);
        } catch (error) {
          console.error('Failed to delete old cover image:', error);
        }
      }

      const fileExt = req.file.originalname.split('.').pop() || 'jpg';
      coverImageKey = `webtoon-images/projects/${projectId}/cover.${fileExt}`;
      await uploadFile(coverImageKey, req.file.buffer, req.file.mimetype);
    }

    // 업데이트할 필드 구성
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex}`);
      params.push(title);
      paramIndex++;
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      params.push(description);
      paramIndex++;
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }
    if (req.file) {
      updates.push(`cover_image_key = $${paramIndex}`);
      params.push(coverImageKey);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(projectId);

    const result = await pool.query(
      `UPDATE webtoon_projects SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    const updatedProject = result.rows[0];

    // 커버 이미지 URL 생성
    let cover_image_url = null;
    if (updatedProject.cover_image_key) {
      cover_image_url = await getStreamUrl(updatedProject.cover_image_key);
    }

    res.json({
      success: true,
      project: { ...updatedProject, cover_image_url },
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// 프로젝트 삭제
router.delete('/webtoon-projects/:projectId', async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;

    // 프로젝트 존재 확인
    const projectResult = await pool.query(
      'SELECT * FROM webtoon_projects WHERE id = $1',
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projectResult.rows[0];

    // 권한 체크
    if (req.user?.role === 'partner' && project.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // 장면 이미지들 삭제
    const scenesResult = await pool.query(
      'SELECT image_key FROM webtoon_scenes WHERE project_id = $1',
      [projectId]
    );

    for (const scene of scenesResult.rows) {
      if (scene.image_key) {
        try {
          await deleteWebtoonImage(scene.image_key);
        } catch (error) {
          console.error('Failed to delete scene image:', error);
        }
      }
    }

    // 커버 이미지 삭제
    if (project.cover_image_key) {
      try {
        await deleteFile(project.cover_image_key);
      } catch (error) {
        console.error('Failed to delete cover image:', error);
      }
    }

    // 프로젝트 삭제 (CASCADE로 장면과 scene_tracks도 자동 삭제)
    await pool.query('DELETE FROM webtoon_projects WHERE id = $1', [projectId]);

    res.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// ===== 장면 관리 =====

// 장면 이미지 업로드
router.post('/webtoon-projects/:projectId/scenes', imageUpload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { display_order, memo, scroll_trigger_position = 50 } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    // 프로젝트 존재 및 권한 확인
    const projectResult = await pool.query(
      'SELECT * FROM webtoon_projects WHERE id = $1',
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projectResult.rows[0];

    if (req.user?.role === 'partner' && project.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // display_order 자동 계산
    let order = display_order ? parseInt(display_order, 10) : null;
    if (order === null) {
      const maxOrderResult = await pool.query(
        'SELECT COALESCE(MAX(display_order), -1) + 1 as next_order FROM webtoon_scenes WHERE project_id = $1',
        [projectId]
      );
      order = maxOrderResult.rows[0].next_order;
    }

    // 이미지 최적화 (JPEG 변환)
    const sceneId = crypto.randomUUID();
    const imageKey = `webtoon-images/projects/${projectId}/scenes/${sceneId}.jpg`;

    const optimizedBuffer = await optimizeImage(req.file.buffer);
    await uploadWebtoonImage(imageKey, optimizedBuffer, 'image/jpeg');

    // DB에 저장
    const result = await pool.query(
      `INSERT INTO webtoon_scenes (id, project_id, image_key, display_order, memo, scroll_trigger_position)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [sceneId, projectId, imageKey, order, memo || null, scroll_trigger_position]
    );

    const scene = result.rows[0];

    // 이미지 URL 생성 (캐시)
    const image_url = await getCachedWebtoonImageUrl(imageKey);

    res.status(201).json({
      success: true,
      scene: { ...scene, image_url },
    });
  } catch (error) {
    console.error('Error uploading scene:', error);
    res.status(500).json({ error: 'Failed to upload scene' });
  }
});

// 장면 수정
router.patch('/webtoon-projects/:projectId/scenes/:sceneId', imageUpload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, sceneId } = req.params;
    const { memo, display_order, scroll_trigger_position } = req.body;

    // 프로젝트 권한 확인
    const projectResult = await pool.query(
      'SELECT * FROM webtoon_projects WHERE id = $1',
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (req.user?.role === 'partner' && projectResult.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // 장면 존재 확인
    const sceneResult = await pool.query(
      'SELECT * FROM webtoon_scenes WHERE id = $1 AND project_id = $2',
      [sceneId, projectId]
    );

    if (sceneResult.rows.length === 0) {
      return res.status(404).json({ error: 'Scene not found' });
    }

    const scene = sceneResult.rows[0];
    let imageKey = scene.image_key;

    // 새 이미지 업로드
    if (req.file) {
      // 기존 이미지 삭제
      if (imageKey) {
        try {
          await deleteWebtoonImage(imageKey);
        } catch (error) {
          console.error('Failed to delete old scene image:', error);
        }
      }

      imageKey = `webtoon-images/projects/${projectId}/scenes/${sceneId}.jpg`;
      const optimizedBuffer = await optimizeImage(req.file.buffer);
      await uploadWebtoonImage(imageKey, optimizedBuffer, 'image/jpeg');
    }

    // 업데이트할 필드 구성
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (memo !== undefined) {
      updates.push(`memo = $${paramIndex}`);
      params.push(memo);
      paramIndex++;
    }
    if (display_order !== undefined) {
      updates.push(`display_order = $${paramIndex}`);
      params.push(parseInt(display_order, 10));
      paramIndex++;
    }
    if (scroll_trigger_position !== undefined) {
      updates.push(`scroll_trigger_position = $${paramIndex}`);
      params.push(parseInt(scroll_trigger_position, 10));
      paramIndex++;
    }
    if (req.file) {
      updates.push(`image_key = $${paramIndex}`);
      params.push(imageKey);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(sceneId);

    const result = await pool.query(
      `UPDATE webtoon_scenes SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    const updatedScene = result.rows[0];
    const image_url = await getCachedWebtoonImageUrl(updatedScene.image_key);

    res.json({
      success: true,
      scene: { ...updatedScene, image_url },
    });
  } catch (error) {
    console.error('Error updating scene:', error);
    res.status(500).json({ error: 'Failed to update scene' });
  }
});

// 장면 순서 재정렬
router.patch('/webtoon-projects/:projectId/scenes/reorder', async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { scenes } = req.body; // [{ id, display_order }]

    if (!Array.isArray(scenes)) {
      return res.status(400).json({ error: 'Scenes array is required' });
    }

    // 프로젝트 권한 확인
    const projectResult = await pool.query(
      'SELECT * FROM webtoon_projects WHERE id = $1',
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (req.user?.role === 'partner' && projectResult.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const scene of scenes) {
        await client.query(
          'UPDATE webtoon_scenes SET display_order = $1 WHERE id = $2 AND project_id = $3',
          [scene.display_order, scene.id, projectId]
        );
      }

      await client.query('COMMIT');
      res.json({
        success: true,
        message: 'Scenes reordered successfully',
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error reordering scenes:', error);
    res.status(500).json({ error: 'Failed to reorder scenes' });
  }
});

// 장면 삭제
router.delete('/webtoon-projects/:projectId/scenes/:sceneId', async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, sceneId } = req.params;

    // 프로젝트 권한 확인
    const projectResult = await pool.query(
      'SELECT * FROM webtoon_projects WHERE id = $1',
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (req.user?.role === 'partner' && projectResult.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // 장면 조회
    const sceneResult = await pool.query(
      'SELECT * FROM webtoon_scenes WHERE id = $1 AND project_id = $2',
      [sceneId, projectId]
    );

    if (sceneResult.rows.length === 0) {
      return res.status(404).json({ error: 'Scene not found' });
    }

    const scene = sceneResult.rows[0];

    // 이미지 삭제
    if (scene.image_key) {
      try {
        await deleteWebtoonImage(scene.image_key);
      } catch (error) {
        console.error('Failed to delete scene image:', error);
      }
    }

    // 장면 삭제 (CASCADE로 scene_tracks도 자동 삭제)
    await pool.query('DELETE FROM webtoon_scenes WHERE id = $1', [sceneId]);

    res.json({
      success: true,
      message: 'Scene deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting scene:', error);
    res.status(500).json({ error: 'Failed to delete scene' });
  }
});

// ===== 장면-음원 연결 =====

// 음원 연결
router.post('/webtoon-projects/:projectId/scenes/:sceneId/tracks', async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, sceneId } = req.params;
    const { track_id, display_order = 0 } = req.body;

    if (!track_id) {
      return res.status(400).json({ error: 'track_id is required' });
    }

    // 프로젝트 권한 확인
    const projectResult = await pool.query(
      'SELECT * FROM webtoon_projects WHERE id = $1',
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (req.user?.role === 'partner' && projectResult.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // 장면 존재 확인
    const sceneResult = await pool.query(
      'SELECT * FROM webtoon_scenes WHERE id = $1 AND project_id = $2',
      [sceneId, projectId]
    );

    if (sceneResult.rows.length === 0) {
      return res.status(404).json({ error: 'Scene not found' });
    }

    // 음원 존재 확인
    const trackResult = await pool.query(
      'SELECT * FROM tracks WHERE id = $1',
      [track_id]
    );

    if (trackResult.rows.length === 0) {
      return res.status(404).json({ error: 'Track not found' });
    }

    // 연결 생성
    const result = await pool.query(
      `INSERT INTO scene_tracks (scene_id, track_id, display_order)
       VALUES ($1, $2, $3)
       ON CONFLICT (scene_id, track_id) DO UPDATE SET display_order = $3
       RETURNING *`,
      [sceneId, track_id, display_order]
    );

    res.status(201).json({
      success: true,
      scene_track: result.rows[0],
    });
  } catch (error) {
    console.error('Error linking track to scene:', error);
    res.status(500).json({ error: 'Failed to link track' });
  }
});

// 음원 연결 해제
router.delete('/webtoon-projects/:projectId/scenes/:sceneId/tracks/:trackId', async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, sceneId, trackId } = req.params;

    // 프로젝트 권한 확인
    const projectResult = await pool.query(
      'SELECT * FROM webtoon_projects WHERE id = $1',
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (req.user?.role === 'partner' && projectResult.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // 연결 삭제
    const result = await pool.query(
      'DELETE FROM scene_tracks WHERE scene_id = $1 AND track_id = $2 RETURNING *',
      [sceneId, trackId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Track link not found' });
    }

    res.json({
      success: true,
      message: 'Track unlinked successfully',
    });
  } catch (error) {
    console.error('Error unlinking track from scene:', error);
    res.status(500).json({ error: 'Failed to unlink track' });
  }
});

// ===== 프로젝트 데이터 (마커, 메모) =====

// 프로젝트 데이터 저장
router.put('/webtoon-projects/:projectId/data', async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { trackMarkers, memoNotes } = req.body;

    // 프로젝트 권한 확인
    const projectResult = await pool.query(
      'SELECT * FROM webtoon_projects WHERE id = $1',
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (req.user?.role === 'partner' && projectResult.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 기존 마커 삭제
      await client.query(
        'DELETE FROM webtoon_track_markers WHERE project_id = $1',
        [projectId]
      );

      // 새 마커 저장
      if (trackMarkers && trackMarkers.length > 0) {
        for (const marker of trackMarkers) {
          await client.query(
            `INSERT INTO webtoon_track_markers (id, project_id, track_id, position_y)
             VALUES ($1, $2, $3, $4)`,
            [marker.id, projectId, marker.trackId, marker.positionY]
          );
        }
      }

      // 기존 메모 삭제
      await client.query(
        'DELETE FROM webtoon_memo_notes WHERE project_id = $1',
        [projectId]
      );

      // 새 메모 저장
      if (memoNotes && memoNotes.length > 0) {
        for (const note of memoNotes) {
          await client.query(
            `INSERT INTO webtoon_memo_notes (id, project_id, content, position_x, position_y, width, height)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [note.id, projectId, note.content, note.positionX, note.positionY, note.width, note.height]
          );
        }
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Project data saved successfully',
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error saving project data:', error);
    res.status(500).json({ error: 'Failed to save project data' });
  }
});

// 프로젝트 데이터 조회
router.get('/webtoon-projects/:projectId/data', async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;

    // 프로젝트 권한 확인
    const projectResult = await pool.query(
      'SELECT * FROM webtoon_projects WHERE id = $1',
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (req.user?.role === 'partner' && projectResult.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // 트랙 마커 조회 (트랙 정보 포함)
    const markersResult = await pool.query(
      `SELECT wtm.id, wtm.track_id, wtm.position_y,
              t.title, t.artist, t.duration, t.file_key
       FROM webtoon_track_markers wtm
       JOIN tracks t ON wtm.track_id = t.id
       WHERE wtm.project_id = $1
       ORDER BY wtm.position_y ASC`,
      [projectId]
    );

    // 메모 노트 조회
    const memosResult = await pool.query(
      `SELECT id, content, position_x, position_y, width, height
       FROM webtoon_memo_notes
       WHERE project_id = $1
       ORDER BY position_y ASC`,
      [projectId]
    );

    res.json({
      trackMarkers: markersResult.rows.map(row => ({
        id: row.id,
        track: {
          id: row.track_id,
          title: row.title,
          artist: row.artist,
          duration: row.duration,
          file_key: row.file_key,
        },
        position: { x: 0, y: row.position_y },
      })),
      memoNotes: memosResult.rows.map(row => ({
        id: row.id,
        scene_id: '',
        content: row.content,
        position_x: row.position_x,
        position_y: row.position_y,
        width: row.width,
        height: row.height,
      })),
    });
  } catch (error) {
    console.error('Error loading project data:', error);
    res.status(500).json({ error: 'Failed to load project data' });
  }
});

export default router;
