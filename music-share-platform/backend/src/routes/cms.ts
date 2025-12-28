import { Router, Response } from 'express';
import { pool } from '../db';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { AuthRequest } from '../types';
import multer from 'multer';
import * as XLSX from 'xlsx';

// 엑셀 파싱을 위한 인터페이스
interface SettlementRow {
  유통사?: string;
  정산월?: string;
  총매출?: number;
  순매출?: number;
  관리수수료?: number;
  스트리밍수?: number;
  다운로드수?: number;
  트랙명?: string;
  아티스트?: string;
  // 영문 컬럼명도 지원
  distributor?: string;
  year_month?: string;
  gross_revenue?: number;
  net_revenue?: number;
  management_fee?: number;
  stream_count?: number;
  download_count?: number;
  track_title?: string;
  artist?: string;
}

// 엑셀 파싱 유틸리티 함수
function parseExcelFile(buffer: Buffer): SettlementRow[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json<SettlementRow>(sheet);
  return data;
}

// 정규화된 정산 데이터 추출
function normalizeSettlementRow(row: SettlementRow) {
  return {
    distributorCode: row.유통사 || row.distributor || '',
    yearMonth: row.정산월 || row.year_month || '',
    grossRevenue: Number(row.총매출 || row.gross_revenue || 0),
    netRevenue: Number(row.순매출 || row.net_revenue || 0),
    managementFee: Number(row.관리수수료 || row.management_fee || 0),
    streamCount: Number(row.스트리밍수 || row.stream_count || 0),
    downloadCount: Number(row.다운로드수 || row.download_count || 0),
    trackTitle: row.트랙명 || row.track_title || null,
    artist: row.아티스트 || row.artist || null,
  };
}

const router = Router();

// 파일 업로드 설정 (엑셀 업로드용)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel and CSV files are allowed'));
    }
  }
});

// 모든 CMS 라우트는 인증 + 관리자 권한 필요
router.use(authenticateToken as any);
router.use(requireAdmin as any);

// =====================================================
// 대시보드 요약 API
// =====================================================

// GET /api/cms/dashboard/summary - 대시보드 요약 데이터
router.get('/dashboard/summary', async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    // 기본값: 최근 12개월
    const defaultEnd = new Date().toISOString().slice(0, 7);
    const defaultStart = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7);

    const start = (startDate as string) || defaultStart;
    const end = (endDate as string) || defaultEnd;

    // 전체 정산금액 합계
    const totalResult = await pool.query(`
      SELECT
        COALESCE(SUM(gross_revenue), 0) as total_gross,
        COALESCE(SUM(net_revenue), 0) as total_net,
        COALESCE(SUM(management_fee), 0) as total_management,
        COALESCE(SUM(stream_count), 0) as total_streams,
        COALESCE(SUM(download_count), 0) as total_downloads
      FROM monthly_settlements
      WHERE year_month BETWEEN $1 AND $2
    `, [start, end]);

    // 월별 추이 데이터
    const monthlyResult = await pool.query(`
      SELECT
        year_month,
        SUM(gross_revenue) as gross_revenue,
        SUM(net_revenue) as net_revenue,
        SUM(management_fee) as management_fee
      FROM monthly_settlements
      WHERE year_month BETWEEN $1 AND $2
      GROUP BY year_month
      ORDER BY year_month ASC
    `, [start, end]);

    // 유통사별 점유율
    const distributorResult = await pool.query(`
      SELECT
        d.name as distributor_name,
        d.code as distributor_code,
        SUM(ms.gross_revenue) as total_revenue,
        ROUND(SUM(ms.gross_revenue) * 100.0 / NULLIF((
          SELECT SUM(gross_revenue) FROM monthly_settlements WHERE year_month BETWEEN $1 AND $2
        ), 0), 2) as share_percent
      FROM monthly_settlements ms
      JOIN distributors d ON d.id = ms.distributor_id
      WHERE ms.year_month BETWEEN $1 AND $2
      GROUP BY d.id, d.name, d.code
      ORDER BY total_revenue DESC
    `, [start, end]);

    res.json({
      period: { start, end },
      totals: {
        grossRevenue: Number(totalResult.rows[0].total_gross),
        netRevenue: Number(totalResult.rows[0].total_net),
        managementFee: Number(totalResult.rows[0].total_management),
        totalStreams: Number(totalResult.rows[0].total_streams),
        totalDownloads: Number(totalResult.rows[0].total_downloads),
      },
      monthlyTrend: monthlyResult.rows.map(row => ({
        yearMonth: row.year_month,
        grossRevenue: Number(row.gross_revenue),
        netRevenue: Number(row.net_revenue),
        managementFee: Number(row.management_fee),
      })),
      distributorShare: distributorResult.rows.map(row => ({
        name: row.distributor_name,
        code: row.distributor_code,
        revenue: Number(row.total_revenue),
        sharePercent: Number(row.share_percent),
      })),
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
});

