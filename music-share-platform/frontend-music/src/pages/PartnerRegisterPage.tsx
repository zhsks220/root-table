import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { partnerAPI } from '../services/partnerApi';
import { useThemeStore } from '../store/themeStore';
import { Loader2, CheckCircle, AlertCircle, Building2, User, Music, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface InvitationData {
  partnerType: string;
  businessName: string;
  email: string;
  phone: string;
  defaultShareRate: number;
}

export default function PartnerRegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const codeFromUrl = searchParams.get('code') || '';
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const [step, setStep] = useState<'verify' | 'register'>('verify');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitationCode, setInvitationCode] = useState(codeFromUrl);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    name: '',
    phone: '',
    businessName: '',
    businessNumber: '',
    representativeName: '',
    address: '',
    bankName: '',
    bankAccount: '',
    bankHolder: '',
  });

  // URL에 코드가 있으면 자동 확인
  useEffect(() => {
    if (codeFromUrl) {
      handleVerifyCode();
    }
  }, []);

  const handleVerifyCode = async () => {
    if (!invitationCode.trim()) {
      setError('초대 코드를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await partnerAPI.verifyInvitation(invitationCode);
      if (response.data.valid) {
        setInvitation(response.data.invitation);
        setFormData(prev => ({
          ...prev,
          email: response.data.invitation.email || '',
          phone: response.data.invitation.phone || '',
          businessName: response.data.invitation.businessName || '',
        }));
        setStep('register');
      } else {
        setError('유효하지 않은 초대 코드입니다.');
      }
    } catch (err: any) {
      console.error('Failed to verify invitation:', err);
      setError(err.response?.data?.error || '초대 코드 확인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (formData.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await partnerAPI.register({
        invitationCode,
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone || undefined,
        businessName: formData.businessName || undefined,
        businessNumber: formData.businessNumber || undefined,
        representativeName: formData.representativeName || undefined,
        address: formData.address || undefined,
        bankName: formData.bankName || undefined,
        bankAccount: formData.bankAccount || undefined,
        bankHolder: formData.bankHolder || undefined,
      });

      alert('파트너 등록이 완료되었습니다. 로그인해주세요.');
      navigate('/partner/login');
    } catch (err: any) {
      console.error('Failed to register:', err);
      setError(err.response?.data?.error || '등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getPartnerTypeInfo = (type: string) => {
    switch (type) {
      case 'artist':
        return { name: '아티스트', icon: Music, color: 'purple' };
      case 'company':
        return { name: '기획사', icon: Building2, color: 'blue' };
      case 'composer':
        return { name: '작곡가', icon: Music, color: 'amber' };
      default:
        return { name: type, icon: User, color: 'gray' };
    }
  };

  return (
    <div className={`min-h-[100dvh] flex flex-col items-center justify-center px-4 py-8 sm:p-4 ${isDark ? 'bg-black' : 'bg-[#fbfbfb]'}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* 헤더 */}
        <div className="text-center mb-6 sm:mb-8">
          <img
            src={isDark ? "/images/typelogo_W.png" : "/images/typelogo_B.png"}
            alt="ROUTELABEL"
            className="h-10 sm:h-12 mx-auto mb-4 sm:mb-6 object-contain"
          />
          <h1 className={`text-xl sm:text-2xl font-bold tracking-tight mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            파트너 등록
          </h1>
          <p className={`text-sm px-4 sm:px-0 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            루트레이블 파트너로 등록하세요
          </p>
        </div>

        <div className={`rounded-2xl p-6 sm:p-8 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white shadow-xl'}`}>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${isDark ? 'bg-red-900/30 border border-red-900/50' : 'bg-red-50'}`}
            >
              <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
              <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
            </motion.div>
          )}

          {step === 'verify' ? (
            // 초대 코드 확인 단계
            <div className="space-y-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  초대 코드
                </label>
                <input
                  type="text"
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX-XXXX"
                  className={`w-full px-4 py-3.5 sm:py-3 border rounded-xl text-base sm:text-sm font-mono text-center tracking-wider focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all ${
                    isDark
                      ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-500'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400'
                  }`}
                />
                <p className={`mt-2 text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  관리자로부터 받은 초대 코드를 입력하세요
                </p>
              </div>

              <button
                onClick={handleVerifyCode}
                disabled={loading || !invitationCode.trim()}
                className={cn(
                  "w-full font-medium py-3.5 sm:py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] text-base sm:text-sm",
                  isDark
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
                    : "bg-gray-900 hover:bg-black text-white shadow-gray-900/10",
                  (loading || !invitationCode.trim()) && "opacity-50 cursor-not-allowed"
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    확인 중...
                  </>
                ) : (
                  <>
                    코드 확인
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <div className="text-center">
                <button
                  onClick={() => navigate('/partner/login')}
                  className="text-sm text-emerald-500 hover:text-emerald-600 transition-colors"
                >
                  이미 계정이 있으신가요? 로그인
                </button>
              </div>
            </div>
          ) : (
            // 등록 폼 단계
            <form onSubmit={handleRegister} className="space-y-6">
              {/* 파트너 타입 표시 */}
              {invitation && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${
                  isDark ? 'bg-emerald-900/30 border border-emerald-900/50' : 'bg-emerald-50'
                }`}>
                  <CheckCircle className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-500'}`} />
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {getPartnerTypeInfo(invitation.partnerType).name}로 등록
                    </p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      기본 정산율: {invitation.defaultShareRate}%
                    </p>
                  </div>
                </div>
              )}

              {/* 계정 정보 */}
              <div className="space-y-4">
                <h3 className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>계정 정보</h3>

                <div>
                  <label className={`block text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>이메일 *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all ${
                      isDark
                        ? 'bg-white/5 border-white/10 text-white'
                        : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>이름 *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all ${
                      isDark
                        ? 'bg-white/5 border-white/10 text-white'
                        : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>비밀번호 *</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="6자 이상"
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all ${
                      isDark
                        ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-500'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>비밀번호 확인 *</label>
                  <input
                    type="password"
                    required
                    value={formData.passwordConfirm}
                    onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all ${
                      isDark
                        ? 'bg-white/5 border-white/10 text-white'
                        : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              {/* 사업자 정보 */}
              <div className="space-y-4">
                <h3 className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>사업자 정보 (선택)</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>상호/사업자명</label>
                    <input
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all ${
                        isDark
                          ? 'bg-white/5 border-white/10 text-white'
                          : 'bg-gray-50 border-gray-200 text-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>대표자명</label>
                    <input
                      type="text"
                      value={formData.representativeName}
                      onChange={(e) => setFormData({ ...formData, representativeName: e.target.value })}
                      className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all ${
                        isDark
                          ? 'bg-white/5 border-white/10 text-white'
                          : 'bg-gray-50 border-gray-200 text-gray-900'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>사업자등록번호</label>
                  <input
                    type="text"
                    value={formData.businessNumber}
                    onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })}
                    placeholder="000-00-00000"
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all ${
                      isDark
                        ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-500'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>연락처</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="010-0000-0000"
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all ${
                      isDark
                        ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-500'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400'
                    }`}
                  />
                </div>
              </div>

              {/* 정산 계좌 정보 */}
              <div className="space-y-4">
                <h3 className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>정산 계좌 정보 (선택)</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>은행</label>
                    <select
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all ${
                        isDark
                          ? 'bg-white/5 border-white/10 text-white'
                          : 'bg-gray-50 border-gray-200 text-gray-900'
                      }`}
                    >
                      <option value="">선택</option>
                      <option value="KB국민은행">KB국민은행</option>
                      <option value="신한은행">신한은행</option>
                      <option value="우리은행">우리은행</option>
                      <option value="하나은행">하나은행</option>
                      <option value="NH농협">NH농협</option>
                      <option value="기업은행">기업은행</option>
                      <option value="카카오뱅크">카카오뱅크</option>
                      <option value="토스뱅크">토스뱅크</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>예금주</label>
                    <input
                      type="text"
                      value={formData.bankHolder}
                      onChange={(e) => setFormData({ ...formData, bankHolder: e.target.value })}
                      className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all ${
                        isDark
                          ? 'bg-white/5 border-white/10 text-white'
                          : 'bg-gray-50 border-gray-200 text-gray-900'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>계좌번호</label>
                  <input
                    type="text"
                    value={formData.bankAccount}
                    onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                    placeholder="'-' 없이 입력"
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all ${
                      isDark
                        ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-500'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400'
                    }`}
                  />
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStep('verify')}
                  className={`flex-1 px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors ${
                    isDark
                      ? 'bg-white/10 text-gray-300 hover:bg-white/20'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  이전
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    "flex-1 font-medium py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
                    isDark
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
                      : "bg-gray-900 hover:bg-black text-white shadow-gray-900/10",
                    loading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      등록 중...
                    </>
                  ) : (
                    <>
                      파트너 등록
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>

      {/* 모바일 하단 safe area */}
      <div className="h-[env(safe-area-inset-bottom)] sm:hidden" />
    </div>
  );
}
