import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { authAPI } from '../services/api';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils';

export default function RegisterPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) {
      setError('초대 코드가 유효하지 않습니다.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await authAPI.register(
        formData.email,
        formData.password,
        formData.name,
        code
      );
      const { user, token } = response.data;
      setAuth(user, token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-[100dvh] flex flex-col items-center justify-center px-4 py-8 sm:p-4 ${isDark ? 'bg-black' : 'bg-[#fbfbfb]'}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
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
            계정 생성
          </h1>
          <p className={`text-sm px-4 sm:px-0 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            음원을 다운로드하려면 계정을 생성하세요
          </p>
        </div>

        {/* 회원가입 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3 sm:space-y-4">
            {/* 이메일 입력 */}
            <div>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                required
                minLength={8}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`w-full px-4 py-3.5 sm:py-3 pr-12 border rounded-xl text-base sm:text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all ${
                  isDark
                    ? 'bg-white/5 border-white/10 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                placeholder="비밀번호 (8자 이상)"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* 이름 입력 */}
            <div>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-4 py-3.5 sm:py-3 border rounded-xl text-base sm:text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all ${
                  isDark
                    ? 'bg-white/5 border-white/10 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                placeholder="이름"
                autoComplete="name"
              />
            </div>
          </div>

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

          {/* 가입 버튼 */}
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
                가입하기
                <ArrowRight className="w-5 h-5 sm:w-4 sm:h-4" />
              </>
            )}
          </button>
        </form>

        {/* 로그인 링크 */}
        <div className="mt-6 sm:mt-8 text-center">
          <button
            onClick={() => navigate('/login')}
            className={`text-sm font-medium transition-colors py-2 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
          >
            이미 계정이 있으신가요? <span className="text-emerald-500">로그인</span>
          </button>
        </div>
      </motion.div>

      {/* 모바일 하단 safe area */}
      <div className="h-[env(safe-area-inset-bottom)] sm:hidden" />
    </div>
  );
}
