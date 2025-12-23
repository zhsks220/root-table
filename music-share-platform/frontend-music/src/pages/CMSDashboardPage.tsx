import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Upload, FileSpreadsheet, Settings, Music, Users, Download, TrendingUp, DollarSign, Loader2 } from 'lucide-react';
import { MobileLayout, MenuItem, QuickLink } from '../components/layout/MobileLayout';
import { RevenueLineChart } from '../components/cms/RevenueLineChart';
import { MarketShareBarChart } from '../components/cms/MarketShareBarChart';
import { DistributorSettlementTable } from '../components/cms/DistributorSettlementTable';
import { DateRangeFilter } from '../components/cms/DateRangeFilter';
import { ExcelUpload } from '../components/cms/ExcelUpload';
import { cmsAPI, DashboardSummary, DistributorSettlement } from '../services/cmsApi';
import { AnimatePresence, motion } from 'framer-motion';
import * as XLSX from 'xlsx';

type Tab = 'dashboard' | 'upload' | 'history' | 'settings';

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: '음원/음반 종합', icon: BarChart3 },
  { id: 'upload', label: '정산 데이터 업로드', icon: Upload },
  { id: 'history', label: '업로드 이력', icon: FileSpreadsheet },
  { id: 'settings', label: '유통사 설정', icon: Settings },
];

const quickLinks: QuickLink[] = [
  { label: '파트너 관리', path: '/partner-admin', icon: Users },
  { label: '관리자 페이지', path: '/', icon: Music },
];

// 금액 포맷
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ko-KR').format(Math.round(value)) + '원';
};

// 숫자 포맷
const formatNumber = (value: number) => {
  return new Intl.NumberFormat('ko-KR').format(value);
};

// 날짜 범위 포맷
const formatDateRange = (start: string, end: string) => {
  return `${start.replace('-', '년')}월 ~ ${end.replace('-', '년')}월 정산기준`;
};

export default function CMSDashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 탭 변경 핸들러 (settings는 통합 설정 페이지로 이동)
  const handleTabChange = (tab: string) => {
    if (tab === 'settings') {
      navigate('/admin/settings?tab=distributors');
    } else {
      setActiveTab(tab as Tab);
    }
  };

  // 날짜 범위 상태
  const now = new Date();
  const defaultEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const defaultStart = `${now.getFullYear() - 1}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);

  // 데이터 상태
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [distributorSettlements, setDistributorSettlements] = useState<{
    settlements: DistributorSettlement[];
    totals: any;
  } | null>(null);

  // 데이터 로드
  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [summaryRes, distributorRes] = await Promise.all([
        cmsAPI.getDashboardSummary(startDate, endDate),
        cmsAPI.getDistributorSettlements(startDate, endDate),
      ]);

      setDashboardData(summaryRes.data);
      setDistributorSettlements({
        settlements: distributorRes.data.settlements,
        totals: distributorRes.data.totals,
      });
    } catch (err: any) {
      console.error('Failed to load CMS data:', err);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  // 엑셀 다운로드
  const handleExcelDownload = async () => {
    try {
      const response = await cmsAPI.exportSettlements(startDate, endDate, 'json');
      const data = response.data;

      const worksheet = XLSX.utils.json_to_sheet(data.data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '정산데이터');

      XLSX.writeFile(workbook, `정산데이터_${startDate}_${endDate}.xlsx`);
    } catch (err) {
      console.error('Excel download failed:', err);
      alert('엑셀 다운로드에 실패했습니다.');
    }
  };

  // 점유율 변동 데이터 변환
  const shareData = dashboardData?.monthlyTrend.map((month) => {
    const monthlyTotal = dashboardData.monthlyTrend.reduce((sum, m) => sum + m.grossRevenue, 0);
    const sharePercent = monthlyTotal > 0 ? (month.grossRevenue / monthlyTotal) * 100 * dashboardData.monthlyTrend.length : 0;
    return {
      yearMonth: month.yearMonth,
      sharePercent: Math.min(sharePercent, 100),
    };
  }) || [];

  const dateRange = formatDateRange(startDate, endDate);

  return (
    <MobileLayout
      title="Distribution CMS"
      subtitle="CMS 콘솔"
      menuItems={menuItems}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      quickLinks={quickLinks}
      logoIcon={Music}
      logoText="ROUTELABEL"
      logoSubtext="Distribution CMS"
      theme="dark"
    >
      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-4 sm:p-6 lg:p-8"
          >
            {/* 헤더 */}
            <div className="mb-4 sm:mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">음원/음반 종합</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">유통사별 정산 현황을 확인하세요</p>
            </div>

            {/* 날짜 필터 */}
            <div className="mb-4 sm:mb-6">
              <DateRangeFilter
                startDate={startDate}
                endDate={endDate}
                onDateChange={handleDateChange}
                onSearch={loadData}
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64 sm:h-96">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              </div>
            ) : error ? (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">{error}</div>
            ) : dashboardData ? (
              <>
                {/* 요약 카드 - 모바일: 2열, 데스크톱: 4열 */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                      </div>
                      <span className="text-xs sm:text-sm text-gray-500">총 정산금액</span>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                      {formatCurrency(dashboardData.totals.grossRevenue)}
                    </p>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                      </div>
                      <span className="text-xs sm:text-sm text-gray-500">관리사 정산</span>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                      {formatCurrency(dashboardData.totals.managementFee)}
                    </p>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Music className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                      </div>
                      <span className="text-xs sm:text-sm text-gray-500">총 스트리밍</span>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                      {formatNumber(dashboardData.totals.totalStreams)}회
                    </p>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                        <Download className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                      </div>
                      <span className="text-xs sm:text-sm text-gray-500">총 다운로드</span>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                      {formatNumber(dashboardData.totals.totalDownloads)}회
                    </p>
                  </div>
                </div>

                {/* 차트 영역 - 모바일: 세로 배치, 데스크톱: 가로 배치 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                  <RevenueLineChart
                    data={dashboardData.monthlyTrend}
                    title="월별 정산금액 변동"
                    dateRange={dateRange}
                  />
                  <MarketShareBarChart
                    data={shareData}
                    title="월별 점유율 변동"
                    dateRange={dateRange}
                  />
                </div>

                {/* 유통사별 테이블 */}
                {distributorSettlements && (
                  <DistributorSettlementTable
                    settlements={distributorSettlements.settlements}
                    totals={distributorSettlements.totals}
                    dateRange={dateRange}
                    onExcelDownload={handleExcelDownload}
                  />
                )}
              </>
            ) : null}
          </motion.div>
        )}

        {activeTab === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-4 sm:p-6 lg:p-8"
          >
            <div className="mb-4 sm:mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">정산 데이터 업로드</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">엑셀 파일로 정산 데이터를 일괄 등록하세요</p>
            </div>

            <ExcelUpload onUploadComplete={loadData} />
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-4 sm:p-6 lg:p-8"
          >
            <div className="mb-4 sm:mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">업로드 이력</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">정산 데이터 업로드 기록을 확인하세요</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
              <p className="text-gray-500 text-sm">업로드 이력이 없습니다.</p>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </MobileLayout>
  );
}
