-- 카테고리 초기 데이터 시드
-- 실행일: 2024-12-23

-- ============================================
-- 메인 카테고리 (15개)
-- ============================================

INSERT INTO categories (name, name_en, slug, icon, color, display_order, description) VALUES
  ('팝', 'Pop', 'pop', '🎵', '#FF6B9D', 1, '대중 음악, K-Pop 포함'),
  ('힙합/랩', 'Hip-Hop/Rap', 'hiphop', '🎤', '#9B59B6', 2, '힙합, 랩, 트랩'),
  ('R&B/소울', 'R&B/Soul', 'rnb', '💜', '#8E44AD', 3, '알앤비, 소울, 네오소울'),
  ('록/메탈', 'Rock/Metal', 'rock', '🎸', '#E74C3C', 4, '록, 얼터너티브, 메탈'),
  ('일렉트로닉', 'Electronic', 'electronic', '🎹', '#3498DB', 5, 'EDM, 하우스, 테크노'),
  ('발라드', 'Ballad', 'ballad', '🎻', '#E91E63', 6, '발라드, 어쿠스틱'),
  ('댄스', 'Dance', 'dance', '💃', '#F39C12', 7, 'K-Pop 댄스, 클럽 뮤직'),
  ('인디/얼터너티브', 'Indie/Alternative', 'indie', '🌟', '#1ABC9C', 8, '인디 록, 인디 팝'),
  ('재즈', 'Jazz', 'jazz', '🎷', '#34495E', 9, '재즈, 스무스 재즈'),
  ('클래식', 'Classical', 'classical', '🎼', '#795548', 10, '클래식, 오케스트라'),
  ('OST/사운드트랙', 'OST/Soundtrack', 'ost', '🎬', '#607D8B', 11, '영화, 드라마 OST'),
  ('트로트', 'Trot', 'trot', '🎤', '#FF5722', 12, '트로트, 뽕짝'),
  ('CCM/종교', 'CCM/Religious', 'ccm', '✝️', '#00BCD4', 13, 'CCM, 가스펠'),
  ('국악/월드', 'Traditional/World', 'traditional', '🥁', '#4CAF50', 14, '국악, 월드뮤직'),
  ('기타', 'Other', 'other', '🎶', '#9E9E9E', 15, '기타 장르')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  display_order = EXCLUDED.display_order,
  description = EXCLUDED.description;

-- ============================================
-- 서브카테고리
-- ============================================

-- 팝 서브카테고리
INSERT INTO categories (name, name_en, slug, parent_id, display_order) VALUES
  ('K-Pop', 'K-Pop', 'kpop', (SELECT id FROM categories WHERE slug = 'pop'), 1),
  ('J-Pop', 'J-Pop', 'jpop', (SELECT id FROM categories WHERE slug = 'pop'), 2),
  ('팝 록', 'Pop Rock', 'pop-rock', (SELECT id FROM categories WHERE slug = 'pop'), 3),
  ('신스팝', 'Synth Pop', 'synth-pop', (SELECT id FROM categories WHERE slug = 'pop'), 4),
  ('어덜트 컨템포러리', 'Adult Contemporary', 'adult-contemporary', (SELECT id FROM categories WHERE slug = 'pop'), 5)
ON CONFLICT (slug) DO NOTHING;

-- 힙합/랩 서브카테고리
INSERT INTO categories (name, name_en, slug, parent_id, display_order) VALUES
  ('한국 힙합', 'Korean Hip-Hop', 'korean-hiphop', (SELECT id FROM categories WHERE slug = 'hiphop'), 1),
  ('트랩', 'Trap', 'trap', (SELECT id FROM categories WHERE slug = 'hiphop'), 2),
  ('붐뱁', 'Boom Bap', 'boom-bap', (SELECT id FROM categories WHERE slug = 'hiphop'), 3),
  ('올드스쿨', 'Old School', 'oldschool-hiphop', (SELECT id FROM categories WHERE slug = 'hiphop'), 4),
  ('뉴스쿨', 'New School', 'newschool-hiphop', (SELECT id FROM categories WHERE slug = 'hiphop'), 5)
ON CONFLICT (slug) DO NOTHING;

-- R&B/소울 서브카테고리
INSERT INTO categories (name, name_en, slug, parent_id, display_order) VALUES
  ('컨템포러리 R&B', 'Contemporary R&B', 'contemporary-rnb', (SELECT id FROM categories WHERE slug = 'rnb'), 1),
  ('네오소울', 'Neo Soul', 'neo-soul', (SELECT id FROM categories WHERE slug = 'rnb'), 2),
  ('소울', 'Soul', 'soul', (SELECT id FROM categories WHERE slug = 'rnb'), 3),
  ('펑크', 'Funk', 'funk', (SELECT id FROM categories WHERE slug = 'rnb'), 4)
ON CONFLICT (slug) DO NOTHING;

-- 록/메탈 서브카테고리
INSERT INTO categories (name, name_en, slug, parent_id, display_order) VALUES
  ('얼터너티브 록', 'Alternative Rock', 'alt-rock', (SELECT id FROM categories WHERE slug = 'rock'), 1),
  ('하드 록', 'Hard Rock', 'hard-rock', (SELECT id FROM categories WHERE slug = 'rock'), 2),
  ('헤비 메탈', 'Heavy Metal', 'heavy-metal', (SELECT id FROM categories WHERE slug = 'rock'), 3),
  ('펑크 록', 'Punk Rock', 'punk-rock', (SELECT id FROM categories WHERE slug = 'rock'), 4),
  ('프로그레시브 록', 'Progressive Rock', 'prog-rock', (SELECT id FROM categories WHERE slug = 'rock'), 5)