// =====================================================
// 서비스사별 상세 정산 현황
// =====================================================

// GET /api/cms/settlements/by-distributor - 유통사별 정산 현황
router.get('/settlements/by-distributor', async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const defaultEnd = new Date().toISOString().slice(0, 7);
    const defaultStart = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7);

    const start = (startDate as string) || defaultStart;
    const end = (endDate as string) || defaultEnd;

    const result = await pool.query(`
      SELECT
        d.name as distributor_name,
        d.code as distributor_code,
        d.commission_rate,
        SUM(ms.gross_revenue) as total_gross,
        SUM(ms.net_revenue) as total_net,
        SUM(ms.management_fee) as management_fee,
        SUM(ms.stream_count) as stream_count,
        SUM(ms.download_count) as download_count,
        ROUND(SUM(ms.gross_revenue) * 100.0 / NULLIF((
          SELECT SUM(gross_revenue) FROM monthly_settlements WHERE year_month BETWEEN $1 AND $2
        ), 0), 2) as share_percent,
        COUNT(DISTINCT ms.year_month) as month_count
      FROM distributors d
      LEFT JOIN monthly_settlements ms ON d.id = ms.distributor_id
        AND ms.year_month BETWEEN $1 AND $2
      GROUP BY d.id, d.name, d.code, d.commission_rate
      ORDER BY total_gross DESC NULLS LAST
    `, [start, end]);

    // 순위 추가
    const settlements = result.rows.map((row, index) => ({
      rank: index + 1,
      distributorName: row.distributor_name,
      distributorCode: row.distributor_code,
      commissionRate: Number(row.commission_rate),
      sharePercent: Number(row.share_percent) || 0,
      grossRevenue: Number(row.total_gross) || 0,
      netRevenue: Number(row.total_net) || 0,
      managementFee: Number(row.management_fee) || 0,
      streamCount: Number(row.stream_count) || 0,
      downloadCount: Number(row.download_count) || 0,
      monthCount: Number(row.month_count) || 0,
    }));

    // 합계 계산
    const totals = settlements.reduce((acc, row) => ({
      grossRevenue: acc.grossRevenue + row.grossRevenue,
      netRevenue: acc.netRevenue + row.netRevenue,
      managementFee: acc.managementFee + row.managementFee,
      streamCount: acc.streamCount + row.streamCount,
      downloadCount: acc.downloadCount + row.downloadCount,
    }), { grossRevenue: 0, netRevenue: 0, managementFee: 0, streamCount: 0, downloadCount: 0 });

    res.json({
      period: { start, end },
      settlements,
      totals: {
        ...totals,
        sharePercent: 100,
      },
    });
  } catch (error) {
    console.error('Distributor settlements error:', error);
    res.status(500).json({ error: 'Failed to fetch distributor settlements' });
  }
});

// =====================================================
// 월별 상세 정산
// =====================================================

// GET /api/cms/settlements/monthly - 월별 상세 정산 데이터
router.get('/settlements/monthly', async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, distributorId } = req.query;

    const defaultEnd = new Date().toISOString().slice(0, 7);
    const defaultStart = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7);

    const start = (startDate as string) || defaultStart;
    const end = (endDate as string) || defaultEnd;

    let query = `
      SELECT
        ms.year_month,
        d.name as distributor_name,
        d.code as distributor_code,
        ms.gross_revenue,
        ms.net_revenue,
        ms.management_fee,
        ms.stream_count,
        ms.download_count,
        t.title as track_title,
        t.artist as track_artist
      FROM monthly_settlements ms
      JOIN distributors d ON d.id = ms.distributor_id
      LEFT JOIN tracks t ON t.id = ms.track_id
      WHERE ms.year_month BETWEEN $1 AND $2
    `;

    const params: any[] = [start, end];

    if (distributorId) {
      query += ` AND ms.distributor_id = $3`;
      params.push(distributorId);
    }

    query += ` ORDER BY ms.year_month DESC, ms.gross_revenue DESC`;

    const result = await pool.query(query, params);

    res.json({
      period: { start, end },
      settlements: result.rows.map(row => ({
        yearMonth: row.year_month,
        distributorName: row.distributor_name,
        distributorCode: row.distributor_code,
        grossRevenue: Number(row.gross_revenue),
        netRevenue: Number(row.net_revenue),
        managementFee: Number(row.management_fee),
        streamCount: Number(row.stream_count),
        downloadCount: Number(row.download_count),
        trackTitle: row.track_title,
        trackArtist: row.track_artist,
      })),
    });
  } catch (error) {
    console.error('Monthly settlements error:', error);
    res.status(500).json({ error: 'Failed to fetch monthly settlements' });
  }
});

