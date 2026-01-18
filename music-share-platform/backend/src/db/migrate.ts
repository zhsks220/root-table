import { pool } from './index';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';

async function runMigration() {
  try {
    console.log('🔄 Running database migration...');

    // schema.sql 파일 읽기
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // 스키마 실행
    await pool.query(schema);
    console.log('✅ Schema created successfully');

    // 관리자 계정 생성 - 환경변수 필수
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required');
    }

    if (adminPassword.length < 12) {
      throw new Error('ADMIN_PASSWORD must be at least 12 characters');
    }

    const passwordHash = await bcrypt.hash(adminPassword, 12);

    await pool.query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      [adminEmail, passwordHash, 'Admin', 'admin']
    );

    console.log('✅ Admin user created');
    console.log(`   Email: ${adminEmail}`);
    console.log('⚠️  IMPORTANT: Change the admin password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
