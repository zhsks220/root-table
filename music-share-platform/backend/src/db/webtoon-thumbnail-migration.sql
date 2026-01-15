-- 웹툰 장면 썸네일 마이그레이션
-- 사이드바에서 원본 대신 작은 썸네일을 사용하기 위한 컬럼 추가

-- thumbnail_key 컬럼 추가
ALTER TABLE webtoon_scenes
ADD COLUMN IF NOT EXISTS thumbnail_key VARCHAR(500);

-- 코멘트 추가
COMMENT ON COLUMN webtoon_scenes.thumbnail_key IS '사이드바용 썸네일 이미지 (320x192)';
