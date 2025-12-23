-- 파트너(아티스트/회사) 정산 공유 시스템 스키마
-- 기존 users, tracks, monthly_settlements 테이블과 연동

-- 파트너 프로필 테이블 (users 확장)
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  partner_type VARCHAR(20) NOT NULL CHECK (partner_type IN ('artist', 'company', 'composer')),
  business_name VARCHAR(255),
  representative_name VARCHAR(100),
  business_number VARCHAR(20),
  phone VARCHAR(20),
  address TEXT,
  bank_name VARCHAR(50),
  bank_account VARCHAR(50),
  bank_holder VARCHAR(100),
  contract_start_date DATE,
  contract_end_date DATE,
  default_share_rate DECIMAL(5,2) DEFAULT 0.00,
  memo TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 파트너-트랙 연결 테이블 (지분율 관리)
CREATE TABLE IF NOT EXISTS partner_tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  share_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  role VARCHAR(50) DEFAULT 'artist',
  contract_start_date DATE,
  contract_end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(partner_id, track_id)
);

-- 파트너별 정산 내역 (월별 집계)
CREATE TABLE IF NOT EXISTS partner_settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  year_month VARCHAR(7) NOT NULL,
  total_gross_revenue DECIMAL(15,2) DEFAULT 0,
  total_net_revenue DECIMAL(15,2) DEFAULT 0,
  partner_share DECIMAL(15,2) DEFAULT 0,
  management_fee DECIMAL(15,2) DEFAULT 0,
  total_streams BIGINT DEFAULT 0,
  total_downloads BIGINT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid')),
  confirmed_at TIMESTAMP,
  paid_at TIMESTAMP,
  payment_ref VARCHAR(255),
  memo TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(partner_id, year_month)
);

-- 파트너 정산 상세 내역 (트랙별)
CREATE TABLE IF NOT EXISTS partner_settlement_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_settlement_id UUID REFERENCES partner_settlements(id) ON DELETE CASCADE,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  distributor_id UUID REFERENCES distributors(id) ON DELETE SET NULL,
  gross_revenue DECIMAL(15,2) DEFAULT 0,
  net_revenue DECIMAL(15,2) DEFAULT 0,
  share_rate DECIMAL(5,2) DEFAULT 0,
  partner_share DECIMAL(15,2) DEFAULT 0,
  stream_count BIGINT DEFAULT 0,
  download_count BIGINT DEFAULT 0,
  source_settlement_id UUID REFERENCES monthly_settlements(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 정산 알림/메시지 테이블
CREATE TABLE IF NOT EXISTS settlement_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  partner_settlement_id UUID REFERENCES partner_settlements(id) ON DELETE CASCADE,
  notification_type VARCHAR(30) DEFAULT 'settlement_ready'
    CHECK (notification_type IN ('settlement_ready', 'settlement_confirmed', 'payment_complete', 'general')),
  title VARCHAR(255) NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 파트너 초대 테이블 (기존 invitations 확장)
CREATE TABLE IF NOT EXISTS partner_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invitation_code VARCHAR(50) UNIQUE NOT NULL,
  partner_type VARCHAR(20) NOT NULL CHECK (partner_type IN ('artist', 'company', 'composer')),
  business_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  default_share_rate DECIMAL(5,2) DEFAULT 0.00,
  memo TEXT,
  is_used BOOLEAN DEFAULT FALSE,
  used_by UUID REFERENCES users(id) ON DELETE SET NULL,
  used_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 파트너 초대에 포함된 트랙 목록
CREATE TABLE IF NOT EXISTS partner_invitation_tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invitation_id UUID REFERENCES partner_invitations(id) ON DELETE CASCADE,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  share_rate DECIMAL(5,2) DEFAULT 0.00,
  role VARCHAR(50) DEFAULT 'artist',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(invitation_id, track_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_partners_user_id ON partners(user_id);
CREATE INDEX IF NOT EXISTS idx_partners_partner_type ON partners(partner_type);
CREATE INDEX IF NOT EXISTS idx_partners_is_active ON partners(is_active);

CREATE INDEX IF NOT EXISTS idx_partner_tracks_partner_id ON partner_tracks(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_tracks_track_id ON partner_tracks(track_id);
CREATE INDEX IF NOT EXISTS idx_partner_tracks_is_active ON partner_tracks(is_active);

CREATE INDEX IF NOT EXISTS idx_partner_settlements_partner_id ON partner_settlements(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_settlements_year_month ON partner_settlements(year_month);
CREATE INDEX IF NOT EXISTS idx_partner_settlements_status ON partner_settlements(status);

CREATE INDEX IF NOT EXISTS idx_partner_settlement_details_settlement_id ON partner_settlement_details(partner_settlement_id);
CREATE INDEX IF NOT EXISTS idx_partner_settlement_details_track_id ON partner_settlement_details(track_id);

CREATE INDEX IF NOT EXISTS idx_settlement_notifications_partner_id ON settlement_notifications(partner_id);
CREATE INDEX IF NOT EXISTS idx_settlement_notifications_is_read ON settlement_notifications(is_read);

CREATE INDEX IF NOT EXISTS idx_partner_invitations_code ON partner_invitations(invitation_code);
CREATE INDEX IF NOT EXISTS idx_partner_invitations_is_used ON partner_invitations(is_used);

-- updated_at 트리거
CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partner_tracks_updated_at BEFORE UPDATE ON partner_tracks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partner_settlements_updated_at BEFORE UPDATE ON partner_settlements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- users 테이블에 role 확장 (partner 역할 추가)
-- 기존 role 체크 제약조건 수정이 필요함
-- ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
-- ALTER TABLE users ADD CONSTRAINT users_role_check
--   CHECK (role IN ('user', 'admin', 'partner'));

-- 주석: 위 ALTER 문은 기존 데이터 마이그레이션 시 별도 실행 필요
