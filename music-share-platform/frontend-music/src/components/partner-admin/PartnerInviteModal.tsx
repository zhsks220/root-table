import { useState } from 'react';
import { partnerAdminAPI } from '../../services/partnerAdminApi';
import { X, Copy, Check, Loader2, UserPlus, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useThemeStore } from '../../store/themeStore';

interface PartnerInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function PartnerInviteModal({ isOpen, onClose, onComplete }: PartnerInviteModalProps) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [showExpiresFilter, setShowExpiresFilter] = useState(false);

  const expiresOptions = [
    { value: 7, label: '7일' },
    { value: 14, label: '14일' },
    { value: 30, label: '30일' },
    { value: 60, label: '60일' },
    { value: 90, label: '90일' },
  ];

  const [formData, setFormData] = useState({
    partnerType: 'artist' as 'artist' | 'company' | 'composer',
    businessName: '',
    email: '',
    phone: '',
    defaultShareRate: 50,
    memo: '',
    expiresInDays: 30,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await partnerAdminAPI.createInvitation({
        partnerType: formData.partnerType,
        businessName: formData.businessName || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        defaultShareRate: formData.defaultShareRate,
        memo: formData.memo || undefined,
        expiresInDays: formData.expiresInDays,
      });

      setGeneratedCode(response.data.invitation.invitationCode);
    } catch (err: any) {
      console.error('Failed to create invitation:', err);
      alert('초대 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedCode) return;

    const inviteUrl = `${window.location.origin}/partner/register?code=${generatedCode}`;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setFormData({
      partnerType: 'artist',
      businessName: '',
      email: '',
      phone: '',
      defaultShareRate: 50,
      memo: '',
      expiresInDays: 30,
    });
    setGeneratedCode(null);
    setCopied(false);
    setShowExpiresFilter(false);
    onClose();
    if (generatedCode) {
      onComplete();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`rounded-2xl w-full max-w-lg mx-4 overflow-hidden ${isDark ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
        {/* 헤더 */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-emerald-900/50' : 'bg-emerald-100'}`}>
              <UserPlus className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>파트너 초대</h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>새로운 파트너를 초대합니다</p>
            </div>
          </div>
          <button onClick={handleClose} className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
            <X className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          </button>
        </div>

        {/* 내용 */}
        <div className="p-6">
          {generatedCode ? (
            // 초대코드 생성 완료
            <div className="text-center py-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-emerald-900/50' : 'bg-emerald-100'}`}>
                <Check className={`w-8 h-8 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
              </div>
              <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>초대 링크가 생성되었습니다</h3>
              <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>아래 링크를 파트너에게 전달하세요</p>

              <div className={`rounded-lg p-4 mb-4 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>초대 코드</p>
                <code className={`text-lg font-mono font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{generatedCode}</code>
              </div>

              <div className={`rounded-lg p-4 mb-6 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>초대 링크</p>
                <p className={`text-sm break-all ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {window.location.origin}/partner/register?code={generatedCode}
                </p>
              </div>

              <button
                onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    복사됨
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    링크 복사
                  </>
                )}
              </button>
            </div>
          ) : (
            // 초대 폼
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 파트너 유형 */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  파트너 유형 *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['artist', 'company', 'composer'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, partnerType: type })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.partnerType === type
                          ? 'bg-emerald-500 text-white'
                          : (isDark ? 'bg-white/5 text-gray-300 hover:bg-white/10' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
                      }`}
                    >
                      {type === 'artist' ? '아티스트' : type === 'company' ? '기획사' : '작곡가'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 이름/사업자명 */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  이름 / 사업자명
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder="예: 홍길동 / (주)뮤직컴퍼니"
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                />
              </div>

              {/* 이메일 */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  이메일
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="partner@example.com"
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                />
              </div>

              {/* 연락처 */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  연락처
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="010-1234-5678"
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                />
              </div>

              {/* 기본 정산율 */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  기본 정산율 (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.defaultShareRate}
                  onChange={(e) => setFormData({ ...formData, defaultShareRate: parseFloat(e.target.value) || 0 })}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                />
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>파트너가 받을 정산 비율입니다</p>
              </div>

              {/* 유효기간 */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  초대 유효기간
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowExpiresFilter(!showExpiresFilter)}
                    className={cn(
                      "w-full px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all inline-flex items-center justify-between border",
                      isDark ? "bg-white/5 border-white/10 text-white/70 hover:border-white/20" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                    )}
                  >
                    <span>{expiresOptions.find(o => o.value === formData.expiresInDays)?.label}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {showExpiresFilter && (
                    <div className={cn(
                      "absolute top-full left-0 mt-1 rounded-lg shadow-lg py-1 z-20 w-full",
                      isDark ? "bg-black border border-white/10" : "bg-white border border-gray-200"
                    )}>
                      {expiresOptions.map(option => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, expiresInDays: option.value });
                            setShowExpiresFilter(false);
                          }}
                          className={cn(
                            "w-full px-3 py-2 text-left text-sm transition-colors",
                            formData.expiresInDays === option.value
                              ? isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-50 text-emerald-600"
                              : isDark ? "text-white/70 hover:bg-white/5" : "hover:bg-gray-50"
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 메모 */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  메모 (선택)
                </label>
                <textarea
                  value={formData.memo}
                  onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                  placeholder="내부 참고용 메모"
                  rows={2}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                />
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className={`flex-1 px-4 py-2.5 rounded-lg transition-colors ${isDark ? 'bg-white/5 text-gray-300 hover:bg-white/10' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      생성 중...
                    </>
                  ) : (
                    '초대 생성'
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