// =====================================================
// 앨범/음반 정산
// =====================================================

// GET /api/cms/settlements/albums - 앨범별 정산 현황
router.get('/settlements/albums', async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const defaultEnd = new Date().toISOString().slice(0, 7);
    const defaultStart = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7);

    const start = (startDate as string) || defaultStart;
    const end = (endDate as string) || defaultEnd;

    const result = await pool.query(`
      SELECT
        als.album_name,
        als.artist_name,
        d.name as distributor_name,
        als.year_month,
        als.sale_type,
        als.sale_quantity,
        als.gross_amount,
        als.net_amount,
        als.return_quantity,
        als.return_amount
      FROM album_settlements als
      JOIN distributors d ON d.id = als.distributor_id
      WHERE als.year_month BETWEEN $1 AND $2
      ORDER BY als.year_month DESC, als.gross_amount DESC
    `, [start, end]);

    res.json({
      period: { start, end },
      albums: result.rows.map(row => ({
        albumName: row.album_name,
        artistName: row.artist_name,
        distributorName: row.distributor_name,
        yearMonth: row.year_month,
        saleType: row.sale_type,
        saleQuantity: Number(row.sale_quantity),
        grossAmount: Number(row.gross_amount),
        netAmount: Number(row.net_amount),
        returnQuantity: Number(row.return_quantity),
        returnAmount: Number(row.return_amount),
      })),
    });
  } catch (error) {
    console.error('Album settlements error:', error);
    res.status(500).json({ error: 'Failed to fetch album settlements' });
  }
});

// =====================================================
// 유통사 관리
// =====================================================

