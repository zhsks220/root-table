import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Calculator, Settings, Music, BarChart3, Loader2, Trash2, Copy, Check } from 'lucide-react';
import { MobileLayout, MenuItem, QuickLink } from '../components/layout/MobileLayout';
import { PartnerList } from '../components/partner-admin/PartnerList';
import { PartnerInviteModal } from '../components/partner-admin/PartnerInviteModal';
import { PartnerSettlementManager } from '../components/partner-admin/PartnerSettlementManager';
import { partnerAdminAPI, Partner, PartnerInvitation } from '../services/partnerAdminApi';
import { AnimatePresence, motion } from 'framer-motion';

type Tab = 'partners' | 'invitations' | 'settlements' | 'settings';

const menuItems: MenuItem[] = [
  { id: 'partners', label: '파트너 관리', icon: Users },
  { id: 'invitations', label: '파트너 초대', icon: UserPlus },
  { id: 'settlements', label: '정산 관리', icon: Calculator },
  { id: 'settings', label: '설정', icon: Settings },
];

const quickLinks: QuickLink[] = [
  { label: 'CMS 대시보드', path: '/cms', icon: BarChart3 },
  { label: '관리자 페이지', path: '/', icon: Music },
];

// 초대 카드 컴포넌트 (모바일용)
function InvitationCard({ invitation, onDelete }: { invitation: PartnerInvitation; onDelete: (id: string) => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const inviteUrl = `${window.location.origin}/partner/register?code=${invitation.invitationCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            invitation.partnerType === 'artist' ? 'bg-purple-100 text-purple-800' :
            invitation.partnerType === 'company' ? 'bg-blue-100 text-blue-800' :
            'bg-amber-100 text-amber-800'
          }`}>
            {invitation.partnerType === 'artist' ? '아티스트' :
             invitation.partnerType === 'company' ? '기획사' : '작곡가'}
          </span>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          invitation.isUsed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {invitation.isUsed ? '사용됨' : '대기중'}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">초대코드</span>
          <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
            {invitation.invitationCode}
          </code>
        </div>

        {invitation.email && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">이메일</span>
            <span className="text-sm text-gray-900">{invitation.email}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">정산율</span>
          <span className="text-sm font-medium text-gray-900">{invitation.defaultShareRate}%</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">생성일</span>
          <span className="text-sm text-gray-600">
            {new Date(invitation.createdAt).toLocaleDateString('ko-KR')}
          </span>
        </div>
      </div>

      {!invitation.isUsed && (
        <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            {copied ? '복사됨' : '링크 복사'}
          </button>
          <button
            onClick={() => onDelete(invitation.id)}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('partners');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 탭 변경 핸들러 (settings는 통합 설정 페이지로 이동)
  const handleTabChange = (tab: string) => {
    if (tab === 'settings') {
      navigate('/admin/settings');
    } else {
      setActiveTab(tab as Tab);
    }
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
      logoIcon={Music}
      logoText="ROUTELABEL"
      logoSubtext="Partner Admin"
      theme="dark"
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
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">파트너 관리</h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
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
              <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">{error}</div>
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
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">파트너 초대</h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
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
              <div className="bg-white rounded-xl border border-gray-100 p-8 sm:p-12 text-center">
                <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">생성된 초대가 없습니다</p>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="mt-4 text-emerald-600 hover:text-emerald-700 font-medium text-sm"
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
                    />
                  ))}
                </div>

                {/* 데스크톱: 테이블 뷰 */}
                <div className="hidden sm:block bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">초대코드</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">파트너 유형</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이메일</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">기본 정산율</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">생성일</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {invitations.map((inv) => (
                          <tr key={inv.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                                {inv.invitationCode}
                              </code>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                inv.partnerType === 'artist' ? 'bg-purple-100 text-purple-800' :
                                inv.partnerType === 'company' ? 'bg-blue-100 text-blue-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {inv.partnerType === 'artist' ? '아티스트' :
                                 inv.partnerType === 'company' ? '기획사' : '작곡가'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {inv.email || '-'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {inv.defaultShareRate}%
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                inv.isUsed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {inv.isUsed ? '사용됨' : '대기중'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {new Date(inv.createdAt).toLocaleDateString('ko-KR')}
                            </td>
                            <td className="px-6 py-4">
                              {!inv.isUsed && (
                                <button
                                  onClick={() => handleDeleteInvitation(inv.id)}
                                  className="text-red-600 hover:text-red-800 text-sm"
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
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">정산 관리</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
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
