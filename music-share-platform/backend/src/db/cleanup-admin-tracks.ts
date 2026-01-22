import { pool } from './index';

async function cleanupAdminTracks() {
  console.log('🧹 Cleaning up admin user_tracks records...');

  try {
    // admin 역할 사용자의 user_tracks 레코드 삭제
    const result = await pool.query(`
      DELETE FROM user_tracks
      WHERE user_id IN (SELECT id FROM users WHERE role = 'admin')
      RETURNING user_id, track_id
    `);

    console.log(`✅ Deleted ${result.rowCount} admin user_tracks records`);

    // 남은 user_tracks 레코드 확인
    const remaining = await pool.query(`
      SELECT u.username, u.role, COUNT(ut.track_id) as track_count
      FROM users u
      LEFT JOIN user_tracks ut ON u.id = ut.user_id
      GROUP BY u.id, u.username, u.role
      ORDER BY u.role, u.username
    `);

    console.log('\n📊 Current user_tracks summary:');
    remaining.rows.forEach(row => {
      console.log(`  ${row.username} (${row.role}): ${row.track_count} tracks`);
    });

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

cleanupAdminTracks();
