import { pool } from './index';

async function runMonitoringMigration() {
  try {
    console.log('🔄 Running monitoring migration...');

    const migrationSQL = `
      -- users 테이블 role 제약조건에 developer 추가
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
      ALTER TABLE users ADD CONSTRAINT users_role_check
        CHECK (role IN ('user', 'admin', 'partner', 'developer'));

      -- 에러 로그 테이블
      CREATE TABLE IF NOT EXISTS error_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        error_type VARCHAR(100),
        message TEXT,
        stack TEXT,
        endpoint VARCHAR(255),
        method VARCHAR(10),
        status_code INTEGER,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- API 요청 로그 테이블
      CREATE TABLE IF NOT EXISTS request_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        endpoint VARCHAR(255),
        method VARCHAR(10),
        status_code INTEGER,
        response_time INTEGER,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- 알림 규칙 테이블
      CREATE TABLE IF NOT EXISTS alert_rules (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        metric VARCHAR(50) NOT NULL,
        operator VARCHAR(10) NOT NULL,
        threshold NUMERIC NOT NULL,
        webhook_url TEXT,
        enabled BOOLEAN DEFAULT true,
        last_triggered_at TIMESTAMP,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- 알림 히스토리 테이블
      CREATE TABLE IF NOT EXISTS alert_history (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        alert_rule_id UUID REFERENCES alert_rules(id) ON DELETE CASCADE,
        metric_value NUMERIC,
        threshold NUMERIC,
        message TEXT,
        webhook_status VARCHAR(20),
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- 인덱스 생성
      CREATE INDEX IF NOT EXISTS idx_error_logs_created ON error_logs(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_error_logs_status ON error_logs(status_code);
      CREATE INDEX IF NOT EXISTS idx_request_logs_created ON request_logs(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_request_logs_endpoint ON request_logs(endpoint);
      CREATE INDEX IF NOT EXISTS idx_request_logs_status ON request_logs(status_code);
      CREATE INDEX IF NOT EXISTS idx_alert_history_rule ON alert_history(alert_rule_id);
      CREATE INDEX IF NOT EXISTS idx_alert_history_created ON alert_history(created_at DESC);

      -- 오래된 로그 자동 삭제 함수 (30일 이상)
      CREATE OR REPLACE FUNCTION cleanup_old_logs() RETURNS void AS $$
      BEGIN
        DELETE FROM error_logs WHERE created_at < NOW() - INTERVAL '30 days';
        DELETE FROM request_logs WHERE created_at < NOW() - INTERVAL '30 days';
        DELETE FROM alert_history WHERE created_at < NOW() - INTERVAL '90 days';
      END;
      $$ LANGUAGE plpgsql;
    `;

    await pool.query(migrationSQL);

    console.log('✅ Monitoring migration completed successfully');
    console.log('   - Updated users role constraint (added developer)');
    console.log('   - Created error_logs table');
    console.log('   - Created request_logs table');
    console.log('   - Created alert_rules table');
    console.log('   - Created alert_history table');
    console.log('   - Created indexes for performance');
    console.log('   - Created cleanup_old_logs function');

    process.exit(0);
  } catch (error) {
    console.error('❌ Monitoring migration failed:', error);
    process.exit(1);
  }
}

runMonitoringMigration();
