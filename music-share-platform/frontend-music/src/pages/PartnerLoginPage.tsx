import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Loader2, Music2, AlertCircle } from 'lucide-react';

export default function PartnerLoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error: authError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        navigate('/partner/dashboard');
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Music2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">파트너 로그인</h1>
          <p className="text-gray-500 mt-2">루트레이블 파트너 대시보드</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {(error || authError) && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error || authError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이메일
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="partner@example.com"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  로그인 중...
                </>
              ) : (
                '로그인'
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <button
              onClick={() => navigate('/partner/register')}
              className="text-sm text-emerald-600 hover:text-emerald-700"
            >
              초대 코드로 등록하기
            </button>
            <div className="text-sm text-gray-500">
              관리자이신가요?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-emerald-600 hover:text-emerald-700"
              >
                관리자 로그인
              </button>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© 2024 루트레이블. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
