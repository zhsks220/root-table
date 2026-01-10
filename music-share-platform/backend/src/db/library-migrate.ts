import { pool } from './index';
import fs from 'fs';
import path from 'path';

async function runLibraryMigration() {
  try {
    console.log('🔄 Running library migration...');

    // library-migration.sql 파일 읽기
    const schemaPath = path.join(__dirname, 'library-migration.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // 스키마 실행
    await pool.query(schema);
    console.log('✅ Library schema extended successfully');

    process.exit(0);
  } catch (error) {
    console.error('❌ Library migration failed:', error);
    process.exit(1);
  }
}

runLibraryMigration();
