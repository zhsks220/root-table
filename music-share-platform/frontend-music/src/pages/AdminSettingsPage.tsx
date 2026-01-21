import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { settingsAPI } from '../services/settingsApi';
import { MobileLayout, MenuItem, QuickLink } from '../components/layout/MobileLayout';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Loader2,
  Settings,
  Lock,
  Building2,
  Save,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Users,
  Eye,
  EyeOff,
  Music,
} from 'lucide-react';

interface Distributor {
  id: string;
  name: string;
  code: string;
  commission_rate: number;
  is_active: boolean;
}

type Tab = 'account' | 'distributors' | 'system';

const menuItems: MenuItem[] = [
  { id: 'account', label: '계정 설정', icon: Lock },
  { id: 'distributors', label: '유통사 관리', icon: Building2 },
  { id: 'system', label: '시스템 정보', icon: Settings },
];

const quickLinks: QuickLink[] = [
  { label: '음원 라이브러리', path: '/admin', icon: Music },
  { label: 'CMS 대시보드', path: '/cms', icon: BarChart3 },
  { label: '파트너 페이지', path: '/partner-admin', icon: Users },
  { label: '설정', path: '/admin/settings', icon: Settings },
];

export default function AdminSettingsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  // URL 쿼리 파라미터로 탭 선택 지원
  const initialTab = (searchParams.get('tab') as Tab) || 'account';
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 비밀번호 변경 폼
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 유통사 관리
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [newDistributor, setNewDistributor] = useState({ name: '', code: '', commissionRate: 0 });

  // 시스템 정보
  const [systemInfo, setSystemInfo] = useState<any>(null);

  useEffect(() => {
    if (activeTab === 'distributors') {
      loadDistributors();
    } else if (activeTab === 'system') {
      loadSystemInfo();
    }
  }, [activeTab]);

  // URL 파라미터 변경 시 탭 업데이트
  useEffect(() => {
    const tabParam = searchParams.get('tab') as Tab;
    if (tabParam && ['account', 'distributors', 'system'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const loadDistributors = async () => {
    try {
      const response = await settingsAPI.getDistributors();
      setDistributors(response.data.distributors || []);
    } catch (error) {
      console.error('Failed to load distributors:', error);
    }
  };

  const loadSystemInfo = async () => {
    try {
      const response = await settingsAPI.getSystemSettings();
      setSystemInfo(response.data.system);
    } catch (error) {
      console.error('Failed to load system info:', error);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMessage('error', '새 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      showMessage('error', '비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    setLoading(true);
    try {
      await settingsAPI.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      showMessage('success', '비밀번호가 변경되었습니다.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      showMessage('error', error.response?.data?.error || '비밀번호 변경에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDistributor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDistributor.name || !newDistributor.code) return;

    setLoading(true);
    try {
      await settingsAPI.createDistributor(newDistributor);
      setNewDistributor({ name: '', code: '', commissionRate: 0 });
      loadDistributors();
      showMessage('success', '유통사가 추가되었습니다.');
    } catch (error: any) {
      showMessage('error', error.response?.data?.error || '유통사 추가에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDistributor = async (id: string) => {
    if (!confirm('이 유통사를 비활성화하시겠습니까?')) return;

    try {
      await settingsAPI.deleteDistributor(id);
      loadDistributors();
      showMessage('success', '유통사가 비활성화되었습니다.');
    } catch (error) {
      showMessage('error', '유통사 삭제에 실패했습니다.');
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as Tab);
    // URL 업데이트 (히스토리에 추가하지 않음)
    navigate(`/admin/settings?tab=${tab}`, { replace: true });
  };

  return (
    <MobileLayout
      title="설정"
      subtitle="관리자 설정"
      menuItems={menuItems}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      quickLinks={quickLinks}
      logoImage="/images/wordmark_B.png"
      logoImageDark="/images/wordmark_W.png"
      logoTypeImage="/images/typelogo_B.png"
      logoTypeImageDark="/images/typelogo_W.png"
      logoSubtext="Settings"
    >
      {/* 알림 메시지 */}
      {message && (
        <div className={`mx-4 sm:mx-6 lg:mx-8 mt-4 p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success'
            ? isDark ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-green-50 text-green-700 border border-green-200'
            : isDark ? 'bg-red-900/30 text-red-400 border border-red-800' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* 계정 설정 */}
        {activeTab === 'account' && (
          <motion.div
            key="account"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto"
          >
            {/* 프로필 카드 */}
            <div className={`rounded-xl p-5 mb-4 ${isDark ? 'bg-[#0a0a0a] border border-white/10' : 'bg-white border border-gray-100'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                  {user?.name?.[0] || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className={`text-lg font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.name}</h2>
                  <p className={`text-sm truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{user?.email}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                  {user?.role === 'developer' ? '개발자' : user?.role === 'admin' ? '관리자' : user?.role === 'partner' ? '파트너' : '일반 사용자'}
                </span>
              </div>
            </div>

            {/* 계정 정보 */}
            <div className={`rounded-xl p-5 mb-4 ${isDark ? 'bg-[#0a0a0a] border border-white/10' : 'bg-white border border-gray-100'}`}>
              <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>계정 정보</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>유저 ID</span>
                  <span className={`font-mono text-sm font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{(user as any)?.username || '-'}</span>
                </div>
                <div className={`border-t ${isDark ? 'border-white/5' : 'border-gray-100'}`} />
                <div className="flex items-center justify-between py-2">
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>이메일</span>
                  <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.email}</span>
                </div>
                <div className={`border-t ${isDark ? 'border-white/5' : 'border-gray-100'}`} />
                <div className="flex items-center justify-between py-2">
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>이름</span>
                  <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.name}</span>
                </div>
              </div>
            </div>

            {/* 비밀번호 변경 */}
            <div className={`rounded-xl p-5 ${isDark ? 'bg-[#0a0a0a] border border-white/10' : 'bg-white border border-gray-100'}`}>
              <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>비밀번호 변경</h3>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>현재 비밀번호</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className={`w-full px-3 py-2.5 pr-10 rounded-lg text-sm outline-none transition-all ${isDark ? 'bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-emerald-500/50' : 'border border-gray-200 focus:border-emerald-500'}`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>새 비밀번호</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="8자 이상"
                      className={`w-full px-3 py-2.5 pr-10 rounded-lg text-sm outline-none transition-all ${isDark ? 'bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-emerald-500/50' : 'border border-gray-200 focus:border-emerald-500'}`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>새 비밀번호 확인</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className={`w-full px-3 py-2.5 pr-10 rounded-lg text-sm outline-none transition-all ${isDark ? 'bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-emerald-500/50' : 'border border-gray-200 focus:border-emerald-500'}`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                    <p className="mt-1.5 text-xs text-red-500">비밀번호가 일치하지 않습니다.</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || (!!passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  비밀번호 변경
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* 유통사 관리 */}
        {activeTab === 'distributors' && (
          <motion.div
            key="distributors"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6"
          >
            <div className="mb-4 sm:mb-6">
              <h1 className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>유통사 관리</h1>
              <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>유통사 정보를 추가하고 관리합니다</p>
            </div>

            {/* 유통사 추가 */}
            <div className={`rounded-xl p-4 sm:p-6 ${isDark ? 'bg-[#0a0a0a] border border-white/10' : 'bg-white border border-gray-100'}`}>
              <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>유통사 추가</h2>
              <form onSubmit={handleAddDistributor} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="유통사명"
                  value={newDistributor.name}
                  onChange={(e) => setNewDistributor({ ...newDistributor, name: e.target.value })}
                  className={`flex-1 px-4 py-3 rounded-lg outline-none transition-all ${isDark ? 'bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500' : 'border border-gray-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'}`}
                  required
                />
                <input
                  type="text"
                  placeholder="코드"
                  value={newDistributor.code}
                  onChange={(e) => setNewDistributor({ ...newDistributor, code: e.target.value })}
                  className={`w-full sm:w-32 px-4 py-3 rounded-lg outline-none transition-all ${isDark ? 'bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500' : 'border border-gray-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'}`}
                  required
                />
                <input
                  type="number"
                  placeholder="수수료%"
                  value={newDistributor.commissionRate}
                  onChange={(e) => setNewDistributor({ ...newDistributor, commissionRate: Number(e.target.value) })}
                  className={`w-full sm:w-28 px-4 py-3 rounded-lg outline-none transition-all ${isDark ? 'bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500' : 'border border-gray-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'}`}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>추가</span>
                </button>
              </form>
            </div>

            {/* 유통사 목록 */}
            <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-[#0a0a0a] border border-white/10' : 'bg-white border border-gray-100'}`}>
              <div className={`p-4 sm:p-6 border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>유통사 목록</h2>
              </div>

              {/* 모바일 카드 뷰 */}
              <div className={`sm:hidden divide-y ${isDark ? 'divide-white/10' : 'divide-gray-100'}`}>
                {distributors.length === 0 ? (
                  <div className={`p-8 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>등록된 유통사가 없습니다.</div>
                ) : (
                  distributors.map((dist) => (
                    <div key={dist.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{dist.name}</p>
                          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>코드: {dist.code}</p>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>수수료: {dist.commission_rate}%</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                            dist.is_active
                              ? isDark ? 'bg-emerald-900/50 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                              : isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {dist.is_active ? '활성' : '비활성'}
                          </span>
                          {dist.is_active && (
                            <button
                              onClick={() => handleDeleteDistributor(dist.id)}
                              className={`p-2 text-red-500 rounded-lg transition-colors ${isDark ? 'hover:bg-red-900/30' : 'hover:bg-red-50'}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* 데스크톱 테이블 뷰 */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className={isDark ? 'bg-white/5' : 'bg-gray-50'}>
                    <tr>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>유통사명</th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>코드</th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>수수료</th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>상태</th>
                      <th className={`px-6 py-3 text-right text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>작업</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-white/10' : 'divide-gray-100'}`}>
                    {distributors.length === 0 ? (
                      <tr>
                        <td colSpan={5} className={`px-6 py-12 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          등록된 유통사가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      distributors.map((dist) => (
                        <tr key={dist.id} className={isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}>
                          <td className={`px-6 py-4 text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{dist.name}</td>
                          <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{dist.code}</td>
                          <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{dist.commission_rate}%</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                              dist.is_active
                                ? isDark ? 'bg-emerald-900/50 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                                : isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {dist.is_active ? '활성' : '비활성'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {dist.is_active && (
                              <button
                                onClick={() => handleDeleteDistributor(dist.id)}
                                className="text-red-500 hover:text-red-700 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* 시스템 정보 */}
        {activeTab === 'system' && (
          <motion.div
            key="system"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-4 sm:p-6 lg:p-8"
          >
            <div className="mb-4 sm:mb-6">
              <h1 className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>시스템 정보</h1>
              <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>시스템 현황 및 통계를 확인합니다</p>
            </div>

            <div className={`rounded-xl p-4 sm:p-6 ${isDark ? 'bg-[#0a0a0a] border border-white/10' : 'bg-white border border-gray-100'}`}>
              {systemInfo ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                    <div className={`rounded-xl p-4 ${isDark ? 'bg-emerald-900/30' : 'bg-emerald-50'}`}>
                      <p className={`text-xs sm:text-sm font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>전체 사용자</p>
                      <p className={`text-xl sm:text-2xl font-bold mt-1 ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>{systemInfo.stats?.total_users || 0}</p>
                    </div>
                    <div className={`rounded-xl p-4 ${isDark ? 'bg-indigo-900/30' : 'bg-indigo-50'}`}>
                      <p className={`text-xs sm:text-sm font-medium ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>파트너</p>
                      <p className={`text-xl sm:text-2xl font-bold mt-1 ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>{systemInfo.stats?.total_partners || 0}</p>
                    </div>
                    <div className={`rounded-xl p-4 ${isDark ? 'bg-purple-900/30' : 'bg-purple-50'}`}>
                      <p className={`text-xs sm:text-sm font-medium ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>음원</p>
                      <p className={`text-xl sm:text-2xl font-bold mt-1 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>{systemInfo.stats?.total_tracks || 0}</p>
                    </div>
                    <div className={`rounded-xl p-4 ${isDark ? 'bg-amber-900/30' : 'bg-amber-50'}`}>
                      <p className={`text-xs sm:text-sm font-medium ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>대기 초대</p>
                      <p className={`text-xl sm:text-2xl font-bold mt-1 ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>{systemInfo.stats?.pending_invitations || 0}</p>
                    </div>
                    <div className={`rounded-xl p-4 ${isDark ? 'bg-rose-900/30' : 'bg-rose-50'}`}>
                      <p className={`text-xs sm:text-sm font-medium ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>파트너 초대</p>
                      <p className={`text-xl sm:text-2xl font-bold mt-1 ${isDark ? 'text-rose-300' : 'text-rose-700'}`}>{systemInfo.stats?.pending_partner_invitations || 0}</p>
                    </div>
                  </div>

                  <div className={`mt-6 pt-6 border-t ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                    <h3 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>시스템 상태</h3>
                    <div className={`rounded-lg p-4 space-y-2 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                      <div className="flex justify-between text-sm">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>버전</span>
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{systemInfo?.version || '1.0.0'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>환경</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isDark ? 'bg-emerald-900/50 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                          {systemInfo?.environment || 'production'}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </MobileLayout>
  );
}
