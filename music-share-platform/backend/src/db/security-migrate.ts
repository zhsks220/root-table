import { pool } from './index';

async function runSecurityMigration() {
  try {
    console.log('🔄 Running security migration...');

    // users 테이블에 계정 잠금 관련 컬럼 추가
    const migrationSQL = `
      -- 로그인 시도 횟수 컬럼 추가
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS login_attempts INT DEFAULT 0;

      -- 계정 잠금 해제 시간 컬럼 추가
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;

      -- 인덱스 추가 (잠금된 계정 조회 성능 향상)
      CREATE INDEX IF NOT EXISTS idx_users_locked_until
      ON users (locked_until)
      WHERE locked_until IS NOT NULL;
    `;

    await pool.query(migrationSQL);
    console.log('✅ Security migration completed successfully');
    console.log('   - Added login_attempts column (INT DEFAULT 0)');
    console.log('   - Added locked_until column (TIMESTAMP)');
    console.log('   - Created index on locked_until');

    process.exit(0);
  } catch (error) {
    console.error('❌ Security migration failed:', error);
    process.exit(1);
  }
}

runSecurityMigration();
