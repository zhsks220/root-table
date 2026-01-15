-- 웹툰 프로젝트 스키마
-- 웹툰처럼 세로 스크롤되는 이미지에 음악을 매칭하는 시스템

-- updated_at 자동 업데이트 함수 (이미 존재하면 건너뜀)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. 웹툰 프로젝트 테이블
CREATE TABLE IF NOT EXISTS webtoon_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  cover_image_key VARCHAR(500),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. 웹툰 장면 테이블
CREATE TABLE IF NOT EXISTS webtoon_scenes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES webtoon_projects(id) ON DELETE CASCADE NOT NULL,
  image_key VARCHAR(500) NOT NULL,
  thumbnail_key VARCHAR(500),
  display_order INTEGER NOT NULL DEFAULT 0,
  memo TEXT,
  scroll_trigger_position INTEGER DEFAULT 50 CHECK (scroll_trigger_position >= 0 AND scroll_trigger_position <= 100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. 장면-음원 매핑 테이블
CREATE TABLE IF NOT EXISTS scene_tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scene_id UUID REFERENCES webtoon_scenes(id) ON DELETE CASCADE NOT NULL,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(scene_id, track_id)
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_webtoon_projects_created_by ON webtoon_projects(created_by);
CREATE INDEX IF NOT EXISTS idx_webtoon_projects_status ON webtoon_projects(status);
CREATE INDEX IF NOT EXISTS idx_webtoon_scenes_project_id ON webtoon_scenes(project_id);
CREATE INDEX IF NOT EXISTS idx_webtoon_scenes_display_order ON webtoon_scenes(project_id, display_order);
CREATE INDEX IF NOT EXISTS idx_scene_tracks_scene_id ON scene_tracks(scene_id);
CREATE INDEX IF NOT EXISTS idx_scene_tracks_track_id ON scene_tracks(track_id);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_webtoon_projects_updated_at
  BEFORE UPDATE ON webtoon_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webtoon_scenes_updated_at
  BEFORE UPDATE ON webtoon_scenes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
