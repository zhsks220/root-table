import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { partnerAPI, PartnerDashboard, PartnerSettlement } from '../services/partnerApi';
import {
  Loader2,
  Music2,
  DollarSign,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  CreditCard,
  LogOut,
  User,
  ChevronRight,
  Settings,
  Menu,
  X,
} from 'lucide-react';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ko-KR').format(Math.round(value)) + '원';
};

export default function PartnerDashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<PartnerDashboard | null>(null);
  const [settlements, setSettlements] = useState<PartnerSettlement[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'settlements' | 'tracks'>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [dashboardRes, settlementsRes] = await Promise.all([
        partnerAPI.getDashboard(),
        partnerAPI.getSettlements(),
      ]);
      setDashboard(dashboardRes.data);
      setSettlements(settlementsRes.data.settlements || []);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/partner/login');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3" />
            대기중
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <CheckCircle className="w-3 h-3" />
            확정됨
          </span>
        );
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CreditCard className="w-3 h-3" />
            지급완료
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                <Music2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 text-sm sm:text-base">파트너 대시보드</h1>
                <p className="text-xs text-gray-500 hidden sm:block">
                  {dashboard?.partner.businessName || user?.name || '파트너'}
                </p>
              </div>
            </div>

            {/* 모바일 메뉴 버튼 */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* 데스크탑 메뉴 */}
            <div className="hidden sm:flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => navigate('/partner/settings')}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden md:inline">설정</span>
              </button>
              <button
                onClick={() => navigate('/partner/profile')}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
              >
                <User className="w-4 h-4" />
                <span className="hidden md:inline">내 정보</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">로그아웃</span>
              </button>
            </div>
          </div>
        </div>

        {/* 모바일 드롭다운 메뉴 */}
        {mobileMenuOpen && (
          <div className="sm:hidden bg-white border-t border-gray-100 shadow-lg">
            <div className="px-4 py-2 space-y-1">
              <div className="px-3 py-2 text-xs text-gray-500 font-medium">
                {dashboard?.partner.businessName || user?.name || '파트너'}
              </div>
              <button
                onClick={() => { navigate('/partner/settings'); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                <Settings className="w-5 h-5" />
                설정
              </button>
              <button
                onClick={() => { navigate('/partner/profile'); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                <User className="w-5 h-5" />
                내 정보
              </button>
              <button
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-3 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <LogOut className="w-5 h-5" />
                로그아웃
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 탭 네비게이션 */}
      <div className="bg-white border-b border-gray-100 sticky top-14 sm:top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-4 sm:gap-8 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 sm:py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              개요
            </button>
            <button
              onClick={() => setActiveTab('settlements')}
              className={`py-3 sm:py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'settlements'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              정산 내역
            </button>
            <button
              onClick={() => setActiveTab('tracks')}
              className={`py-3 sm:py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'tracks'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              내 트랙
            </button>
          </div>
        </div>
      </div>

      {/* 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {activeTab === 'overview' && dashboard && (
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {/* 통계 카드 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                    <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">총 정산금</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                      {formatCurrency(dashboard.stats.totalEarnings)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">지난달 정산</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                      {formatCurrency(dashboard.stats.lastMonthEarnings)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                    <Music2 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">연결된 트랙</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                      {dashboard.stats.trackCount}곡
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">대기중 정산</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                      {dashboard.stats.pendingSettlements}건
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 최근 정산 */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-bold text-gray-900 text-sm sm:text-base">최근 정산</h2>
                <button
                  onClick={() => setActiveTab('settlements')}
                  className="text-xs sm:text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  전체보기
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="p-3 sm:p-4 lg:p-6">
                {dashboard.recentSettlements.length === 0 ? (
                  <div className="text-center py-6 sm:py-8 text-gray-500 text-sm">
                    아직 정산 내역이 없습니다
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {dashboard.recentSettlements.slice(0, 5).map((settlement) => (
                      <div
                        key={settlement.id}
                        className="flex items-start sm:items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl gap-3"
                      >
                        <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 text-sm sm:text-base">{settlement.yearMonth}</p>
                            <p className="text-xs sm:text-sm text-gray-500 truncate">
                              매출: {formatCurrency(settlement.grossRevenue)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-emerald-600 text-sm sm:text-base">
                            {formatCurrency(settlement.partnerShare)}
                          </p>
                          <div className="mt-1">
                            {getStatusBadge(settlement.status)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 내 트랙 */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-bold text-gray-900 text-sm sm:text-base">내 트랙</h2>
                <button
                  onClick={() => setActiveTab('tracks')}
                  className="text-xs sm:text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  전체보기
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="p-3 sm:p-4 lg:p-6">
                {dashboard.assignedTracks.length === 0 ? (
                  <div className="text-center py-6 sm:py-8 text-gray-500 text-sm">
                    연결된 트랙이 없습니다
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {dashboard.assignedTracks.slice(0, 5).map((track) => (
                      <div
                        key={track.id}
                        className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl gap-3"
                      >
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Music2 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{track.title}</p>
                            <p className="text-xs sm:text-sm text-gray-500 truncate">{track.artist}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-emerald-600 text-sm sm:text-base">{track.shareRate}%</p>
                          <p className="text-xs text-gray-500">{track.role || '권리자'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settlements' && (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-sm sm:text-base">정산 내역</h2>
            </div>

            {settlements.length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-gray-500 text-sm">
                정산 내역이 없습니다
              </div>
            ) : (
              <>
                {/* 모바일: 카드 뷰 */}
                <div className="md:hidden p-3 sm:p-4 space-y-3">
                  {settlements.map((settlement) => (
                    <div
                      key={settlement.id}
                      className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{settlement.yearMonth}</p>
                            {getStatusBadge(settlement.status)}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">정산금</p>
                          <p className="font-bold text-emerald-600 text-lg">
                            {formatCurrency(settlement.partnerShare)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200">
                        <div>
                          <p className="text-xs text-gray-500">총 매출</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(settlement.grossRevenue)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">순 매출</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(settlement.netRevenue)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">스트리밍</p>
                          <p className="text-sm font-medium text-gray-900">
                            {settlement.totalStreams.toLocaleString()}회
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">다운로드</p>
                          <p className="text-sm font-medium text-gray-900">
                            {settlement.totalDownloads.toLocaleString()}회
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 데스크탑: 테이블 뷰 */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          정산월
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          총 매출
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          순 매출
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          정산금
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          스트리밍
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          다운로드
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          상태
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {settlements.map((settlement) => (
                        <tr key={settlement.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {settlement.yearMonth}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {formatCurrency(settlement.grossRevenue)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {formatCurrency(settlement.netRevenue)}
                          </td>
                          <td className="px-6 py-4 font-bold text-emerald-600">
                            {formatCurrency(settlement.partnerShare)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {settlement.totalStreams.toLocaleString()}회
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {settlement.totalDownloads.toLocaleString()}회
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(settlement.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'tracks' && dashboard && (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-sm sm:text-base">내 트랙</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                정산 대상으로 연결된 트랙 목록입니다
              </p>
            </div>
            <div className="p-3 sm:p-4 lg:p-6">
              {dashboard.assignedTracks.length === 0 ? (
                <div className="text-center py-8 sm:py-12 text-gray-500 text-sm">
                  연결된 트랙이 없습니다
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {dashboard.assignedTracks.map((track) => (
                    <div
                      key={track.id}
                      className="p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl border border-gray-100"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Music2 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate text-sm sm:text-base">{track.title}</p>
                          <p className="text-xs sm:text-sm text-gray-500 truncate">{track.artist}</p>
                          {track.album && (
                            <p className="text-xs text-gray-400 truncate mt-0.5 sm:mt-1">{track.album}</p>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 sm:mt-4 flex items-center justify-between">
                        <span className="text-xs text-gray-500">{track.role || '권리자'}</span>
                        <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs sm:text-sm font-medium">
                          {track.shareRate}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
