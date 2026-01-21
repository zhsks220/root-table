/**
 * 사용자 관리 시스템 마이그레이션
 * - username 컬럼 추가 (계정 ID: deve0001, route001, cu0001, cp0001)
 * - force_password_change 컬럼 추가 (첫 로그인 시 비밀번호 변경 강제)
 *
 * 실행: npx ts-node src/scripts/user-management-migrate.ts
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function migrate() {
  const client = await pool.connect();

  try {
    console.log('🚀 사용자 관리 시스템 마이그레이션 시작...\n');

    // 1. username 컬럼 추가
    console.log('1️⃣ username 컬럼 추가...');
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS username VARCHAR(20) UNIQUE
    `);
    console.log('   ✅ username 컬럼 추가 완료\n');

    // 2. force_password_change 컬럼 추가
    console.log('2️⃣ force_password_change 컬럼 추가...');
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN DEFAULT false
    `);
    console.log('   ✅ force_password_change 컬럼 추가 완료\n');

    // 3. 기존 사용자에게 username 생성 (없는 경우)
    console.log('3️⃣ 기존 사용자 username 생성...');
    const existingUsers = await client.query(`
      SELECT id, role, username FROM users WHERE username IS NULL ORDER BY created_at
    `);

    for (const user of existingUsers.rows) {
      const prefix = getPrefixByRole(user.role);
      const nextNum = await getNextNumber(client, prefix);
      const username = `${prefix}${nextNum.toString().padStart(4, '0')}`;

      await client.query(
        'UPDATE users SET username = $1 WHERE id = $2',
        [username, user.id]
      );
      console.log(`   - ${user.role} → ${username}`);
    }
    console.log(`   ✅ ${existingUsers.rows.length}명 username 생성 완료\n`);

    // 4. username 인덱스 생성
    console.log('4️⃣ username 인덱스 생성...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)
    `);
    console.log('   ✅ 인덱스 생성 완료\n');

    // 5. 현재 테이블 구조 확인
    console.log('5️⃣ 현재 users 테이블 구조:');
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    console.table(columns.rows);

    // 6. 현재 사용자 목록 확인
    console.log('\n6️⃣ 현재 사용자 목록:');
    const users = await client.query(`
      SELECT username, email, role, force_password_change, created_at
      FROM users ORDER BY created_at
    `);
    console.table(users.rows);

    console.log('\n✅ 마이그레이션 완료!');

  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

function getPrefixByRole(role: string): string {
  switch (role) {
    case 'developer': return 'deve';
    case 'admin': return 'route';
    case 'partner': return 'cp';
    case 'user':
    default: return 'cu';
  }
}

async function getNextNumber(client: any, prefix: string): Promise<number> {
  const result = await client.query(
    `SELECT username FROM users WHERE username LIKE $1 ORDER BY username DESC LIMIT 1`,
    [`${prefix}%`]
  );

  if (result.rows.length === 0) {
    return 1;
  }

  const lastUsername = result.rows[0].username;
  const numPart = lastUsername.replace(prefix, '');
  return parseInt(numPart, 10) + 1;
}

migrate().catch(console.error);
