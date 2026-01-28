import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { authAPI } from '../services/api';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils';

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const setAuth = useAuthStore((state) => state.setAuth);

  // 이미 로그인된 경우 역할에 맞는 대시보드로 이동
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (user.role === 'developer') {
        navigate('/admin/monitoring', { replace: true });
      } else if (user.role === 'partner') {
        navigate('/partner/dashboard', { replace: true });
      } else {
        navigate('/my-tracks', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(email, password);
      const { user, accessToken, refreshToken } = response.data;
      setAuth(user, accessToken, refreshToken, rememberMe);

      // 사용자 역할에 따라 적절한 페이지로 이동
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'developer') {
        navigate('/admin/monitoring');
      } else if (user.role === 'partner') {
        navigate('/partner/dashboard');
      } else {
        navigate('/my-tracks');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || '로그인에 실패했습니다. 로그인 정보를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-[100dvh] flex flex-col items-center justify-center px-4 py-8 sm:p-4 ${isDark ? 'bg-black' : 'bg-[#fbfbfb]'}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        {/* 로고 및 헤더 */}
        <div className="text-center mb-6 sm:mb-8">
          <img
            src={isDark ? "/images/typelogo_W.png" : "/images/typelogo_B.png"}
            alt="ROUTELABEL"
            className="h-20 sm:h-24 mx-auto mb-4 sm:mb-6 object-contain"
          />
          <h1 className={`text-xl sm:text-2xl font-bold tracking-tight mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            다시 오신 것을 환영합니다
          </h1>
          <p className={`text-sm px-4 sm:px-0 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            워크스페이스에 접속하려면 로그인 정보를 입력하세요
          </p>
        </div>

        {/* 로그인 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3 sm:space-y-4">
            {/* 이메일/사용자명 입력 */}
            <div>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3.5 sm:py-3 border rounded-xl text-base sm:text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all ${
                  isDark
                    ? 'bg-white/5 border-white/10 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                placeholder="이메일 또는 사용자명"
                autoComplete="username"
              />
            </div>

            {/* 비밀번호 입력 */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3.5 sm:py-3 pr-12 border rounded-xl text-base sm:text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all ${
                  isDark
                    ? 'bg-white/5 border-white/10 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                placeholder="비밀번호"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* 로그인 상태 유지 체크박스 */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500/20 cursor-pointer"
            />
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              로그인 상태 유지
            </span>
          </label>

          {/* 에러 메시지 */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className={`text-sm px-4 py-3 rounded-lg border ${isDark ? 'text-red-400 bg-red-900/30 border-red-900/50' : 'text-red-500 bg-red-50 border-red-100'}`}
            >
              {error}
            </motion.div>
          )}

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={loading}
            className={cn(
              "w-full font-medium py-3.5 sm:py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] text-base sm:text-sm",
              isDark
                ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
                : "bg-gray-900 hover:bg-black text-white shadow-gray-900/10",
              loading && "opacity-80 disabled:cursor-not-allowed"
            )}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 sm:w-4 sm:h-4 animate-spin" />
            ) : (
              <>
                로그인
                <ArrowRight className="w-5 h-5 sm:w-4 sm:h-4" />
              </>
            )}
          </button>
        </form>

        {/* 푸터 정보 */}
        <div className="mt-6 sm:mt-8 text-center space-y-3 sm:space-y-4">
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            내부 음악 공유 플랫폼 • v1.0.0
          </p>

        </div>
      </motion.div>

      {/* 모바일 하단 safe area */}
      <div className="h-[env(safe-area-inset-bottom)] sm:hidden" />
    </div>
  );
}
