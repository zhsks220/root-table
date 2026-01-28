import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { Loader2, AlertCircle, ArrowRight, Eye, EyeOff, Music } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { partnerAPI } from '../services/partnerApi';
import { invitationAPI } from '../services/api';

export default function PartnerLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isLoading, error: authError, isAuthenticated, user } = useAuthStore();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 초대 코드 관련 상태
  const inviteCode = searchParams.get('invite');
  const [inviteInfo, setInviteInfo] = useState<{ trackCount: number } | null>(null);
  const [acceptingInvite, setAcceptingInvite] = useState(false);

  // 이미 로그인된 경우 처리
  useEffect(() => {
    if (isAuthenticated && user?.role === 'partner') {
      // 초대 코드가 있으면 트랙 할당 후 대시보드로
      if (inviteCode) {
        setAcceptingInvite(true);
        partnerAPI.acceptInvitation(inviteCode)
          .then(() => {
            navigate('/partner/dashboard');
          })
          .catch(() => {
            // 실패해도 대시보드로 이동
            navigate('/partner/dashboard');
          });
      } else {
        // 초대 코드 없으면 바로 대시보드로
        navigate('/partner/dashboard');
      }
    } else if (isAuthenticated && user?.role === 'admin') {
      navigate('/admin');
    }
  }, [isAuthenticated, user, inviteCode, navigate]);

  // 초대 코드가 있으면 정보 조회
  useEffect(() => {
    if (inviteCode && !isAuthenticated) {
      invitationAPI.verify(inviteCode)
        .then((response) => {
          if (response.data.valid) {
            setInviteInfo({ trackCount: response.data.trackCount });
          }
        })
        .catch(() => {
          // 무시 - 초대 코드가 유효하지 않아도 로그인은 가능
        });
    }
  }, [inviteCode, isAuthenticated]);

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
        // 초대 코드가 있으면 트랙 할당
        if (inviteCode) {
          setAcceptingInvite(true);
          try {
            await partnerAPI.acceptInvitation(inviteCode);
          } catch {
            // 할당 실패해도 로그인은 성공했으므로 계속 진행
          }
          setAcceptingInvite(false);
        }

        // 공유 링크에서 왔으면 해당 페이지로 복귀
        const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
        if (redirectUrl) {
          sessionStorage.removeItem('redirectAfterLogin');
          navigate(redirectUrl);
        } else {
          navigate('/partner/dashboard');
        }
      } else if (user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err: any) {
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
            {inviteInfo
              ? '로그인하면 초대받은 음원이 자동으로 할당됩니다'
              : '루트레이블 파트너 대시보드에 접속하세요'}
          </p>
        </div>

        {/* 초대 정보 표시 */}
        {inviteInfo && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-4 p-4 rounded-xl border flex items-center gap-3 ${
              isDark
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-emerald-50 border-emerald-100 text-emerald-700'
            }`}
          >
            <Music className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">
              <strong>{inviteInfo.trackCount}개의 음원</strong>이 준비되어 있습니다
            </span>
          </motion.div>
        )}

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
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3.5 sm:py-3 border rounded-xl text-base sm:text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all ${
                  isDark
                    ? 'bg-white/5 border-white/10 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
                placeholder="사용자명 또는 이메일"
                autoComplete="username"
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
            disabled={isLoading || acceptingInvite}
            className={cn(
              "w-full font-medium py-3.5 sm:py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] text-base sm:text-sm",
              isDark
                ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
                : "bg-gray-900 hover:bg-black text-white shadow-gray-900/10",
              (isLoading || acceptingInvite) && "opacity-80 disabled:cursor-not-allowed"
            )}
          >
            {isLoading || acceptingInvite ? (
              <Loader2 className="w-5 h-5 sm:w-4 sm:h-4 animate-spin" />
            ) : (
              <>
                {inviteCode ? '로그인 및 음원 받기' : '로그인'}
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
