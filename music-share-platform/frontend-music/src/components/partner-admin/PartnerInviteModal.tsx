import { useState } from 'react';
import { partnerAdminAPI } from '../../services/partnerAdminApi';
import { X, Copy, Check, Loader2, UserPlus } from 'lucide-react';

interface PartnerInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function PartnerInviteModal({ isOpen, onClose, onComplete }: PartnerInviteModalProps) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

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
    onClose();
    if (generatedCode) {
      onComplete();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">파트너 초대</h2>
              <p className="text-sm text-gray-500">새로운 파트너를 초대합니다</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 내용 */}
        <div className="p-6">
          {generatedCode ? (
            // 초대코드 생성 완료
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">초대 링크가 생성되었습니다</h3>
              <p className="text-sm text-gray-500 mb-6">아래 링크를 파트너에게 전달하세요</p>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-xs text-gray-500 mb-2">초대 코드</p>
                <code className="text-lg font-mono font-bold text-emerald-600">{generatedCode}</code>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-xs text-gray-500 mb-2">초대 링크</p>
                <p className="text-sm text-gray-700 break-all">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type === 'artist' ? '아티스트' : type === 'company' ? '기획사' : '작곡가'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 이름/사업자명 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이름 / 사업자명
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder="예: 홍길동 / (주)뮤직컴퍼니"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* 이메일 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이메일
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="partner@example.com"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* 연락처 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  연락처
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="010-1234-5678"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* 기본 정산율 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  기본 정산율 (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.defaultShareRate}
                  onChange={(e) => setFormData({ ...formData, defaultShareRate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">파트너가 받을 정산 비율입니다</p>
              </div>

              {/* 유효기간 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  초대 유효기간
                </label>
                <select
                  value={formData.expiresInDays}
                  onChange={(e) => setFormData({ ...formData, expiresInDays: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value={7}>7일</option>
                  <option value={14}>14일</option>
                  <option value={30}>30일</option>
                  <option value={60}>60일</option>
                  <option value={90}>90일</option>
                </select>
              </div>

              {/* 메모 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  메모 (선택)
                </label>
                <textarea
                  value={formData.memo}
                  onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                  placeholder="내부 참고용 메모"
                  rows={2}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                />
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
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