// GET /api/cms/distributors - 유통사 목록
router.get('/distributors', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT id, name, code, commission_rate, is_active, created_at
      FROM distributors
      ORDER BY name ASC
    `);

    res.json({
      distributors: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        code: row.code,
        commissionRate: Number(row.commission_rate),
        isActive: row.is_active,
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    console.error('Distributors list error:', error);
    res.status(500).json({ error: 'Failed to fetch distributors' });
  }
});

// =====================================================
// 엑셀 업로드
// =====================================================

// POST /api/cms/upload/settlements - 정산 데이터 엑셀 업로드
router.post('/upload/settlements', upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // 업로드 이력 저장
    const uploadResult = await pool.query(`
      INSERT INTO settlement_uploads (file_name, file_size, upload_type, status, uploaded_by)
      VALUES ($1, $2, 'excel', 'processing', $3)
      RETURNING id
    `, [req.file.originalname, req.file.size, req.user!.id]);

    const uploadId = uploadResult.rows[0].id;

    // 엑셀 파일 파싱
    let rows: SettlementRow[];
    try {
      rows = parseExcelFile(req.file.buffer);
    } catch (parseError) {
      await pool.query(`
        UPDATE settlement_uploads
        SET status = 'failed', error_message = $2
        WHERE id = $1
      `, [uploadId, '엑셀 파일 파싱 실패: 올바른 형식인지 확인해주세요.']);
      return res.status(400).json({ error: 'Failed to parse Excel file' });
    }

    if (rows.length === 0) {
      await pool.query(`
        UPDATE settlement_uploads
        SET status = 'failed', error_message = '데이터가 없습니다.'
        WHERE id = $1
      `, [uploadId]);
      return res.status(400).json({ error: 'No data found in Excel file' });
    }

    // 유통사 코드 → ID 매핑 가져오기
    const distributorsResult = await pool.query('SELECT id, code, name FROM distributors');
    const distributorMap = new Map<string, string>();
    distributorsResult.rows.forEach((d: { id: string; code: string; name: string }) => {
      distributorMap.set(d.code.toLowerCase(), d.id);
      distributorMap.set(d.name.toLowerCase(), d.id);
    });

    // 데이터 삽입
    let insertedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const normalized = normalizeSettlementRow(row);
      const rowNum = i + 2; // 엑셀 행 번호 (헤더 포함)

      // 필수 필드 검증
      if (!normalized.distributorCode || !normalized.yearMonth) {
        errors.push(`행 ${rowNum}: 유통사 또는 정산월이 누락됨`);
        skippedCount++;
        continue;
      }

      // 유통사 ID 조회
      const distributorId = distributorMap.get(normalized.distributorCode.toLowerCase());
      if (!distributorId) {
        errors.push(`행 ${rowNum}: 알 수 없는 유통사 "${normalized.distributorCode}"`);
        skippedCount++;
        continue;
      }

      // 정산월 형식 검증 (YYYY-MM)
      if (!/^\d{4}-\d{2}$/.test(normalized.yearMonth)) {
        errors.push(`행 ${rowNum}: 잘못된 정산월 형식 "${normalized.yearMonth}" (YYYY-MM 형식 필요)`);
        skippedCount++;
        continue;
      }

      try {
        // 기존 데이터 확인 (유통사 + 정산월 조합)
        const existingResult = await pool.query(`
          SELECT id FROM monthly_settlements
          WHERE distributor_id = $1 AND year_month = $2
        `, [distributorId, normalized.yearMonth]);

        if (existingResult.rows.length > 0) {
          // 기존 데이터 업데이트
          await pool.query(`
            UPDATE monthly_settlements
            SET gross_revenue = $3, net_revenue = $4, management_fee = $5,
                stream_count = $6, download_count = $7, data_source = 'excel',
                updated_at = NOW()
            WHERE id = $1
          `, [
            existingResult.rows[0].id,
            normalized.grossRevenue,
            normalized.netRevenue,
            normalized.managementFee,
            normalized.streamCount,
            normalized.downloadCount
          ]);
        } else {
          // 새 데이터 삽입
          await pool.query(`
            INSERT INTO monthly_settlements
            (distributor_id, year_month, gross_revenue, net_revenue, management_fee,
             stream_count, download_count, data_source)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'excel')
          `, [
            distributorId,
            normalized.yearMonth,
            normalized.grossRevenue,
            normalized.netRevenue,
            normalized.managementFee,
            normalized.streamCount,
            normalized.downloadCount
          ]);
        }
        insertedCount++;
      } catch (dbError) {
        console.error(`Row ${rowNum} insert error:`, dbError);
        errors.push(`행 ${rowNum}: 데이터베이스 오류`);
        skippedCount++;
      }
    }

    // 업로드 상태 업데이트
    const status = skippedCount === rows.length ? 'failed' :
                   errors.length > 0 ? 'completed_with_errors' : 'completed';
    const errorMessage = errors.length > 0 ? errors.slice(0, 10).join('\n') : null;

    await pool.query(`
      UPDATE settlement_uploads
      SET status = $2, record_count = $3, error_message = $4, processed_at = NOW()
      WHERE id = $1
    `, [uploadId, status, insertedCount, errorMessage]);

    res.json({
      message: status === 'completed' ? '정산 데이터가 성공적으로 업로드되었습니다.' :
               status === 'completed_with_errors' ? '일부 오류와 함께 업로드가 완료되었습니다.' :
               '업로드가 실패했습니다.',
      uploadId,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      totalRows: rows.length,
      insertedCount,
      skippedCount,
      errors: errors.slice(0, 10),
    });
  } catch (error) {
    console.error('Settlement upload error:', error);
    res.status(500).json({ error: 'Failed to upload settlement data' });
  }
});

// GET /api/cms/upload/history - 업로드 이력
router.get('/upload/history', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        su.id,
        su.file_name,
        su.file_size,
        su.record_count,
        su.upload_type,
        su.status,
        su.error_message,
        su.processed_at,
        su.created_at,
        u.name as uploaded_by_name
      FROM settlement_uploads su
      LEFT JOIN users u ON u.id = su.uploaded_by
      ORDER BY su.created_at DESC
      LIMIT 50
    `);

    res.json({
      uploads: result.rows.map(row => ({
        id: row.id,
        fileName: row.file_name,
        fileSize: row.file_size,
        recordCount: row.record_count,
        uploadType: row.upload_type,
        status: row.status,
        errorMessage: row.error_message,
        processedAt: row.processed_at,
        createdAt: row.created_at,
        uploadedByName: row.uploaded_by_name,
      })),
    });
  } catch (error) {
    console.error('Upload history error:', error);
    res.status(500).json({ error: 'Failed to fetch upload history' });
  }
});

