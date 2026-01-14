import { pool } from './index';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  const sqlFile = path.join(__dirname, 'webtoon-data-schema.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');

  console.log('🚀 Running migration: webtoon-data-schema.sql');

  try {
    await pool.query(sql);
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

runMigration();
