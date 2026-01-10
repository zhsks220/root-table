-- 음원 라이브러리 확장 마이그레이션
-- 엑셀 양식의 모든 필드를 지원하기 위한 스키마 확장

-- ============================================
-- 1. tracks 테이블 확장
-- ============================================

-- 트랙 코드 (RL_2026_0001 형식)
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS track_code VARCHAR(50) UNIQUE;

-- 트랙 유형 (WEBTOON_BGM 등)
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS track_type VARCHAR(50);

-- 음악 키 (Em, Cm, Bm 등)
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS musical_key VARCHAR(10);

-- 상태 (Active, Inactive 등)
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Active';

-- 에너지 레벨 (LOW, MID, HIGH)
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS energy_level VARCHAR(10);

-- 장르 (Hip-Hop, Dance, Rock 등 - 복수 가능)
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS genre VARCHAR(100);

-- 템포 (Slow, Mid, Fast)
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS tempo VARCHAR(20);

-- 테마 (Dark, Action 등)
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS theme VARCHAR(50);

-- 라이선스 여부
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS has_license BOOLEAN DEFAULT TRUE;

-- 공개 여부
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;

-- 릴리즈 상태 (Released, Unreleased 등)
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS release_status VARCHAR(20) DEFAULT 'Released';

-- 사용 상태 (Used, Unused)
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS usage_status VARCHAR(20);

-- 릴리즈 날짜
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS release_date DATE;

-- ============================================
-- 2. 웹툰-트랙 연결 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS webtoons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL UNIQUE,
  title_en VARCHAR(255),
  description TEXT,
  thumbnail_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS track_webtoons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  webtoon_id UUID REFERENCES webtoons(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(track_id, webtoon_id)
);

-- ============================================
-- 3. 인덱스 생성
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tracks_track_code ON tracks(track_code);
CREATE INDEX IF NOT EXISTS idx_tracks_track_type ON tracks(track_type);
CREATE INDEX IF NOT EXISTS idx_tracks_status ON tracks(status);
CREATE INDEX IF NOT EXISTS idx_tracks_energy_level ON tracks(energy_level);
CREATE INDEX IF NOT EXISTS idx_tracks_genre ON tracks(genre);
CREATE INDEX IF NOT EXISTS idx_tracks_tempo ON tracks(tempo);
CREATE INDEX IF NOT EXISTS idx_tracks_theme ON tracks(theme);
CREATE INDEX IF NOT EXISTS idx_tracks_release_status ON tracks(release_status);
CREATE INDEX IF NOT EXISTS idx_track_webtoons_track ON track_webtoons(track_id);
CREATE INDEX IF NOT EXISTS idx_track_webtoons_webtoon ON track_webtoons(webtoon_id);

-- ============================================
-- 4. 웹툰 updated_at 트리거
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_webtoons_updated_at') THEN
    CREATE TRIGGER update_webtoons_updated_at
      BEFORE UPDATE ON webtoons
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;

-- ============================================
-- 완료
-- ============================================