// =====================================================
// 엑셀 다운로드 (내보내기)
// =====================================================

// GET /api/cms/export/settlements - 정산 데이터 엑셀 다운로드
router.get('/export/settlements', async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;

    const defaultEnd = new Date().toISOString().slice(0, 7);
    const defaultStart = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7);

    const start = (startDate as string) || defaultStart;
    const end = (endDate as string) || defaultEnd;

    const result = await pool.query(`
      SELECT
        ms.year_month as "정산월",
        d.name as "유통사",
        d.commission_rate as "수수료율(%)",
        ms.gross_revenue as "총매출",
        ms.net_revenue as "순매출",
        ms.management_fee as "관리사정산금액",
        ms.stream_count as "스트리밍수",
        ms.download_count as "다운로드수",
        t.title as "트랙명",
        t.artist as "아티스트"
      FROM monthly_settlements ms
      JOIN distributors d ON d.id = ms.distributor_id
      LEFT JOIN tracks t ON t.id = ms.track_id
      WHERE ms.year_month BETWEEN $1 AND $2
      ORDER BY ms.year_month DESC, d.name ASC
    `, [start, end]);

    if (format === 'csv') {
      // CSV 형식으로 반환
      const headers = Object.keys(result.rows[0] || {}).join(',');
      const rows = result.rows.map(row => Object.values(row).join(','));
      const csv = [headers, ...rows].join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=settlements_${start}_${end}.csv`);
      res.send('\ufeff' + csv); // BOM for Excel
    } else {
      // JSON 형식으로 반환 (프론트엔드에서 xlsx로 변환)
      res.json({
        period: { start, end },
        data: result.rows,
        columns: [
          { key: '정산월', label: '정산월' },
          { key: '유통사', label: '유통사' },
          { key: '수수료율(%)', label: '수수료율(%)' },
          { key: '총매출', label: '총매출' },
          { key: '순매출', label: '순매출' },
          { key: '관리사정산금액', label: '관리사정산금액' },
          { key: '스트리밍수', label: '스트리밍수' },
          { key: '다운로드수', label: '다운로드수' },
          { key: '트랙명', label: '트랙명' },
          { key: '아티스트', label: '아티스트' },
        ],
      });
    }
  } catch (error) {
    console.error('Export settlements error:', error);
    res.status(500).json({ error: 'Failed to export settlements' });
  }
});

// =====================================================
// 점유율 변동 차트 데이터
// =====================================================

// GET /api/cms/charts/share-trend - 월별 점유율 변동
router.get('/charts/share-trend', async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const defaultEnd = new Date().toISOString().slice(0, 7);
    const defaultStart = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7);

    const start = (startDate as string) || defaultStart;
    const end = (endDate as string) || defaultEnd;

    // 각 월별로 유통사 점유율 계산
    const result = await pool.query(`
      WITH monthly_totals AS (
        SELECT year_month, SUM(gross_revenue) as total
        FROM monthly_settlements
        WHERE year_month BETWEEN $1 AND $2
        GROUP BY year_month
      )
      SELECT
        ms.year_month,
        d.name as distributor_name,
        d.code as distributor_code,
        ms.gross_revenue,
        ROUND(ms.gross_revenue * 100.0 / NULLIF(mt.total, 0), 2) as share_percent
      FROM monthly_settlements ms
      JOIN distributors d ON d.id = ms.distributor_id
      JOIN monthly_totals mt ON mt.year_month = ms.year_month
      WHERE ms.year_month BETWEEN $1 AND $2
      ORDER BY ms.year_month ASC, ms.gross_revenue DESC
    `, [start, end]);

    // 월별로 그룹화
    const monthlyData: Record<string, any[]> = {};
    result.rows.forEach(row => {
      if (!monthlyData[row.year_month]) {
        monthlyData[row.year_month] = [];
      }
      monthlyData[row.year_month].push({
        distributorName: row.distributor_name,
        distributorCode: row.distributor_code,
        grossRevenue: Number(row.gross_revenue),
        sharePercent: Number(row.share_percent),
      });
    });

    res.json({
      period: { start, end },
      data: Object.entries(monthlyData).map(([month, distributors]) => ({
        yearMonth: month,
        distributors,
      })),
    });
  } catch (error) {
    console.error('Share trend error:', error);
    res.status(500).json({ error: 'Failed to fetch share trend' });
  }
});

export default router;
