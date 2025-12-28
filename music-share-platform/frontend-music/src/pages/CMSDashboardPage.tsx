import { useState, useEffect } from 'react';
import { BarChart3, Upload, FileSpreadsheet, Settings, Music, Users, Download, TrendingUp, DollarSign, Loader2, MessageSquare, Clock, CheckCircle, XCircle, ExternalLink, Search, Eye, ChevronDown, X } from 'lucide-react';
import { MobileLayout, MenuItem, QuickLink } from '../components/layout/MobileLayout';
import { RevenueLineChart } from '../components/cms/RevenueLineChart';
import { MarketShareBarChart } from '../components/cms/MarketShareBarChart';
import { DistributorSettlementTable } from '../components/cms/DistributorSettlementTable';
import { DateRangeFilter } from '../components/cms/DateRangeFilter';
import { ExcelUpload } from '../components/cms/ExcelUpload';
import { cmsAPI, DashboardSummary, DistributorSettlement, ContactInquiry, ContactStatsResponse } from '../services/cmsApi';
import { useThemeStore } from '../store/themeStore';
import { AnimatePresence, motion } from 'framer-motion';
import * as XLSX from 'xlsx';

type Tab = 'dashboard' | 'upload' | 'history' | 'inquiries';

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: '음원/음반 종합', icon: BarChart3 },
  { id: 'upload', label: '정산 데이터 업로드', icon: Upload },
  { id: 'history', label: '업로드 이력', icon: FileSpreadsheet },
  { id: 'inquiries', label: '상담 문의', icon: MessageSquare },
];

