import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { pool } from '../db';

async function fixUsername() {
  try {
    console.log('Updating deve0001 → deve0220...');

    // deve0001 → deve0220으로 변경
    const result = await pool.query(
      `UPDATE users SET username = 'deve0220' WHERE username = 'deve0001' RETURNING id, username, email, name`
    );

    if (result.rows.length > 0) {
      console.log('✅ Updated:', result.rows[0]);
    } else {
      console.log('⚠️ No user found with username deve0001 (already changed?)');
    }

    // 전체 사용자 확인
    const check = await pool.query('SELECT username, name, role FROM users ORDER BY created_at');
    console.log('\n📋 All users:');
    check.rows.forEach((u: any) => console.log(`  - ${u.username} (${u.name}) [${u.role}]`));

    await pool.end();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixUsername();
