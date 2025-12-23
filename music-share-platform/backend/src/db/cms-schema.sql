-- CMS 유통사 정산 시스템 스키마
-- 기존 tracks 테이블과 연동

-- 유통사 테이블 (Digital Service Provider)
CREATE TABLE IF NOT EXISTS distributors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  logo_url VARCHAR(500),
  commission_rate DECIMAL(5,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 월별 음원 정산 데이터
CREATE TABLE IF NOT EXISTS monthly_settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  distributor_id UUID REFERENCES distributors(id) ON DELETE CASCADE,
  year_month VARCHAR(7) NOT NULL,
  gross_revenue DECIMAL(15,2) DEFAULT 0,
  net_revenue DECIMAL(15,2) DEFAULT 0,
  management_fee DECIMAL(15,2) DEFAULT 0,
  stream_count BIGINT DEFAULT 0,
  download_count BIGINT DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'KRW',
  data_source VARCHAR(50) DEFAULT 'manual',
  external_ref VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(track_id, distributor_id, year_month)
);

-- 앨범/음반 정산 데이터 (물리 음반 판매 포함)
CREATE TABLE IF NOT EXISTS album_settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  album_name VARCHAR(255) NOT NULL,
  artist_name VARCHAR(255),
  distributor_id UUID REFERENCES distributors(id) ON DELETE CASCADE,
  year_month VARCHAR(7) NOT NULL,
  sale_type VARCHAR(50) DEFAULT 'digital',
  sale_quantity INTEGER DEFAULT 0,
  gross_amount DECIMAL(15,2) DEFAULT 0,
  net_amount DECIMAL(15,2) DEFAULT 0,
  return_quantity INTEGER DEFAULT 0,
  return_amount DECIMAL(15,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'KRW',
  data_source VARCHAR(50) DEFAULT 'manual',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 정산 데이터 업로드 이력
CREATE TABLE IF NOT EXISTS settlement_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT,
  record_count INTEGER DEFAULT 0,
  upload_type VARCHAR(50) DEFAULT 'excel',
  status VARCHAR(20) DEFAULT 'pending',
  error_message TEXT,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 외부 API 연동 설정
CREATE TABLE IF NOT EXISTS external_api_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  distributor_id UUID REFERENCES distributors(id) ON DELETE CASCADE,
  api_name VARCHAR(100) NOT NULL,
  api_url VARCHAR(500),
  api_key_encrypted VARCHAR(500),
  sync_frequency VARCHAR(50) DEFAULT 'daily',
  last_sync_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_monthly_settlements_year_month ON monthly_settlements(year_month);
CREATE INDEX IF NOT EXISTS idx_monthly_settlements_track_id ON monthly_settlements(track_id);
CREATE INDEX IF NOT EXISTS idx_monthly_settlements_distributor_id ON monthly_settlements(distributor_id);
CREATE INDEX IF NOT EXISTS idx_album_settlements_year_month ON album_settlements(year_month);
CREATE INDEX IF NOT EXISTS idx_album_settlements_distributor_id ON album_settlements(distributor_id);

-- updated_at 트리거
CREATE TRIGGER update_distributors_updated_at BEFORE UPDATE ON distributors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_settlements_updated_at BEFORE UPDATE ON monthly_settlements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_album_settlements_updated_at BEFORE UPDATE ON album_settlements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_external_api_configs_updated_at BEFORE UPDATE ON external_api_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
