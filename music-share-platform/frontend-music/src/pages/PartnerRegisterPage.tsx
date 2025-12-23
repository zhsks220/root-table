import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { partnerAPI } from '../services/partnerApi';
import { Loader2, CheckCircle, AlertCircle, Music2, Building2, User } from 'lucide-react';

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
        return { name: '아티스트', icon: Music2, color: 'purple' };
      case 'company':
        return { name: '기획사', icon: Building2, color: 'blue' };
      case 'composer':
        return { name: '작곡가', icon: Music2, color: 'amber' };
      default:
        return { name: type, icon: User, color: 'gray' };
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
          <h1 className="text-2xl font-bold text-gray-900">파트너 등록</h1>
          <p className="text-gray-500 mt-2">루트레이블 파트너로 등록하세요</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {step === 'verify' ? (
            // 초대 코드 확인 단계
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  초대 코드
                </label>
                <input
                  type="text"
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX-XXXX"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono text-center text-lg tracking-wider"
                />
                <p className="mt-2 text-sm text-gray-500">
                  관리자로부터 받은 초대 코드를 입력하세요
                </p>
              </div>

              <button
                onClick={handleVerifyCode}
                disabled={loading || !invitationCode.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    확인 중...
                  </>
                ) : (
                  '코드 확인'
                )}
              </button>

              <div className="text-center">
                <button
                  onClick={() => navigate('/partner/login')}
                  className="text-sm text-emerald-600 hover:text-emerald-700"
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
                <div className={`p-4 rounded-xl bg-${getPartnerTypeInfo(invitation.partnerType).color}-50 flex items-center gap-3`}>
                  <CheckCircle className={`w-5 h-5 text-${getPartnerTypeInfo(invitation.partnerType).color}-500`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {getPartnerTypeInfo(invitation.partnerType).name}로 등록
                    </p>
                    <p className="text-xs text-gray-500">
                      기본 정산율: {invitation.defaultShareRate}%
                    </p>
                  </div>
                </div>
              )}

              {/* 계정 정보 */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">계정 정보</h3>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">이메일 *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">이름 *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">비밀번호 *</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="6자 이상"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">비밀번호 확인 *</label>
                  <input
                    type="password"
                    required
                    value={formData.passwordConfirm}
                    onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* 사업자 정보 */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">사업자 정보 (선택)</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">상호/사업자명</label>
                    <input
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">대표자명</label>
                    <input
                      type="text"
                      value={formData.representativeName}
                      onChange={(e) => setFormData({ ...formData, representativeName: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">사업자등록번호</label>
                  <input
                    type="text"
                    value={formData.businessNumber}
                    onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })}
                    placeholder="000-00-00000"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">연락처</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="010-0000-0000"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* 정산 계좌 정보 */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">정산 계좌 정보 (선택)</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">은행</label>
                    <select
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                    <label className="block text-sm text-gray-600 mb-1">예금주</label>
                    <input
                      type="text"
                      value={formData.bankHolder}
                      onChange={(e) => setFormData({ ...formData, bankHolder: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">계좌번호</label>
                  <input
                    type="text"
                    value={formData.bankAccount}
                    onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                    placeholder="'-' 없이 입력"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStep('verify')}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  이전
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      등록 중...
                    </>
                  ) : (
                    '파트너 등록'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
