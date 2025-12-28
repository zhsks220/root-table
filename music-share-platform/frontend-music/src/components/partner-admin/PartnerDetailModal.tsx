import { useState, useEffect } from 'react';
import { partnerAdminAPI, Partner, PartnerDetail, PartnerTrack } from '../../services/partnerAdminApi';
import { X, Loader2, Music2, Building2, Phone, Mail, CreditCard } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

interface PartnerDetailModalProps {
  isOpen: boolean;
  partner: Partner;
  onClose: () => void;
  onUpdate: () => void;
}

export function PartnerDetailModal({ isOpen, partner, onClose }: PartnerDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<PartnerDetail | null>(null);
  const [tracks, setTracks] = useState<PartnerTrack[]>([]);
  const [activeSection, setActiveSection] = useState<'info' | 'tracks' | 'settlements'>('info');
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  useEffect(() => {
    if (isOpen && partner) {
      loadPartnerDetail();
    }
  }, [isOpen, partner]);

  const loadPartnerDetail = async () => {
    setLoading(true);
    try {
      const [detailRes, tracksRes] = await Promise.all([
        partnerAdminAPI.getPartner(partner.id),
        partnerAdminAPI.getPartnerTracks(partner.id),
      ]);
      setDetail(detailRes.data.partner);
      setTracks(tracksRes.data.tracks || []);
    } catch (err) {
      console.error('Failed to load partner detail:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getPartnerTypeName = (type: string) => {
    switch (type) {
      case 'artist': return '아티스트';
      case 'company': return '기획사';
      case 'composer': return '작곡가';
      default: return type;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`rounded-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col ${isDark ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
        {/* 헤더 */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              partner.partnerType === 'artist'
                ? (isDark ? 'bg-purple-900/50 text-purple-400' : 'bg-purple-100 text-purple-600')
                : partner.partnerType === 'company'
                  ? (isDark ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-600')
                  : (isDark ? 'bg-amber-900/50 text-amber-400' : 'bg-amber-100 text-amber-600')
            }`}>
              {partner.partnerType === 'artist' ? <Music2 className="w-6 h-6" /> :
               partner.partnerType === 'company' ? <Building2 className="w-6 h-6" /> :
               <Music2 className="w-6 h-6" />}
            </div>
            <div>
              <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {partner.businessName || partner.representativeName || '이름 없음'}
              </h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{getPartnerTypeName(partner.partnerType)}</p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
            <X className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          </button>
        </div>

        {/* 탭 */}
        <div className={`flex border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
          <button
            onClick={() => setActiveSection('info')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeSection === 'info'
                ? (isDark ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-emerald-600 border-b-2 border-emerald-500')
                : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')
            }`}
          >
            기본 정보
          </button>
          <button
            onClick={() => setActiveSection('tracks')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeSection === 'tracks'
                ? (isDark ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-emerald-600 border-b-2 border-emerald-500')
                : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')
            }`}
          >
            연결된 트랙 ({tracks.length})
          </button>
          <button
            onClick={() => setActiveSection('settlements')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeSection === 'settlements'
                ? (isDark ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-emerald-600 border-b-2 border-emerald-500')
                : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')
            }`}
          >
            정산 내역
          </button>
        </div>

        {/* 내용 */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : (
            <>
              {/* 기본 정보 */}
              {activeSection === 'info' && detail && (
                <div className="space-y-6">
                  {/* 연락처 정보 */}
                  <div className={`rounded-xl p-4 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                    <h3 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>연락처 정보</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Mail className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{detail.email || '-'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{detail.phone || '-'}</span>
                      </div>
                    </div>
                    {detail.address && (
                      <div className="mt-3 flex items-start gap-2">
                        <Building2 className={`w-4 h-4 mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{detail.address}</span>
                      </div>
                    )}
                  </div>

                  {/* 사업자 정보 */}
                  {detail.businessNumber && (
                    <div className={`rounded-xl p-4 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                      <h3 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>사업자 정보</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>사업자명</p>
                          <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{detail.businessName}</p>
                        </div>
                        <div>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>사업자번호</p>
                          <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{detail.businessNumber}</p>
                        </div>
                        <div>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>대표자명</p>
                          <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{detail.representativeName || '-'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 정산 정보 */}
                  <div className={`rounded-xl p-4 ${isDark ? 'bg-emerald-900/30' : 'bg-emerald-50'}`}>
                    <h3 className={`text-sm font-medium mb-3 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>정산 정보</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className={`text-xs ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>기본 정산율</p>
                        <p className={`text-2xl font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>{detail.defaultShareRate}%</p>
                      </div>
                      <div>
                        <p className={`text-xs ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>계약 기간</p>
                        <p className={`text-sm ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                          {detail.contractStartDate ?
                            `${new Date(detail.contractStartDate).toLocaleDateString('ko-KR')} ~ ${detail.contractEndDate ? new Date(detail.contractEndDate).toLocaleDateString('ko-KR') : '무기한'}`
                            : '미설정'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 계좌 정보 */}
                  {detail.bankName && (
                    <div className={`rounded-xl p-4 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                      <h3 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <CreditCard className="w-4 h-4 inline mr-1" />
                        입금 계좌
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>은행</p>
                          <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{detail.bankName}</p>
                        </div>
                        <div>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>계좌번호</p>
                          <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{detail.bankAccount}</p>
                        </div>
                        <div>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>예금주</p>
                          <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{detail.bankHolder}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 메모 */}
                  {detail.memo && (
                    <div className={`rounded-xl p-4 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                      <h3 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>메모</h3>
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{detail.memo}</p>
                    </div>
                  )}
                </div>
              )}

              {/* 연결된 트랙 */}
              {activeSection === 'tracks' && (
                <div>
                  {tracks.length === 0 ? (
                    <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      연결된 트랙이 없습니다
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {tracks.map((track) => (
                        <div key={track.id} className={`rounded-lg p-4 flex items-center justify-between ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-emerald-900/50' : 'bg-emerald-100'}`}>
                              <Music2 className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                            </div>
                            <div>
                              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{track.title}</p>
                              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{track.artist}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{track.shareRate}%</p>
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{track.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 정산 내역 */}
              {activeSection === 'settlements' && (
                <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  정산 내역이 없습니다
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
