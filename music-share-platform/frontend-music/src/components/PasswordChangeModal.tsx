import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, Check, X, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

interface PasswordChangeModalProps {
  isOpen: boolean;
  onSuccess: () => void;
}

// 비밀번호 정책 체크 (6자 이상 + 영어/숫자 조합)
const checkPasswordPolicy = (password: string) => ({
  minLength: password.length >= 6,
  hasLetter: /[a-zA-Z]/.test(password),
  hasNumber: /[0-9]/.test(password),
});

export default function PasswordChangeModal({ isOpen, onSuccess }: PasswordChangeModalProps) {
  const { clearForcePasswordChange } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const policy = checkPasswordPolicy(newPassword);
  const allPolicyMet = Object.values(policy).every(Boolean);
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;
  const canSubmit = currentPassword && allPolicyMet && passwordsMatch && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError(null);

    try {
      await authAPI.changePassword(currentPassword, newPassword);
      clearForcePasswordChange();
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || '비밀번호 변경에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const PolicyItem = ({ met, text }: { met: boolean; text: string }) => (
    <div className={cn(
      "flex items-center gap-2 text-sm transition-colors",
      met ? "text-emerald-400" : "text-white/40"
    )}>
      {met ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
      {text}
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-md mx-4 rounded-2xl bg-gray-900 border border-gray-800 p-6 shadow-2xl"
          >
            {/* 헤더 */}
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-yellow-500/20">
                <Lock className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">비밀번호 변경 필요</h2>
                <p className="text-white/50 text-sm">보안을 위해 비밀번호를 변경해주세요</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 현재 비밀번호 */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  현재 비밀번호
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="현재 비밀번호 입력"
                    className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white/70 transition-colors"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* 새 비밀번호 */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  새 비밀번호
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="새 비밀번호 입력"
                    className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white/70 transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* 비밀번호 정책 */}
                {newPassword.length > 0 && !allPolicyMet && (
                  <div className="mt-3 p-3 rounded-lg bg-white/5 space-y-1.5">
                    <PolicyItem met={policy.minLength} text="6자 이상" />
                    <PolicyItem met={policy.hasLetter} text="영문자 포함" />
                    <PolicyItem met={policy.hasNumber} text="숫자 포함" />
                  </div>
                )}
              </div>

              {/* 비밀번호 확인 */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  새 비밀번호 확인
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="새 비밀번호 다시 입력"
                    className={cn(
                      "w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border text-white placeholder:text-white/30 focus:outline-none transition-all",
                      confirmPassword.length > 0
                        ? passwordsMatch
                          ? "border-emerald-500/50"
                          : "border-red-500/50"
                        : "border-white/10 focus:border-emerald-500/50"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white/70 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    비밀번호가 일치하지 않습니다
                  </p>
                )}
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* 제출 버튼 */}
              <button
                type="submit"
                disabled={!canSubmit}
                className={cn(
                  "w-full py-3 rounded-xl font-medium transition-all",
                  canSubmit
                    ? "bg-emerald-500 text-white hover:bg-emerald-600"
                    : "bg-white/10 text-white/40 cursor-not-allowed"
                )}
              >
                {loading ? '변경 중...' : '비밀번호 변경'}
              </button>
            </form>

            {/* 안내 문구 */}
            <p className="mt-4 text-center text-xs text-white/30">
              첫 로그인 시 보안을 위해 비밀번호 변경이 필요합니다
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
