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

    // 관리자 계정 생성
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    await pool.query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      [adminEmail, passwordHash, 'Admin', 'admin']
    );

    console.log('✅ Admin user created');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('');
    console.log('⚠️  IMPORTANT: Change the admin password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