ON CONFLICT (slug) DO NOTHING;

-- 일렉트로닉 서브카테고리
INSERT INTO categories (name, name_en, slug, parent_id, display_order) VALUES
  ('EDM', 'EDM', 'edm', (SELECT id FROM categories WHERE slug = 'electronic'), 1),
  ('하우스', 'House', 'house', (SELECT id FROM categories WHERE slug = 'electronic'), 2),
  ('테크노', 'Techno', 'techno', (SELECT id FROM categories WHERE slug = 'electronic'), 3),
  ('트랜스', 'Trance', 'trance', (SELECT id FROM categories WHERE slug = 'electronic'), 4),
  ('퓨처베이스', 'Future Bass', 'future-bass', (SELECT id FROM categories WHERE slug = 'electronic'), 5),
  ('Lo-Fi', 'Lo-Fi', 'lofi', (SELECT id FROM categories WHERE slug = 'electronic'), 6),
  ('앰비언트', 'Ambient', 'ambient', (SELECT id FROM categories WHERE slug = 'electronic'), 7)
ON CONFLICT (slug) DO NOTHING;

-- 발라드 서브카테고리
INSERT INTO categories (name, name_en, slug, parent_id, display_order) VALUES
  ('어쿠스틱', 'Acoustic', 'acoustic', (SELECT id FROM categories WHERE slug = 'ballad'), 1),
  ('피아노 발라드', 'Piano Ballad', 'piano-ballad', (SELECT id FROM categories WHERE slug = 'ballad'), 2),
  ('파워 발라드', 'Power Ballad', 'power-ballad', (SELECT id FROM categories WHERE slug = 'ballad'), 3)
ON CONFLICT (slug) DO NOTHING;

-- 댄스 서브카테고리
INSERT INTO categories (name, name_en, slug, parent_id, display_order) VALUES
  ('K-Pop 댄스', 'K-Pop Dance', 'kpop-dance', (SELECT id FROM categories WHERE slug = 'dance'), 1),
  ('디스코', 'Disco', 'disco', (SELECT id FROM categories WHERE slug = 'dance'), 2),
  ('유로댄스', 'Eurodance', 'eurodance', (SELECT id FROM categories WHERE slug = 'dance'), 3)
ON CONFLICT (slug) DO NOTHING;

-- 인디/얼터너티브 서브카테고리
INSERT INTO categories (name, name_en, slug, parent_id, display_order) VALUES
  ('인디 록', 'Indie Rock', 'indie-rock', (SELECT id FROM categories WHERE slug = 'indie'), 1),
  ('인디 팝', 'Indie Pop', 'indie-pop', (SELECT id FROM categories WHERE slug = 'indie'), 2),
  ('인디 포크', 'Indie Folk', 'indie-folk', (SELECT id FROM categories WHERE slug = 'indie'), 3),
  ('드림팝', 'Dream Pop', 'dream-pop', (SELECT id FROM categories WHERE slug = 'indie'), 4),
  ('슈게이즈', 'Shoegaze', 'shoegaze', (SELECT id FROM categories WHERE slug = 'indie'), 5)
ON CONFLICT (slug) DO NOTHING;

-- 재즈 서브카테고리
INSERT INTO categories (name, name_en, slug, parent_id, display_order) VALUES
  ('스무스 재즈', 'Smooth Jazz', 'smooth-jazz', (SELECT id FROM categories WHERE slug = 'jazz'), 1),
  ('보컬 재즈', 'Vocal Jazz', 'vocal-jazz', (SELECT id FROM categories WHERE slug = 'jazz'), 2),
  ('퓨전 재즈', 'Fusion Jazz', 'fusion-jazz', (SELECT id FROM categories WHERE slug = 'jazz'), 3),
  ('비밥', 'Bebop', 'bebop', (SELECT id FROM categories WHERE slug = 'jazz'), 4)
ON CONFLICT (slug) DO NOTHING;

-- 클래식 서브카테고리
INSERT INTO categories (name, name_en, slug, parent_id, display_order) VALUES
  ('오케스트라', 'Orchestra', 'orchestra', (SELECT id FROM categories WHERE slug = 'classical'), 1),
  ('피아노', 'Piano', 'piano-classical', (SELECT id FROM categories WHERE slug = 'classical'), 2),
  ('실내악', 'Chamber Music', 'chamber-music', (SELECT id FROM categories WHERE slug = 'classical'), 3),
  ('오페라', 'Opera', 'opera', (SELECT id FROM categories WHERE slug = 'classical'), 4)
ON CONFLICT (slug) DO NOTHING;

-- OST/사운드트랙 서브카테고리
INSERT INTO categories (name, name_en, slug, parent_id, display_order) VALUES
  ('영화 OST', 'Film OST', 'film-ost', (SELECT id FROM categories WHERE slug = 'ost'), 1),
  ('드라마 OST', 'Drama OST', 'drama-ost', (SELECT id FROM categories WHERE slug = 'ost'), 2),
  ('게임 OST', 'Game OST', 'game-ost', (SELECT id FROM categories WHERE slug = 'ost'), 3),
  ('애니메이션 OST', 'Anime OST', 'anime-ost', (SELECT id FROM categories WHERE slug = 'ost'), 4)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 확인 쿼리
-- ============================================
-- SELECT
--   c.name as category,
--   p.name as parent,
--   c.slug,
--   c.icon
-- FROM categories c
-- LEFT JOIN categories p ON c.parent_id = p.id
-- ORDER BY COALESCE(p.display_order, c.display_order), c.display_order;
