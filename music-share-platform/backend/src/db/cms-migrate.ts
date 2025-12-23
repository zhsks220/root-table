import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('🚀 CMS 데이터베이스 마이그레이션 시작...\n');

    // uuid-ossp 확장 확인
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('   ✅ uuid-ossp 확장 확인됨');

    // 1. 유통사 테이블
    await client.query(`
      CREATE TABLE IF NOT EXISTS distributors (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        logo_url VARCHAR(500),
        commission_rate DECIMAL(5,2) DEFAULT 0.00,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('   ✅ 테이블 생성: distributors');

    // 2. 월별 음원 정산 데이터
    await client.query(`
      CREATE TABLE IF NOT EXISTS monthly_settlements (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        track_id UUID,
        distributor_id UUID REFERENCES distributors(id) ON DELETE CASCADE,
        year_month VARCHAR(7) NOT NULL,
        gross_revenue DECIMAL(15,2) DEFAULT 0,
        net_revenue DECIMAL(15,2) DEFAULT 0,
        management_fee DECIMAL(15,2) DEFAULT 0,
        stream_count BIGINT DEFAULT 0,
        download_count BIGINT DEFAULT 0,
        currency VARCHAR(3) DEFAULT 'KRW',
        data_source VARCHAR(50) DEFAULT 'manual',
        external_ref VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('   ✅ 테이블 생성: monthly_settlements');

    // 3. 앨범/음반 정산 데이터
    await client.query(`
      CREATE TABLE IF NOT EXISTS album_settlements (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        album_name VARCHAR(255) NOT NULL,
        artist_name VARCHAR(255),
        distributor_id UUID REFERENCES distributors(id) ON DELETE CASCADE,
        year_month VARCHAR(7) NOT NULL,
        sale_type VARCHAR(50) DEFAULT 'digital',
        sale_quantity INTEGER DEFAULT 0,
        gross_amount DECIMAL(15,2) DEFAULT 0,
        net_amount DECIMAL(15,2) DEFAULT 0,
        return_quantity INTEGER DEFAULT 0,
        return_amount DECIMAL(15,2) DEFAULT 0,
        currency VARCHAR(3) DEFAULT 'KRW',
        data_source VARCHAR(50) DEFAULT 'manual',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('   ✅ 테이블 생성: album_settlements');

    // 4. 정산 데이터 업로드 이력
    await client.query(`
      CREATE TABLE IF NOT EXISTS settlement_uploads (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        file_name VARCHAR(255) NOT NULL,
        file_size BIGINT,
        record_count INTEGER DEFAULT 0,
        upload_type VARCHAR(50) DEFAULT 'excel',
        status VARCHAR(20) DEFAULT 'pending',
        error_message TEXT,
        uploaded_by UUID,
        processed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('   ✅ 테이블 생성: settlement_uploads');

    // 5. 외부 API 연동 설정
    await client.query(`
      CREATE TABLE IF NOT EXISTS external_api_configs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        distributor_id UUID REFERENCES distributors(id) ON DELETE CASCADE,
        api_name VARCHAR(100) NOT NULL,
        api_url VARCHAR(500),
        api_key_encrypted VARCHAR(500),
        sync_frequency VARCHAR(50) DEFAULT 'daily',
        last_sync_at TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('   ✅ 테이블 생성: external_api_configs');

    // 인덱스 생성
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_monthly_settlements_year_month ON monthly_settlements(year_month)',
      'CREATE INDEX IF NOT EXISTS idx_monthly_settlements_track_id ON monthly_settlements(track_id)',
      'CREATE INDEX IF NOT EXISTS idx_monthly_settlements_distributor_id ON monthly_settlements(distributor_id)',
      'CREATE INDEX IF NOT EXISTS idx_album_settlements_year_month ON album_settlements(year_month)',
      'CREATE INDEX IF NOT EXISTS idx_album_settlements_distributor_id ON album_settlements(distributor_id)'
    ];

    for (const indexSql of indexes) {
      await client.query(indexSql);
    }
    console.log('   ✅ 인덱스 생성 완료');

    console.log('\n✨ CMS 마이그레이션 완료!');

    // 테이블 확인
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('distributors', 'monthly_settlements', 'album_settlements', 'settlement_uploads', 'external_api_configs')
      ORDER BY table_name
    `);

    console.log('\n📋 생성된 CMS 테이블:');
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(console.error);
