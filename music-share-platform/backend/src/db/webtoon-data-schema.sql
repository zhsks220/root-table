-- 웹툰 프로젝트 데이터 스키마 (마커, 메모)
-- 웹툰 편집기에서 사용하는 트랙 마커와 메모 노트를 저장

-- 1. 트랙 마커 테이블 (스크롤 위치에 따른 음원 재생 포인트)
CREATE TABLE IF NOT EXISTS webtoon_track_markers (
  id VARCHAR(100) PRIMARY KEY,
  project_id UUID REFERENCES webtoon_projects(id) ON DELETE CASCADE NOT NULL,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE NOT NULL,
  position_y NUMERIC NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. 메모 노트 테이블 (편집용 메모)
CREATE TABLE IF NOT EXISTS webtoon_memo_notes (
  id VARCHAR(100) PRIMARY KEY,
  project_id UUID REFERENCES webtoon_projects(id) ON DELETE CASCADE NOT NULL,
  content TEXT,
  position_x NUMERIC NOT NULL,
  position_y NUMERIC NOT NULL,
  width NUMERIC NOT NULL DEFAULT 200,
  height NUMERIC NOT NULL DEFAULT 100,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_webtoon_track_markers_project ON webtoon_track_markers(project_id);
CREATE INDEX IF NOT EXISTS idx_webtoon_track_markers_position ON webtoon_track_markers(project_id, position_y);
CREATE INDEX IF NOT EXISTS idx_webtoon_memo_notes_project ON webtoon_memo_notes(project_id);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_webtoon_track_markers_updated_at
  BEFORE UPDATE ON webtoon_track_markers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webtoon_memo_notes_updated_at
  BEFORE UPDATE ON webtoon_memo_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
