import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { settingsAPI } from '../services/settingsApi';
import { MobileLayout, MenuItem, QuickLink } from '../components/layout/MobileLayout';
import { AnimatePresence, motion } from 'framer-motion';
import {
  User,
  Lock,
  Settings,
  Film,
  Music2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

type Tab = 'profile' | 'password';

const menuItems: MenuItem[] = [
  { id: 'profile', label: '프로필', icon: User },
  { id: 'password', label: '비밀번호 변경', icon: Lock },
];

const quickLinks: QuickLink[] = [
  { label: '웹툰 프로젝트', path: '/partner/dashboard', icon: Film },
  { label: '내 트랙', path: '/partner/dashboard?tab=tracks', icon: Music2 },
  { label: '설정', path: '/partner/settings', icon: Settings },
];

export default function PartnerSettingsPage() {
  const { user, setAuth, accessToken, refreshToken } = useAuthStore();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 프로필 폼
  const [name, setName] = useState(user?.name || '');

  // 비밀번호 폼
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
    }
  }, [user]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // 프로필 업데이트
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showMessage('error', '이름을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const response = await settingsAPI.updateProfile(name);
      if (user && accessToken && refreshToken) {
        setAuth({ ...user, name: response.data.user.name }, accessToken, refreshToken);
      }
      showMessage('success', '프로필이 업데이트되었습니다.');
    } catch (error: any) {
      showMessage('error', error.response?.data?.error || '프로필 업데이트에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 비밀번호 변경
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      showMessage('error', '모든 필드를 입력해주세요.');
      return;
    }

    if (newPassword.length < 6) {
      showMessage('error', '새 비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage('error', '새 비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    try {
      await settingsAPI.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showMessage('success', '비밀번호가 변경되었습니다.');
    } catch (error: any) {
      showMessage('error', error.response?.data?.error || '비밀번호 변경에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileLayout
      title="설정"
      subtitle="파트너 설정"
      menuItems={menuItems}
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as Tab)}
      quickLinks={quickLinks}
      logoImage="/images/wordmark_B.png"
      logoImageDark="/images/wordmark_W.png"
      logoTypeImage="/images/typelogo_B.png"
      logoTypeImageDark="/images/typelogo_W.png"
    >
      <div className={isDark ? "bg-black min-h-full" : "bg-white min-h-full"}>
        {/* 알림 메시지 */}
        {message && (
          <div className={`mx-4 mt-4 p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success'
              ? (isDark ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-green-50 text-green-700 border border-green-200')
              : (isDark ? 'bg-red-900/30 text-red-400 border border-red-800' : 'bg-red-50 text-red-700 border border-red-200')
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
          {/* 프로필 탭 */}
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4 md:p-6"
            >
              <div className="max-w-xl">
                <div className="mb-6">
                  <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>프로필 정보</h2>
                  <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    기본 프로필 정보를 수정합니다.
                  </p>
                </div>

                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  {/* 이메일 (읽기 전용) */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      이메일
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className={`w-full px-4 py-3 rounded-lg cursor-not-allowed ${
                        isDark
                          ? 'bg-white/5 border border-white/10 text-gray-400'
                          : 'bg-gray-100 border border-gray-200 text-gray-500'
                      }`}
                    />
                    <p className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      이메일은 변경할 수 없습니다.
                    </p>
                  </div>

                  {/* 이름 */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      이름
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="이름을 입력하세요"
                      className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                        isDark
                          ? 'bg-white/5 border border-white/10 text-white placeholder-gray-500'
                          : 'border border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>

                  {/* 역할 */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      역할
                    </label>
                    <div className={`px-4 py-3 rounded-lg ${isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'}`}>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        isDark ? 'bg-emerald-900/50 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        파트너
                      </span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? '저장 중...' : '변경사항 저장'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* 비밀번호 변경 탭 */}
          {activeTab === 'password' && (
            <motion.div
              key="password"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4 md:p-6"
            >
              <div className="max-w-xl">
                <div className="mb-6">
                  <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>비밀번호 변경</h2>
                  <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    계정 보안을 위해 정기적으로 비밀번호를 변경하세요.
                  </p>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-6">
                  {/* 현재 비밀번호 */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      현재 비밀번호
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="현재 비밀번호를 입력하세요"
                        className={`w-full px-4 py-3 pr-12 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                          isDark
                            ? 'bg-white/5 border border-white/10 text-white placeholder-gray-500'
                            : 'border border-gray-300 text-gray-900'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* 새 비밀번호 */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      새 비밀번호
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="새 비밀번호를 입력하세요"
                        className={`w-full px-4 py-3 pr-12 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                          isDark
                            ? 'bg-white/5 border border-white/10 text-white placeholder-gray-500'
                            : 'border border-gray-300 text-gray-900'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      6자 이상 입력하세요.
                    </p>
                  </div>

                  {/* 비밀번호 확인 */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      새 비밀번호 확인
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="새 비밀번호를 다시 입력하세요"
                        className={`w-full px-4 py-3 pr-12 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                          isDark
                            ? 'bg-white/5 border border-white/10 text-white placeholder-gray-500'
                            : 'border border-gray-300 text-gray-900'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="mt-1 text-xs text-red-500">비밀번호가 일치하지 않습니다.</p>
                    )}
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading || !!(confirmPassword && newPassword !== confirmPassword)}
                      className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? '변경 중...' : '비밀번호 변경'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MobileLayout>
  );
}
