-- 데이터베이스 스키마 (PostgreSQL)

-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 사용자 테이블
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  invitation_code VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 초대 테이블
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_by UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 음원 테이블
CREATE TABLE tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  artist VARCHAR(255) NOT NULL,
  album VARCHAR(255),
  duration INTEGER,
  file_key VARCHAR(500) NOT NULL,
  file_size BIGINT,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 초대-음원 매핑 (초대 시 할당할 음원)
CREATE TABLE invitation_tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invitation_id UUID REFERENCES invitations(id) ON DELETE CASCADE,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(invitation_id, track_id)
);

-- 사용자-음원 매핑 (사용자별 접근 권한)
CREATE TABLE user_tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  invitation_id UUID REFERENCES invitations(id) ON DELETE SET NULL,
  can_download BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, track_id)
);

-- 다운로드 로그
CREATE TABLE download_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  track_id UUID REFERENCES tracks(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  downloaded_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_invitations_code ON invitations(code);
CREATE INDEX idx_invitations_is_used ON invitations(is_used);
CREATE INDEX idx_user_tracks_user_id ON user_tracks(user_id);
CREATE INDEX idx_user_tracks_track_id ON user_tracks(track_id);
CREATE INDEX idx_tracks_title ON tracks(title);
CREATE INDEX idx_tracks_artist ON tracks(artist);

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 트리거
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tracks_updated_at BEFORE UPDATE ON tracks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
