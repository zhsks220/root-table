import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// 실제 유통사 데이터
const distributors = [
  { name: 'Google Play Music', code: 'google_play', commission_rate: 30.00 },
  { name: 'Apple Music / iTunes', code: 'apple_music', commission_rate: 30.00 },
  { name: '유튜브뮤직/유튜브프리미엄', code: 'youtube_music', commission_rate: 45.00 },
  { name: '유튜브(뮤직비디오/UGC/Shorts)', code: 'youtube_ugc', commission_rate: 45.00 },
  { name: '㈜드림어스컴퍼니', code: 'dreamus', commission_rate: 35.00 },
  { name: '㈜카카오엔터테인먼트', code: 'kakao_ent', commission_rate: 35.00 },
  { name: '㈜엔에이치엔벅스(주)', code: 'bugs', commission_rate: 35.00 },
  { name: 'Spotify', code: 'spotify', commission_rate: 30.00 },
  { name: 'Amazon Music', code: 'amazon_music', commission_rate: 30.00 },
  { name: 'TIDAL', code: 'tidal', commission_rate: 25.00 },
  { name: '네이버 바이브', code: 'naver_vibe', commission_rate: 35.00 },
  { name: '플로(FLO)', code: 'flo', commission_rate: 35.00 },
  { name: 'BUGU Corporation', code: 'bugu', commission_rate: 35.00 },
  { name: 'TikTok/CapCut', code: 'tiktok', commission_rate: 50.00 },
  { name: 'Facebook/Instagram', code: 'meta', commission_rate: 45.00 },
];

// 샘플 월별 정산 데이터 생성 함수 (2024년 10월 ~ 2025년 9월)
function generateMonthlyData() {
  const months = [
    '2024-10', '2024-11', '2024-12',
    '2025-01', '2025-02', '2025-03', '2025-04', '2025-05',
    '2025-06', '2025-07', '2025-08', '2025-09'
  ];

  // 각 유통사별 기본 수익 비율 (Google이 가장 높음)
  const distributorWeights: Record<string, number> = {
    'google_play': 0.35,
    'apple_music': 0.18,
    'youtube_music': 0.12,
    'youtube_ugc': 0.08,
    'dreamus': 0.05,
    'kakao_ent': 0.04,
    'bugs': 0.03,
    'spotify': 0.06,
    'amazon_music': 0.02,
    'tidal': 0.01,
    'naver_vibe': 0.02,
    'flo': 0.02,
    'bugu': 0.01,
    'tiktok': 0.005,
    'meta': 0.005,
  };

  const data: any[] = [];

  // 월별 총 매출 (점진적 증가 트렌드)
  const baseMonthlyRevenue = 4500000; // 450만원 기준

  months.forEach((month, monthIdx) => {
    // 월별 성장률 적용 (점진적 증가)
    const growthFactor = 1 + (monthIdx * 0.05) + (Math.random() * 0.1 - 0.05);
    const totalMonthlyRevenue = baseMonthlyRevenue * growthFactor;

    distributors.forEach((dist) => {
      const weight = distributorWeights[dist.code] || 0.01;
      const variation = 0.8 + Math.random() * 0.4; // 80% ~ 120% 변동

      const grossRevenue = Math.round(totalMonthlyRevenue * weight * variation);
      const commissionAmount = Math.round(grossRevenue * (dist.commission_rate / 100));
      const netRevenue = grossRevenue - commissionAmount;
      const managementFee = Math.round(netRevenue * 0.1); // 10% 관리사 수수료

      const streamCount = Math.round((grossRevenue / 3.5) * (0.9 + Math.random() * 0.2)); // 대략 스트리밍당 3.5원
      const downloadCount = Math.round(streamCount * 0.02); // 스트리밍의 2%가 다운로드

      data.push({
        distributor_code: dist.code,
        year_month: month,
        gross_revenue: grossRevenue,
        net_revenue: netRevenue,
        management_fee: managementFee,
        stream_count: streamCount,
        download_count: downloadCount,
      });
    });
  });

  return data;
}

