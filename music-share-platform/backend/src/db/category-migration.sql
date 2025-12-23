-- 카테고리 시스템 마이그레이션
-- 실행일: 2024-12-23

-- ============================================
-- 1. 카테고리 테이블 생성
-- ============================================

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(20),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 카테고리 인덱스
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_order ON categories(display_order);

-- ============================================
-- 2. 트랙-카테고리 매핑 테이블 (다대다)
-- ============================================

CREATE TABLE IF NOT EXISTS track_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(track_id, category_id)
);

-- 트랙-카테고리 인덱스
CREATE INDEX IF NOT EXISTS idx_track_categories_track ON track_categories(track_id);
CREATE INDEX IF NOT EXISTS idx_track_categories_category ON track_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_track_categories_primary ON track_categories(is_primary);

-- ============================================
-- 3. tracks 테이블 확장
-- ============================================

-- 분위기 필드
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS mood VARCHAR(50);

-- 언어 필드
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS language VARCHAR(20) DEFAULT 'ko';

-- BPM 필드
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS bpm INTEGER;

-- 발매년도 필드
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS release_year INTEGER;

-- 성인 콘텐츠 여부
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS is_explicit BOOLEAN DEFAULT FALSE;

-- 설명 필드
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS description TEXT;

-- 태그 배열
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS tags TEXT[];

-- tracks 추가 인덱스
CREATE INDEX IF NOT EXISTS idx_tracks_mood ON tracks(mood);
CREATE INDEX IF NOT EXISTS idx_tracks_language ON tracks(language);
CREATE INDEX IF NOT EXISTS idx_tracks_release_year ON tracks(release_year);
CREATE INDEX IF NOT EXISTS idx_tracks_tags ON tracks USING GIN(tags);

-- 전문 검색을 위한 인덱스 (제목 + 아티스트 + 앨범)
CREATE INDEX IF NOT EXISTS idx_tracks_search ON tracks
  USING GIN(to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(artist, '') || ' ' || coalesce(album, '')));

-- ============================================
-- 4. 카테고리 updated_at 트리거
-- ============================================

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 완료 메시지
-- ============================================
-- SELECT 'Category migration completed successfully!' as status;
