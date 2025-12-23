import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authAPI } from '../services/api';
import { motion } from 'framer-motion';
import { Music, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(email, password);
      const { user, token } = response.data;
      setAuth(user, token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || '로그인에 실패했습니다. 로그인 정보를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#fbfbfb] flex flex-col items-center justify-center px-4 py-8 sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        {/* 로고 및 헤더 */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-14 h-14 sm:w-12 sm:h-12 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-xl shadow-emerald-500/20">
            <Music className="w-7 h-7 sm:w-6 sm:h-6 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-2">
            다시 오신 것을 환영합니다
          </h1>
          <p className="text-gray-500 text-sm px-4 sm:px-0">
            워크스페이스에 접속하려면 로그인 정보를 입력하세요
          </p>
        </div>

        {/* 로그인 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3 sm:space-y-4">
            {/* 이메일 입력 */}
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 sm:py-3 bg-white border border-gray-200 rounded-xl text-base sm:text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                placeholder="이메일 주소"
                autoComplete="email"
                inputMode="email"
              />
            </div>

            {/* 비밀번호 입력 */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 sm:py-3 pr-12 bg-white border border-gray-200 rounded-xl text-base sm:text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                placeholder="비밀번호"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-lg border border-red-100"
            >
              {error}
            </motion.div>
          )}

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={loading}
            className={cn(
              "w-full bg-gray-900 hover:bg-black text-white font-medium py-3.5 sm:py-3 rounded-xl shadow-lg shadow-gray-900/10 flex items-center justify-center gap-2 transition-all active:scale-[0.98] text-base sm:text-sm",
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
          <p className="text-xs text-gray-400">
            내부 음악 공유 플랫폼 • v1.0.0
          </p>

          {/* 테스트 계정 정보 */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
            <span className="text-xs font-semibold text-gray-500 block mb-1">테스트 계정</span>
            <code className="text-xs text-gray-400 font-mono break-all">admin@test.com / admin123</code>
          </div>
        </div>
      </motion.div>

      {/* 모바일 하단 safe area */}
      <div className="h-[env(safe-area-inset-bottom)] sm:hidden" />
    </div>
  );
}
