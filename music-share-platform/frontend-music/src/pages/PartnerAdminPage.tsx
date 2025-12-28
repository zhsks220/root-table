import { useState, useEffect } from 'react';
import { Users, UserPlus, Calculator, Settings, Music, BarChart3, Loader2, Trash2, Copy, Check } from 'lucide-react';
import { MobileLayout, MenuItem, QuickLink } from '../components/layout/MobileLayout';
import { PartnerList } from '../components/partner-admin/PartnerList';
import { PartnerInviteModal } from '../components/partner-admin/PartnerInviteModal';
import { PartnerSettlementManager } from '../components/partner-admin/PartnerSettlementManager';
import { partnerAdminAPI, Partner, PartnerInvitation } from '../services/partnerAdminApi';
import { useThemeStore } from '../store/themeStore';
import { AnimatePresence, motion } from 'framer-motion';

type Tab = 'partners' | 'invitations' | 'settlements';

const menuItems: MenuItem[] = [
  { id: 'partners', label: '파트너 관리', icon: Users },
  { id: 'invitations', label: '파트너 초대', icon: UserPlus },
  { id: 'settlements', label: '정산 관리', icon: Calculator },
];

const quickLinks: QuickLink[] = [
  { label: '음원 라이브러리', path: '/admin', icon: Music },
  { label: 'CMS 대시보드', path: '/cms', icon: BarChart3 },
  { label: '파트너 페이지', path: '/partner-admin', icon: Users },
  { label: '설정', path: '/admin/settings', icon: Settings },
];

