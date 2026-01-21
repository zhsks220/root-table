import bcrypt from 'bcrypt';
import { pool } from './index';

async function createDeveloper() {
  const email = 'deve0220';
  const password = 'Wlsgudqkr1!';
  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, 'developer') RETURNING id, email, role`,
      [email, hashedPassword, 'Developer']
    );
    console.log('✅ Developer account created:', result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      // 이미 존재하면 role만 업데이트
      const result = await pool.query(
        `UPDATE users SET role = 'developer' WHERE email = $1 RETURNING id, email, role`,
        [email]
      );
      console.log('✅ Updated to developer role:', result.rows[0]);
    } else {
      console.error('Error:', error.message);
    }
  }
  await pool.end();
  process.exit(0);
}

createDeveloper();