const quickLinks: QuickLink[] = [
  { label: '음원 라이브러리', path: '/admin', icon: Music },
  { label: 'CMS 대시보드', path: '/cms', icon: BarChart3 },
  { label: '파트너 페이지', path: '/partner-admin', icon: Users },
  { label: '설정', path: '/admin/settings', icon: Settings },
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

// 상담 문의 상태 표시
const getStatusBadge = (status: string, isDark: boolean) => {
  const statusConfig: Record<string, { label: string; bg: string; text: string; icon: any }> = {
    pending: { label: '대기중', bg: isDark ? 'bg-amber-900/50' : 'bg-amber-100', text: isDark ? 'text-amber-400' : 'text-amber-700', icon: Clock },
    in_progress: { label: '진행중', bg: isDark ? 'bg-blue-900/50' : 'bg-blue-100', text: isDark ? 'text-blue-400' : 'text-blue-700', icon: Loader2 },
    completed: { label: '완료', bg: isDark ? 'bg-emerald-900/50' : 'bg-emerald-100', text: isDark ? 'text-emerald-400' : 'text-emerald-700', icon: CheckCircle },
    cancelled: { label: '취소', bg: isDark ? 'bg-red-900/50' : 'bg-red-100', text: isDark ? 'text-red-400' : 'text-red-700', icon: XCircle },
  };
  return statusConfig[status] || statusConfig.pending;
};

// 날짜 포맷
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function CMSDashboardPage() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 탭 변경 핸들러
  const handleTabChange = (tab: string) => {
    setActiveTab(tab as Tab);
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

  // 상담 문의 상태
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [inquiryStats, setInquiryStats] = useState<ContactStatsResponse | null>(null);
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [inquiryFilter, setInquiryFilter] = useState<string>('all');
  const [inquirySearch, setInquirySearch] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiry | null>(null);
  const [inquiryPage, setInquiryPage] = useState(1);
  const [inquiryTotalPages, setInquiryTotalPages] = useState(1);
  const [showStatusFilter, setShowStatusFilter] = useState(false);

  const statusOptions = [
    { value: 'all', label: '전체 상태' },
    { value: 'pending', label: '대기중' },
    { value: 'in_progress', label: '진행중' },
    { value: 'completed', label: '완료' },
    { value: 'cancelled', label: '취소' },
  ];

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

  // 상담 문의 데이터 로드
  const loadInquiries = async () => {
    setInquiryLoading(true);
    try {
      const [inquiriesRes, statsRes] = await Promise.all([
        cmsAPI.getContactInquiries({
          status: inquiryFilter === 'all' ? undefined : inquiryFilter,
          search: inquirySearch || undefined,
          page: inquiryPage,
          limit: 10,
        }),
        cmsAPI.getContactStats(),
      ]);

      setInquiries(inquiriesRes.data.inquiries);
      setInquiryTotalPages(inquiriesRes.data.pagination.totalPages);
      setInquiryStats(statsRes.data);
    } catch (err) {
      console.error('Failed to load inquiries:', err);
    } finally {
      setInquiryLoading(false);
    }
  };

  // 문의 상태 업데이트
  const updateInquiryStatus = async (id: string, status: string, adminNotes?: string) => {
    try {
      await cmsAPI.updateContactInquiry(id, { status, adminNotes });
      loadInquiries();
      setSelectedInquiry(null);
    } catch (err) {
      console.error('Failed to update inquiry:', err);
      alert('상태 업데이트에 실패했습니다.');
    }
  };

  // 문의 삭제
  const deleteInquiry = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await cmsAPI.deleteContactInquiry(id);
      loadInquiries();
    } catch (err) {
      console.error('Failed to delete inquiry:', err);
      alert('삭제에 실패했습니다.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 상담 문의 탭 데이터 로드
  useEffect(() => {
    if (activeTab === 'inquiries') {
      loadInquiries();
    }
  }, [activeTab, inquiryFilter, inquirySearch, inquiryPage]);

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
      logoImage="/images/wordmark_B.png"
      logoImageDark="/images/wordmark_W.png"
      logoTypeImage="/images/typelogo_B.png"
      logoTypeImageDark="/images/typelogo_W.png"
      logoSubtext="Distribution CMS"
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
              <h1 className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>음원/음반 종합</h1>
              <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>유통사별 정산 현황을 확인하세요</p>
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
              <div className={`p-4 rounded-lg text-sm ${isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'}`}>{error}</div>
            ) : dashboardData ? (
              <>
                {/* 요약 카드 - 모바일: 2열, 데스크톱: 4열 */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className={`rounded-xl p-4 sm:p-5 ${isDark ? 'bg-[#0a0a0a] border border-white/10' : 'bg-white border border-gray-100'}`}>
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-emerald-900/50' : 'bg-emerald-100'}`}>
                        <DollarSign className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                      </div>
                      <span className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>총 정산금액</span>
                    </div>
                    <p className={`text-lg sm:text-2xl font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(dashboardData.totals.grossRevenue)}
                    </p>
                  </div>

                  <div className={`rounded-xl p-4 sm:p-5 ${isDark ? 'bg-[#0a0a0a] border border-white/10' : 'bg-white border border-gray-100'}`}>
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-green-900/50' : 'bg-green-100'}`}>
                        <TrendingUp className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                      </div>
                      <span className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>관리사 정산</span>
                    </div>
                    <p className={`text-lg sm:text-2xl font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(dashboardData.totals.managementFee)}
                    </p>
                  </div>

                  <div className={`rounded-xl p-4 sm:p-5 ${isDark ? 'bg-[#0a0a0a] border border-white/10' : 'bg-white border border-gray-100'}`}>
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-purple-900/50' : 'bg-purple-100'}`}>
                        <Music className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                      </div>
                      <span className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>총 스트리밍</span>
                    </div>
                    <p className={`text-lg sm:text-2xl font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {formatNumber(dashboardData.totals.totalStreams)}회
                    </p>
                  </div>

                  <div className={`rounded-xl p-4 sm:p-5 ${isDark ? 'bg-[#0a0a0a] border border-white/10' : 'bg-white border border-gray-100'}`}>
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-amber-900/50' : 'bg-amber-100'}`}>
                        <Download className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                      </div>
                      <span className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>총 다운로드</span>
                    </div>
                    <p className={`text-lg sm:text-2xl font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
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
              <h1 className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>정산 데이터 업로드</h1>
              <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>엑셀 파일로 정산 데이터를 일괄 등록하세요</p>
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
              <h1 className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>업로드 이력</h1>
              <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>정산 데이터 업로드 기록을 확인하세요</p>
            </div>

            <div className={`rounded-xl p-4 sm:p-6 ${isDark ? 'bg-[#0a0a0a] border border-white/10' : 'bg-white border border-gray-100'}`}>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>업로드 이력이 없습니다.</p>
            </div>
          </motion.div>
        )}

        {activeTab === 'inquiries' && (
          <motion.div
            key="inquiries"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-4 sm:p-6 lg:p-8"
          >
            {/* 헤더 */}
            <div className="mb-4 sm:mb-6">
              <h1 className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>상담 문의 관리</h1>
              <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>랜딩페이지에서 접수된 상담 문의를 관리합니다</p>
            </div>

            {/* 통계 카드 */}
            {inquiryStats && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className={`rounded-xl p-4 sm:p-5 ${isDark ? 'bg-[#0a0a0a] border border-white/10' : 'bg-white border border-gray-100'}`}>
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-amber-900/50' : 'bg-amber-100'}`}>
                      <Clock className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                    </div>
                    <span className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>대기중</span>
                  </div>
                  <p className={`text-lg sm:text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {inquiryStats.byStatus.pending}건
                  </p>
                </div>

                <div className={`rounded-xl p-4 sm:p-5 ${isDark ? 'bg-[#0a0a0a] border border-white/10' : 'bg-white border border-gray-100'}`}>
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                      <Loader2 className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                    </div>
                    <span className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>진행중</span>
                  </div>
                  <p className={`text-lg sm:text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {inquiryStats.byStatus.in_progress}건
                  </p>
                </div>

                <div className={`rounded-xl p-4 sm:p-5 ${isDark ? 'bg-[#0a0a0a] border border-white/10' : 'bg-white border border-gray-100'}`}>
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-emerald-900/50' : 'bg-emerald-100'}`}>
                      <CheckCircle className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    </div>
                    <span className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>완료</span>
                  </div>
                  <p className={`text-lg sm:text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {inquiryStats.byStatus.completed}건
                  </p>
                </div>

                <div className={`rounded-xl p-4 sm:p-5 ${isDark ? 'bg-[#0a0a0a] border border-white/10' : 'bg-white border border-gray-100'}`}>
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-purple-900/50' : 'bg-purple-100'}`}>
                      <MessageSquare className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                    </div>
                    <span className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>전체</span>
                  </div>
                  <p className={`text-lg sm:text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {inquiryStats.total}건
                  </p>
                </div>
              </div>
            )}

            {/* 필터 및 검색 */}
            <div className={`rounded-xl p-4 sm:p-6 mb-4 ${isDark ? 'bg-[#0a0a0a] border border-white/10' : 'bg-white border border-gray-100'}`}>
              <div className="flex flex-col sm:flex-row gap-3">
                {/* 상태 필터 */}
                <div className="relative">
                  <button
                    onClick={() => setShowStatusFilter(!showStatusFilter)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all inline-flex items-center gap-2 border ${
                      inquiryFilter !== 'all'
                        ? isDark ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : isDark ? "bg-white/5 border-white/10 text-white/70 hover:border-white/20" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <span>{statusOptions.find(s => s.value === inquiryFilter)?.label || '전체 상태'}</span>
                    {inquiryFilter !== 'all' ? (
                      <X
                        className="w-3 h-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInquiryFilter('all');
                          setInquiryPage(1);
                        }}
                      />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>

                  {showStatusFilter && (
                    <div className={`absolute top-full left-0 mt-1 rounded-lg shadow-lg py-1 z-20 min-w-[120px] ${
                      isDark ? "bg-black border border-white/10" : "bg-white border border-gray-200"
                    }`}>
                      {statusOptions.map(option => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setInquiryFilter(option.value);
                            setInquiryPage(1);
                            setShowStatusFilter(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                            inquiryFilter === option.value
                              ? isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-50 text-emerald-600"
                              : isDark ? "text-white/70 hover:bg-white/5" : "hover:bg-gray-50"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 검색 */}
                <div className="relative flex-1">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    placeholder="이름, 이메일, 소속으로 검색..."
                    value={inquirySearch}
                    onChange={(e) => { setInquirySearch(e.target.value); setInquiryPage(1); }}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`}
                  />
                </div>
              </div>
            </div>

            {/* 문의 목록 */}
            <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-[#0a0a0a] border border-white/10' : 'bg-white border border-gray-100'}`}>
              {inquiryLoading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                </div>
              ) : inquiries.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>접수된 문의가 없습니다.</p>
                </div>
              ) : (
                <>
                  {/* 모바일 카드 뷰 */}
                  <div className="sm:hidden divide-y divide-white/5">
                    {inquiries.map((inquiry) => {
                      const status = getStatusBadge(inquiry.status, isDark);
                      const StatusIcon = status.icon;
                      return (
                        <div key={inquiry.id} className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{inquiry.name}</p>
                              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{inquiry.organization || '-'}</p>
                            </div>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${status.bg} ${status.text}`}>
                              <StatusIcon className="w-3 h-3" />
                              {status.label}
                            </span>
                          </div>
                          <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{inquiry.email}</p>
                          <a href={inquiry.workLink} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-500 hover:underline flex items-center gap-1 mb-2">
                            <ExternalLink className="w-3 h-3" />
                            작품 링크
                          </a>
                          <div className="flex items-center justify-between">
                            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{formatDate(inquiry.createdAt)}</span>
                            <button
                              onClick={() => setSelectedInquiry(inquiry)}
                              className="text-xs text-emerald-500 hover:underline flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              상세보기
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 데스크톱 테이블 뷰 */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full">
                      <thead className={isDark ? 'bg-white/5' : 'bg-gray-50'}>
                        <tr>
                          <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>신청자</th>
                          <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>이메일</th>
                          <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>작품링크</th>
                          <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>상태</th>
                          <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>접수일</th>
                          <th className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>액션</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-gray-100'}`}>
                        {inquiries.map((inquiry) => {
                          const status = getStatusBadge(inquiry.status, isDark);
                          const StatusIcon = status.icon;
                          return (
                            <tr key={inquiry.id} className={isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}>
                              <td className="px-4 py-4">
                                <div>
                                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{inquiry.name}</p>
                                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{inquiry.organization || '-'}</p>
                                </div>
                              </td>
                              <td className={`px-4 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{inquiry.email}</td>
                              <td className="px-4 py-4">
                                <a href={inquiry.workLink} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-500 hover:underline flex items-center gap-1">
                                  <ExternalLink className="w-3 h-3" />
                                  링크 열기
                                </a>
                              </td>
                              <td className="px-4 py-4">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${status.bg} ${status.text}`}>
                                  <StatusIcon className="w-3 h-3" />
                                  {status.label}
                                </span>
                              </td>
                              <td className={`px-4 py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{formatDate(inquiry.createdAt)}</td>
                              <td className="px-4 py-4 text-right">
                                <button
                                  onClick={() => setSelectedInquiry(inquiry)}
                                  className={`text-sm ${isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'}`}
                                >
                                  상세보기
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* 페이지네이션 */}
                  {inquiryTotalPages > 1 && (
                    <div className={`p-4 flex justify-center gap-2 ${isDark ? 'border-t border-white/5' : 'border-t border-gray-100'}`}>
                      <button
                        onClick={() => setInquiryPage(Math.max(1, inquiryPage - 1))}
                        disabled={inquiryPage === 1}
                        className={`px-3 py-1 rounded text-sm ${inquiryPage === 1 ? 'opacity-50 cursor-not-allowed' : ''} ${isDark ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        이전
                      </button>
                      <span className={`px-3 py-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {inquiryPage} / {inquiryTotalPages}
                      </span>
                      <button
                        onClick={() => setInquiryPage(Math.min(inquiryTotalPages, inquiryPage + 1))}
                        disabled={inquiryPage === inquiryTotalPages}
                        className={`px-3 py-1 rounded text-sm ${inquiryPage === inquiryTotalPages ? 'opacity-50 cursor-not-allowed' : ''} ${isDark ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        다음
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 상세 모달 */}
            {selectedInquiry && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`w-full max-w-lg rounded-2xl p-6 ${isDark ? 'bg-[#0a0a0a] border border-white/10' : 'bg-white'}`}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>문의 상세</h2>
                      <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{formatDate(selectedInquiry.createdAt)}</p>
                    </div>
                    <button
                      onClick={() => setSelectedInquiry(null)}
                      className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>이름</label>
                      <p className={`mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedInquiry.name}</p>
                    </div>
                    <div>
                      <label className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>소속</label>
                      <p className={`mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedInquiry.organization || '-'}</p>
                    </div>
                    <div>
                      <label className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>이메일</label>
                      <p className={`mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedInquiry.email}</p>
                    </div>
                    <div>
                      <label className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>작품 링크</label>
                      <a href={selectedInquiry.workLink} target="_blank" rel="noopener noreferrer" className="mt-1 text-emerald-500 hover:underline flex items-center gap-1">
                        <ExternalLink className="w-4 h-4" />
                        {selectedInquiry.workLink}
                      </a>
                    </div>
                    <div>
                      <label className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>문의 내용</label>
                      <p className={`mt-1 whitespace-pre-wrap ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedInquiry.message || '-'}</p>
                    </div>

                    {/* 상태 변경 */}
                    <div className={`pt-4 border-t ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                      <label className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>상태 변경</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {['pending', 'in_progress', 'completed', 'cancelled'].map((status) => {
                          const badge = getStatusBadge(status, isDark);
                          const isActive = selectedInquiry.status === status;
                          return (
                            <button
                              key={status}
                              onClick={() => updateInquiryStatus(selectedInquiry.id, status)}
                              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${isActive ? `${badge.bg} ${badge.text} ring-2 ring-offset-2 ${isDark ? 'ring-offset-[#0a0a0a]' : 'ring-offset-white'} ring-emerald-500` : `${isDark ? 'bg-white/5 text-gray-400 hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}`}
                            >
                              {badge.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 삭제 버튼 */}
                    <div className="flex justify-end pt-4">
                      <button
                        onClick={() => {
                          deleteInquiry(selectedInquiry.id);
                          setSelectedInquiry(null);
                        }}
                        className="px-4 py-2 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </MobileLayout>
  );
}