// 초대 카드 컴포넌트 (모바일용)
function InvitationCard({ invitation, onDelete, isDark }: { invitation: PartnerInvitation; onDelete: (id: string) => void; isDark: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const inviteUrl = `${window.location.origin}/partner/register?code=${invitation.invitationCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`rounded-xl p-4 ${isDark ? 'bg-[#0a0a0a] border border-white/10' : 'bg-white border border-gray-100'}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            invitation.partnerType === 'artist'
              ? (isDark ? 'bg-purple-900/50 text-purple-400' : 'bg-purple-100 text-purple-800')
              : invitation.partnerType === 'company'
              ? (isDark ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-800')
              : (isDark ? 'bg-amber-900/50 text-amber-400' : 'bg-amber-100 text-amber-800')
          }`}>
            {invitation.partnerType === 'artist' ? '아티스트' :
             invitation.partnerType === 'company' ? '기획사' : '작곡가'}
          </span>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          invitation.isUsed
            ? (isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-800')
            : (isDark ? 'bg-yellow-900/50 text-yellow-400' : 'bg-yellow-100 text-yellow-800')
        }`}>
          {invitation.isUsed ? '사용됨' : '대기중'}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>초대코드</span>
          <code className={`px-2 py-1 rounded text-xs font-mono ${isDark ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-800'}`}>
            {invitation.invitationCode}
          </code>
        </div>

        {invitation.email && (
          <div className="flex items-center justify-between">
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>이메일</span>
            <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{invitation.email}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>정산율</span>
          <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{invitation.defaultShareRate}%</span>
        </div>

        <div className="flex items-center justify-between">
          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>생성일</span>
          <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {new Date(invitation.createdAt).toLocaleDateString('ko-KR')}
          </span>
        </div>
      </div>

      {!invitation.isUsed && (
        <div className={`flex gap-2 mt-4 pt-3 ${isDark ? 'border-t border-white/10' : 'border-t border-gray-100'}`}>
          <button
            onClick={handleCopy}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${isDark ? 'bg-white/5 text-gray-300 hover:bg-white/10' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied ? '복사됨' : '링크 복사'}
          </button>
          <button
            onClick={() => onDelete(invitation.id)}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${isDark ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
          >
            <Trash2 className="w-4 h-4" />
            삭제
          </button>
        </div>
      )}
    </div>
  );
}

export default function PartnerAdminPage() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<Tab>('partners');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 탭 변경 핸들러
  const handleTabChange = (tab: string) => {
    setActiveTab(tab as Tab);
  };

  // 데이터 상태
  const [partners, setPartners] = useState<Partner[]>([]);
  const [invitations, setInvitations] = useState<PartnerInvitation[]>([]);

  // 모달 상태
  const [showInviteModal, setShowInviteModal] = useState(false);

  // 파트너 목록 로드
  const loadPartners = async () => {
    try {
      const response = await partnerAdminAPI.getPartners();
      setPartners(response.data.partners || []);
    } catch (err: any) {
      console.error('Failed to load partners:', err);
      setError('파트너 목록을 불러오는데 실패했습니다.');
    }
  };

  // 초대 목록 로드
  const loadInvitations = async () => {
    try {
      const response = await partnerAdminAPI.getInvitations();
      setInvitations(response.data.invitations || []);
    } catch (err: any) {
      console.error('Failed to load invitations:', err);
    }
  };

  // 초기 데이터 로드
  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([loadPartners(), loadInvitations()]);
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 초대 생성 완료 핸들러
  const handleInviteComplete = () => {
    setShowInviteModal(false);
    loadInvitations();
  };

  // 파트너 삭제 핸들러
  const handleDeletePartner = async (partnerId: string) => {
    if (!confirm('정말 이 파트너를 삭제하시겠습니까?')) return;

    try {
      await partnerAdminAPI.deletePartner(partnerId);
      loadPartners();
    } catch (err: any) {
      console.error('Failed to delete partner:', err);
      alert('파트너 삭제에 실패했습니다.');
    }
  };

  // 초대 삭제 핸들러
  const handleDeleteInvitation = async (invitationId: string) => {
    if (!confirm('정말 이 초대를 삭제하시겠습니까?')) return;

    try {
      await partnerAdminAPI.deleteInvitation(invitationId);
      loadInvitations();
    } catch (err: any) {
      console.error('Failed to delete invitation:', err);
      alert('초대 삭제에 실패했습니다.');
    }
  };

  return (
    <MobileLayout
      title="Partner Admin"
      subtitle="Partner Admin"
      menuItems={menuItems}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      quickLinks={quickLinks}
      logoImage="/images/wordmark_B.png"
      logoImageDark="/images/wordmark_W.png"
      logoTypeImage="/images/typelogo_B.png"
      logoTypeImageDark="/images/typelogo_W.png"
      logoSubtext="Partner Admin"
    >
      <AnimatePresence mode="wait">
        {/* 파트너 관리 탭 */}
        {activeTab === 'partners' && (
          <motion.div
            key="partners"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-4 sm:p-6 lg:p-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
              <div>
                <h1 className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>파트너 관리</h1>
                <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  등록된 파트너(아티스트, 기획사, 작곡가)를 관리합니다
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveTab('invitations');
                  setShowInviteModal(true);
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm sm:text-base"
              >
                <UserPlus className="w-4 h-4" />
                <span>파트너 초대</span>
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64 sm:h-96">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              </div>
            ) : error ? (
              <div className={`p-4 rounded-lg text-sm ${isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'}`}>{error}</div>
            ) : (
              <PartnerList
                partners={partners}
                onDelete={handleDeletePartner}
                onRefresh={loadPartners}
              />
            )}
          </motion.div>
        )}

        {/* 파트너 초대 탭 */}
        {activeTab === 'invitations' && (
          <motion.div
            key="invitations"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-4 sm:p-6 lg:p-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
              <div>
                <h1 className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>파트너 초대</h1>
                <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  초대 링크를 생성하여 파트너를 초대하세요
                </p>
              </div>
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm sm:text-base"
              >
                <UserPlus className="w-4 h-4" />
                <span>새 초대 생성</span>
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64 sm:h-96">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              </div>
            ) : invitations.length === 0 ? (
              <div className={`rounded-xl p-8 sm:p-12 text-center ${isDark ? 'bg-[#0a0a0a] border border-white/10' : 'bg-white border border-gray-100'}`}>
                <UserPlus className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>생성된 초대가 없습니다</p>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="mt-4 text-emerald-500 hover:text-emerald-600 font-medium text-sm"
                >
                  첫 초대 생성하기
                </button>
              </div>
            ) : (
              <>
                {/* 모바일: 카드 뷰 */}
                <div className="grid grid-cols-1 sm:hidden gap-4">
                  {invitations.map((inv) => (
                    <InvitationCard
                      key={inv.id}
                      invitation={inv}
                      onDelete={handleDeleteInvitation}
                      isDark={isDark}
                    />
                  ))}
                </div>

                {/* 데스크톱: 테이블 뷰 */}
                <div className={`hidden sm:block rounded-xl overflow-hidden ${isDark ? 'bg-[#0a0a0a] border border-white/10' : 'bg-white border border-gray-100'}`}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className={isDark ? 'bg-white/5 border-b border-white/10' : 'bg-gray-50 border-b border-gray-100'}>
                        <tr>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>초대코드</th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>파트너 유형</th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>이메일</th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>기본 정산율</th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>상태</th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>생성일</th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>작업</th>
                        </tr>
                      </thead>
                      <tbody className={isDark ? 'divide-y divide-white/10' : 'divide-y divide-gray-100'}>
                        {invitations.map((inv) => (
                          <tr key={inv.id} className={isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}>
                            <td className="px-6 py-4">
                              <code className={`px-2 py-1 rounded text-sm font-mono ${isDark ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-800'}`}>
                                {inv.invitationCode}
                              </code>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                inv.partnerType === 'artist'
                                  ? (isDark ? 'bg-purple-900/50 text-purple-400' : 'bg-purple-100 text-purple-800')
                                  : inv.partnerType === 'company'
                                  ? (isDark ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-800')
                                  : (isDark ? 'bg-amber-900/50 text-amber-400' : 'bg-amber-100 text-amber-800')
                              }`}>
                                {inv.partnerType === 'artist' ? '아티스트' :
                                 inv.partnerType === 'company' ? '기획사' : '작곡가'}
                              </span>
                            </td>
                            <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                              {inv.email || '-'}
                            </td>
                            <td className={`px-6 py-4 text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {inv.defaultShareRate}%
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                inv.isUsed
                                  ? (isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-800')
                                  : (isDark ? 'bg-yellow-900/50 text-yellow-400' : 'bg-yellow-100 text-yellow-800')
                              }`}>
                                {inv.isUsed ? '사용됨' : '대기중'}
                              </span>
                            </td>
                            <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {new Date(inv.createdAt).toLocaleDateString('ko-KR')}
                            </td>
                            <td className="px-6 py-4">
                              {!inv.isUsed && (
                                <button
                                  onClick={() => handleDeleteInvitation(inv.id)}
                                  className={`text-sm ${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-800'}`}
                                >
                                  삭제
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* 정산 관리 탭 */}
        {activeTab === 'settlements' && (
          <motion.div
            key="settlements"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-4 sm:p-6 lg:p-8"
          >
            <div className="mb-4 sm:mb-6">
              <h1 className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>정산 관리</h1>
              <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                파트너별 정산 내역을 관리하고 배분합니다
              </p>
            </div>

            <PartnerSettlementManager partners={partners} onRefresh={loadPartners} />
          </motion.div>
        )}

      </AnimatePresence>

      {/* 초대 생성 모달 */}
      <PartnerInviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onComplete={handleInviteComplete}
      />
    </MobileLayout>
  );
}