// 앨범 정산 샘플 데이터
function generateAlbumData() {
  const albums = [
    { name: 'First Light EP', artist: 'ROUTELABEL' },
    { name: 'Midnight Sessions', artist: 'Urban Echo' },
    { name: 'Digital Dreams', artist: 'Synth Wave' },
  ];

  const months = ['2025-07', '2025-08', '2025-09'];
  const salesDistributors = ['dreamus', 'kakao_ent', 'bugs'];

  const data: any[] = [];

  albums.forEach((album) => {
    months.forEach((month) => {
      salesDistributors.forEach((distCode) => {
        const saleQuantity = Math.floor(Math.random() * 500) + 100;
        const pricePerUnit = 15000 + Math.floor(Math.random() * 5000);
        const grossAmount = saleQuantity * pricePerUnit;
        const returnQuantity = Math.floor(saleQuantity * 0.02);
        const returnAmount = returnQuantity * pricePerUnit;
        const netAmount = grossAmount - returnAmount - (grossAmount * 0.35);

        data.push({
          album_name: album.name,
          artist_name: album.artist,
          distributor_code: distCode,
          year_month: month,
          sale_type: 'physical',
          sale_quantity: saleQuantity,
          gross_amount: Math.round(grossAmount),
          net_amount: Math.round(netAmount),
          return_quantity: returnQuantity,
          return_amount: Math.round(returnAmount),
        });
      });
    });
  });

  return data;
}

async function seedCMSData() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('🚀 CMS 데이터 시딩 시작...');

    // 1. 기존 CMS 데이터 삭제
    console.log('🗑️  기존 CMS 데이터 정리...');
    await client.query('DELETE FROM album_settlements');
    await client.query('DELETE FROM monthly_settlements');
    await client.query('DELETE FROM distributors');

    // 2. 유통사 삽입
    console.log('📦 유통사 데이터 삽입...');
    const distributorIds: Record<string, string> = {};

    for (const dist of distributors) {
      const result = await client.query(
        `INSERT INTO distributors (name, code, commission_rate, is_active)
         VALUES ($1, $2, $3, TRUE)
         RETURNING id`,
        [dist.name, dist.code, dist.commission_rate]
      );
      distributorIds[dist.code] = result.rows[0].id;
    }
    console.log(`   ✅ ${distributors.length}개 유통사 등록 완료`);

    // 3. 기존 트랙 조회
    const tracksResult = await client.query('SELECT id FROM tracks LIMIT 1');
    const trackId = tracksResult.rows[0]?.id || null;

    // 4. 월별 정산 데이터 삽입
    console.log('📊 월별 정산 데이터 삽입...');
    const monthlyData = generateMonthlyData();

    for (const data of monthlyData) {
      await client.query(
        `INSERT INTO monthly_settlements
         (track_id, distributor_id, year_month, gross_revenue, net_revenue,
          management_fee, stream_count, download_count, data_source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'seed')`,
        [
          trackId,
          distributorIds[data.distributor_code],
          data.year_month,
          data.gross_revenue,
          data.net_revenue,
          data.management_fee,
          data.stream_count,
          data.download_count
        ]
      );
    }
    console.log(`   ✅ ${monthlyData.length}개 월별 정산 데이터 등록 완료`);

    // 5. 앨범 정산 데이터 삽입
    console.log('💿 앨범 정산 데이터 삽입...');
    const albumData = generateAlbumData();

    for (const data of albumData) {
      await client.query(
        `INSERT INTO album_settlements
         (album_name, artist_name, distributor_id, year_month, sale_type,
          sale_quantity, gross_amount, net_amount, return_quantity, return_amount, data_source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'seed')`,
        [
          data.album_name,
          data.artist_name,
          distributorIds[data.distributor_code],
          data.year_month,
          data.sale_type,
          data.sale_quantity,
          data.gross_amount,
          data.net_amount,
          data.return_quantity,
          data.return_amount
        ]
      );
    }
    console.log(`   ✅ ${albumData.length}개 앨범 정산 데이터 등록 완료`);

    await client.query('COMMIT');
    console.log('\n✨ CMS 데이터 시딩 완료!');

    // 통계 출력
    const stats = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM distributors) as distributor_count,
        (SELECT COUNT(*) FROM monthly_settlements) as monthly_count,
        (SELECT SUM(gross_revenue) FROM monthly_settlements) as total_revenue,
        (SELECT COUNT(*) FROM album_settlements) as album_count
    `);

    console.log('\n📈 시딩된 데이터 통계:');
    console.log(`   - 유통사: ${stats.rows[0].distributor_count}개`);
    console.log(`   - 월별 정산: ${stats.rows[0].monthly_count}건`);
    console.log(`   - 총 매출: ${Number(stats.rows[0].total_revenue).toLocaleString()}원`);
    console.log(`   - 앨범 정산: ${stats.rows[0].album_count}건`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 시딩 실패:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedCMSData().catch(console.error);
