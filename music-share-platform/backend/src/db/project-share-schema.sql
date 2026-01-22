-- 웹툰 프로젝트 공유 기능 스키마
-- 파트너와 웹툰 프로젝트를 공유하여 협업할 수 있는 기능

-- 1. 프로젝트 공유 링크 테이블
CREATE TABLE IF NOT EXISTS project_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES webtoon_projects(id) ON DELETE CASCADE NOT NULL,
  share_token VARCHAR(64) UNIQUE NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. 프로젝트 협업자 테이블
CREATE TABLE IF NOT EXISTS project_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES webtoon_projects(id) ON DELETE CASCADE NOT NULL,
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE NOT NULL,
  share_id UUID REFERENCES project_shares(id) ON DELETE SET NULL,
  permission VARCHAR(20) DEFAULT 'edit' CHECK (permission IN ('view', 'edit')),
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, partner_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_project_shares_token ON project_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_project_shares_project ON project_shares(project_id);
CREATE INDEX IF NOT EXISTS idx_project_shares_active ON project_shares(is_active);

CREATE INDEX IF NOT EXISTS idx_project_collaborators_partner ON project_collaborators(partner_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_project ON project_collaborators(project_id);
