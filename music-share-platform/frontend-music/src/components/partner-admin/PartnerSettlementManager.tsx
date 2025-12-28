import { useState, useEffect } from 'react';
import { partnerAdminAPI, Partner, PartnerSettlement } from '../../services/partnerAdminApi';
import { Loader2, DollarSign, CheckCircle, Clock, CreditCard, AlertCircle, ChevronDown } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

interface PartnerSettlementManagerProps {
  partners: Partner[];
  onRefresh: () => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ko-KR').format(Math.round(value)) + '원';
};

export function PartnerSettlementManager({ partners, onRefresh: _onRefresh }: PartnerSettlementManagerProps) {
  const [loading, setLoading] = useState(false);
  const [settlements, setSettlements] = useState<PartnerSettlement[]>([]);
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [showPartnerFilter, setShowPartnerFilter] = useState(false);
  const [yearMonth, setYearMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // 정산 내역 로드
  const loadSettlements = async () => {
    if (!selectedPartnerId) {
      setSettlements([]);
      return;
    }

    setLoading(true);
    try {
      const response = await partnerAdminAPI.getPartnerSettlements(selectedPartnerId);
      setSettlements(response.data.settlements || []);
    } catch (err) {
      console.error('Failed to load settlements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettlements();
  }, [selectedPartnerId]);

  // 정산 상태 업데이트
  const handleStatusUpdate = async (settlementId: string, newStatus: 'confirmed' | 'paid') => {
    if (!confirm(`정산 상태를 "${newStatus === 'confirmed' ? '확정' : '지급완료'}"로 변경하시겠습니까?`)) {
      return;
    }

    try {
      await partnerAdminAPI.updateSettlementStatus(settlementId, { status: newStatus });
      loadSettlements();
    } catch (err) {
      console.error('Failed to update settlement status:', err);
      alert('상태 업데이트에 실패했습니다.');
    }
  };

  // 정산 할당 (CMS 데이터 기반)
  const handleAllocateSettlements = async () => {
    if (!confirm(`${yearMonth} 정산 데이터를 파트너들에게 할당하시겠습니까?`)) {
      return;
    }

    setLoading(true);
    try {
      await partnerAdminAPI.allocateSettlements(yearMonth);
      alert('정산 할당이 완료되었습니다.');
      loadSettlements();
    } catch (err: any) {
      console.error('Failed to allocate settlements:', err);
      alert(err.response?.data?.error || '정산 할당에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${isDark ? 'bg-yellow-900/50 text-yellow-400' : 'bg-yellow-100 text-yellow-800'}`}>
            <Clock className="w-3 h-3" />
            대기중
          </span>
        );
      case 'confirmed':
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${isDark ? 'bg-emerald-900/50 text-emerald-400' : 'bg-emerald-100 text-emerald-800'}`}>
            <CheckCircle className="w-3 h-3" />
            확정됨
          </span>
        );
      case 'paid':
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-800'}`}>
            <CreditCard className="w-3 h-3" />
            지급완료
          </span>
        );
      default:
        return null;
    }
  };

  // 전체 통계
  const stats = {
    totalSettlements: settlements.length,
    pending: settlements.filter(s => s.status === 'pending').length,
    confirmed: settlements.filter(s => s.status === 'confirmed').length,
    paid: settlements.filter(s => s.status === 'paid').length,
    totalAmount: settlements.reduce((sum, s) => sum + (s.partnerShare || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* 정산 할당 섹션 */}
      <div className={`rounded-xl border p-6 ${isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-gray-100'}`}>
        <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>정산 데이터 할당</h3>
        <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          CMS에 업로드된 정산 데이터를 파트너들에게 할당합니다.
          파트너-트랙 연결 설정에 따라 각 파트너의 정산 금액이 계산됩니다.
        </p>

        <div className="flex items-end gap-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>정산월</label>
            <input
              type="month"
              value={yearMonth}
              onChange={(e) => setYearMonth(e.target.value)}
              className={`px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
            />
          </div>
          <button
            onClick={handleAllocateSettlements}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
            정산 할당 실행
          </button>
        </div>

        <div className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${isDark ? 'bg-amber-900/30' : 'bg-amber-50'}`}>
          <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
          <div className={`text-sm ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
            <p className="font-medium">할당 전 확인사항</p>
            <ul className={`mt-1 list-disc list-inside ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
              <li>CMS에 해당 월의 정산 데이터가 업로드되어 있어야 합니다</li>
              <li>파트너-트랙 연결 설정이 완료되어 있어야 합니다</li>
              <li>이미 할당된 정산은 업데이트됩니다</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 파트너별 정산 조회 */}
      <div className={`rounded-xl border p-6 ${isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-gray-100'}`}>
        <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>파트너별 정산 내역</h3>

        {/* 파트너 선택 */}
        <div className="mb-6">
          <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>파트너 선택</label>
          <div className="relative max-w-sm">
            <button
              onClick={() => setShowPartnerFilter(!showPartnerFilter)}
              className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 border rounded-lg text-sm transition-colors ${
                isDark
                  ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                  : 'bg-gray-50 border-gray-200 text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span className={!selectedPartnerId ? (isDark ? 'text-gray-500' : 'text-gray-400') : ''}>
                {selectedPartnerId
                  ? (() => {
                      const partner = partners.find(p => p.id === selectedPartnerId);
                      if (!partner) return '파트너를 선택하세요';
                      const name = partner.businessName || partner.representativeName || partner.email;
                      const type = partner.partnerType === 'artist' ? '아티스트' :
                                   partner.partnerType === 'company' ? '기획사' : '작곡가';
                      return `${name} (${type})`;
                    })()
                  : '파트너를 선택하세요'
                }
              </span>
              <ChevronDown className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            </button>
            {showPartnerFilter && (
              <div className={`absolute top-full left-0 right-0 mt-1 border rounded-lg shadow-lg py-1 z-20 max-h-[280px] overflow-y-auto ${
                isDark
                  ? 'bg-black border-white/10'
                  : 'bg-white border-gray-200'
              }`}>
                <button
                  onClick={() => {
                    setSelectedPartnerId('');
                    setShowPartnerFilter(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm ${
                    !selectedPartnerId
                      ? isDark
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-emerald-50 text-emerald-700'
                      : isDark
                        ? 'text-gray-400 hover:bg-white/10'
                        : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  파트너를 선택하세요
                </button>
                {partners.map((partner) => {
                  const name = partner.businessName || partner.representativeName || partner.email;
                  const type = partner.partnerType === 'artist' ? '아티스트' :
                               partner.partnerType === 'company' ? '기획사' : '작곡가';
                  return (
                    <button
                      key={partner.id}
                      onClick={() => {
                        setSelectedPartnerId(partner.id);
                        setShowPartnerFilter(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm ${
                        selectedPartnerId === partner.id
                          ? isDark
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-emerald-50 text-emerald-700'
                          : isDark
                            ? 'text-gray-300 hover:bg-white/10'
                            : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {name} ({type})
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {selectedPartnerId && (
          <>
            {/* 통계 카드 */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className={`rounded-lg p-4 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>전체 정산</p>
                <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.totalSettlements}건</p>
              </div>
              <div className={`rounded-lg p-4 ${isDark ? 'bg-yellow-900/30' : 'bg-yellow-50'}`}>
                <p className={`text-sm ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>대기중</p>
                <p className={`text-xl font-bold ${isDark ? 'text-yellow-300' : 'text-yellow-700'}`}>{stats.pending}건</p>
              </div>
              <div className={`rounded-lg p-4 ${isDark ? 'bg-emerald-900/30' : 'bg-emerald-50'}`}>
                <p className={`text-sm ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>확정됨</p>
                <p className={`text-xl font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>{stats.confirmed}건</p>
              </div>
              <div className={`rounded-lg p-4 ${isDark ? 'bg-green-900/30' : 'bg-green-50'}`}>
                <p className={`text-sm ${isDark ? 'text-green-400' : 'text-green-600'}`}>지급완료</p>
                <p className={`text-xl font-bold ${isDark ? 'text-green-300' : 'text-green-700'}`}>{stats.paid}건</p>
              </div>
              <div className={`rounded-lg p-4 ${isDark ? 'bg-emerald-900/30' : 'bg-emerald-50'}`}>
                <p className={`text-sm ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>총 정산금액</p>
                <p className={`text-xl font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>{formatCurrency(stats.totalAmount)}</p>
              </div>
            </div>

            {/* 정산 테이블 */}
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              </div>
            ) : settlements.length === 0 ? (
              <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                정산 내역이 없습니다
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`border-y ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                    <tr>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>정산월</th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>총 매출</th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>순 매출</th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>파트너 정산금</th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>스트리밍</th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>다운로드</th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>상태</th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>작업</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-white/10' : 'divide-gray-100'}`}>
                    {settlements.map((settlement) => (
                      <tr key={settlement.id} className={isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}>
                        <td className="px-4 py-3">
                          <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{settlement.yearMonth}</span>
                        </td>
                        <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {formatCurrency(settlement.grossRevenue || 0)}
                        </td>
                        <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {formatCurrency(settlement.netRevenue || 0)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            {formatCurrency(settlement.partnerShare || 0)}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {(settlement.totalStreams || 0).toLocaleString()}회
                        </td>
                        <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {(settlement.totalDownloads || 0).toLocaleString()}회
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(settlement.status)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {settlement.status === 'pending' && (
                              <button
                                onClick={() => handleStatusUpdate(settlement.id, 'confirmed')}
                                className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-emerald-900/50 text-emerald-400 hover:bg-emerald-900/70' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}
                              >
                                확정
                              </button>
                            )}
                            {settlement.status === 'confirmed' && (
                              <button
                                onClick={() => handleStatusUpdate(settlement.id, 'paid')}
                                className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-green-900/50 text-green-400 hover:bg-green-900/70' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                              >
                                지급완료
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
