import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { Loader2, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

export default function PartnerLoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error: authError } = useAuthStore();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    try {
      await login(email, password);
      // 로그인 성공 후 역할에 따라 리다이렉트
      const user = useAuthStore.getState().user;
      if (user?.role === 'partner') {
        // 공유 링크에서 왔으면 해당 페이지로 복귀
        const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
        if (redirectUrl) {
          sessionStorage.removeItem('redirectAfterLogin');
          navigate(redirectUrl);
        } else {
          navigate('/partner/dashboard');
        }
      } else if (user?.role === 'admin') {
        navigate('/cms');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err.response?.data?.error || '로그인에 실패했습니다.');
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
            className="h-10 sm:h-12 mx-auto mb-4 sm:mb-6 object-contain"
          />
          <h1 className={`text-xl sm:text-2xl font-bold tracking-tight mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            파트너 로그인
          </h1>
          <p className={`text-sm px-4 sm:px-0 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            루트레이블 파트너 대시보드에 접속하세요
          </p>
        </div>

        {/* 에러 메시지 */}
        {(error || authError) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className={`mb-4 text-sm px-4 py-3 rounded-lg border flex items-start gap-3 ${isDark ? 'text-red-400 bg-red-900/30 border-red-900/50' : 'text-red-500 bg-red-50 border-red-100'}`}
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{error || authError}</p>
          </motion.div>
        )}

        {/* 로그인 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3 sm:space-y-4">
            {/* 이메일 입력 */}
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3.5 sm:py-3 border rounded-xl text-base sm:text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all ${
                  isDark
                    ? 'bg-white/5 border-white/10 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                placeholder="이메일 주소"
                autoComplete="email"
                inputMode="email"
              />
            </div>

            {/* 비밀번호 입력 */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
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

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "w-full font-medium py-3.5 sm:py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] text-base sm:text-sm",
              isDark
                ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
                : "bg-gray-900 hover:bg-black text-white shadow-gray-900/10",
              isLoading && "opacity-80 disabled:cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 sm:w-4 sm:h-4 animate-spin" />
            ) : (
              <>
                로그인
                <ArrowRight className="w-5 h-5 sm:w-4 sm:h-4" />
              </>
            )}
          </button>
        </form>

        {/* 푸터 링크 */}
        <div className="mt-6 sm:mt-8 text-center space-y-3 sm:space-y-4">
          <div className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            관리자이신가요?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-emerald-500 hover:text-emerald-600 transition-colors"
            >
              관리자 로그인
            </button>
          </div>

          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            © 2024 루트레이블. All rights reserved.
          </p>
        </div>
      </motion.div>

      {/* 모바일 하단 safe area */}
      <div className="h-[env(safe-area-inset-bottom)] sm:hidden" />
    </div>
  );
}
