import { pool } from './index';

async function fixRoleConstraint() {
  try {
    console.log('🔄 Fixing users role constraint...');

    // 기존 제약조건 삭제
    await pool.query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check
    `);
    console.log('✅ Old constraint dropped');

    // 새 제약조건 추가
    await pool.query(`
      ALTER TABLE users ADD CONSTRAINT users_role_check
        CHECK (role IN ('user', 'admin', 'partner'))
    `);
    console.log('✅ New constraint added (user, admin, partner)');

    // 확인
    const result = await pool.query(`
      SELECT DISTINCT role FROM users ORDER BY role
    `);
    console.log('📊 Current roles in database:', result.rows.map(r => r.role).join(', '));

    console.log('\n✅ Role constraint fix completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

fixRoleConstraint();
