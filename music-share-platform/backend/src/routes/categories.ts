import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { pool } from '../db';
import { AuthRequest } from '../types';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// ============================================
// 공개 API (인증 불필요)
// ============================================

// 전체 카테고리 조회 (트리 구조)
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        c.id, c.name, c.name_en, c.slug, c.parent_id,
        c.description, c.icon, c.color, c.display_order,
        (SELECT COUNT(*) FROM track_categories tc WHERE tc.category_id = c.id) as track_count
      FROM categories c
      WHERE c.is_active = true
      ORDER BY c.display_order, c.name
    `);

    // 트리 구조로 변환
    const categories = result.rows;
    const mainCategories = categories.filter(c => !c.parent_id);
    const subCategories = categories.filter(c => c.parent_id);

    const tree = mainCategories.map(main => ({
      ...main,
      children: subCategories.filter(sub => sub.parent_id === main.id)
    }));

    res.json({ categories: tree });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 메인 카테고리만 조회 (플랫 목록)
router.get('/main', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        c.id, c.name, c.name_en, c.slug, c.icon, c.color, c.display_order,
        (SELECT COUNT(*) FROM track_categories tc
         JOIN categories sub ON tc.category_id = sub.id
         WHERE sub.id = c.id OR sub.parent_id = c.id) as track_count
      FROM categories c
      WHERE c.parent_id IS NULL AND c.is_active = true
      ORDER BY c.display_order
    `);

    res.json({ categories: result.rows });
  } catch (error) {
    console.error('Get main categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 특정 카테고리의 서브카테고리 조회
router.get('/:slug/subcategories', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const result = await pool.query(`
      SELECT
        c.id, c.name, c.name_en, c.slug, c.display_order,
        (SELECT COUNT(*) FROM track_categories tc WHERE tc.category_id = c.id) as track_count
      FROM categories c
      WHERE c.parent_id = (SELECT id FROM categories WHERE slug = $1)
        AND c.is_active = true
      ORDER BY c.display_order
    `, [slug]);

    res.json({ subcategories: result.rows });
  } catch (error) {
    console.error('Get subcategories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 특정 카테고리 상세 정보
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const result = await pool.query(`
      SELECT
        c.id, c.name, c.name_en, c.slug, c.parent_id,
        c.description, c.icon, c.color, c.display_order,
        p.name as parent_name, p.slug as parent_slug,
        (SELECT COUNT(*) FROM track_categories tc WHERE tc.category_id = c.id) as track_count
      FROM categories c
      LEFT JOIN categories p ON c.parent_id = p.id
      WHERE c.slug = $1 AND c.is_active = true
    `, [slug]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ category: result.rows[0] });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 분위기(Mood) 옵션 목록
router.get('/options/moods', async (req: Request, res: Response) => {
  const moods = [
    { value: 'bright', label: '밝은', label_en: 'Bright' },
    { value: 'dark', label: '어두운', label_en: 'Dark' },
    { value: 'emotional', label: '감성적', label_en: 'Emotional' },
    { value: 'energetic', label: '에너지틱', label_en: 'Energetic' },
    { value: 'calm', label: '차분한', label_en: 'Calm' },
    { value: 'happy', label: '행복한', label_en: 'Happy' },
    { value: 'sad', label: '슬픈', label_en: 'Sad' },
    { value: 'romantic', label: '로맨틱', label_en: 'Romantic' },
    { value: 'intense', label: '강렬한', label_en: 'Intense' },
    { value: 'chill', label: '편안한', label_en: 'Chill' }
  ];
  res.json({ moods });
});

// 언어(Language) 옵션 목록
router.get('/options/languages', async (req: Request, res: Response) => {
  const languages = [
    { value: 'ko', label: '한국어', label_en: 'Korean' },
    { value: 'en', label: '영어', label_en: 'English' },
    { value: 'ja', label: '일본어', label_en: 'Japanese' },
    { value: 'zh', label: '중국어', label_en: 'Chinese' },
    { value: 'es', label: '스페인어', label_en: 'Spanish' },
    { value: 'instrumental', label: '연주곡', label_en: 'Instrumental' },
    { value: 'other', label: '기타', label_en: 'Other' }
  ];
  res.json({ languages });
});

// ============================================
// 관리자 API (인증 필요)
// ============================================

const categorySchema = z.object({
  name: z.string().min(1).max(100),
  name_en: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  parent_id: z.string().uuid().optional().nullable(),
  description: z.string().optional(),
  icon: z.string().max(50).optional(),
  color: z.string().max(20).optional(),
  display_order: z.number().int().optional()
});

// 카테고리 생성 (관리자)
router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const data = categorySchema.parse(req.body);

    const result = await pool.query(`
      INSERT INTO categories (name, name_en, slug, parent_id, description, icon, color, display_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      data.name, data.name_en, data.slug, data.parent_id || null,
      data.description || null, data.icon || null, data.color || null,
      data.display_order || 0
    ]);

    res.status(201).json({ success: true, category: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 카테고리 수정 (관리자)
router.put('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = categorySchema.partial().parse(req.body);

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.name_en !== undefined) {
      updates.push(`name_en = $${paramIndex++}`);
      values.push(data.name_en);
    }
    if (data.slug !== undefined) {
      updates.push(`slug = $${paramIndex++}`);
      values.push(data.slug);
    }
    if (data.parent_id !== undefined) {
      updates.push(`parent_id = $${paramIndex++}`);
      values.push(data.parent_id);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.icon !== undefined) {
      updates.push(`icon = $${paramIndex++}`);
      values.push(data.icon);
    }
    if (data.color !== undefined) {
      updates.push(`color = $${paramIndex++}`);
      values.push(data.color);
    }
    if (data.display_order !== undefined) {
      updates.push(`display_order = $${paramIndex++}`);
      values.push(data.display_order);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE categories SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ success: true, category: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 카테고리 삭제 (관리자) - 비활성화
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // 소프트 삭제 (is_active = false)
    const result = await pool.query(
      'UPDATE categories SET is_active = false WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ success: true, message: 'Category deactivated' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
