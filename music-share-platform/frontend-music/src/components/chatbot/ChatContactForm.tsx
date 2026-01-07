import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { ContactFormData } from '../../types/chatbot';

interface ChatContactFormProps {
  onSubmit: (data: ContactFormData) => void;
  disabled?: boolean;
  error?: string | null;
}

export const ChatContactForm = ({
  onSubmit,
  disabled = false,
  error,
}: ChatContactFormProps) => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    organization: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    onSubmit(formData);
  };

  const handleChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isValid = formData.name.trim() && formData.email.trim();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* 이름 */}
        <div>
          <label className="block text-xs text-white/50 mb-1">
            이름/닉네임 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="홍길동"
            disabled={disabled}
            className={`
              w-full px-4 py-3 rounded-xl text-sm
              bg-white/5 border border-white/10 text-white placeholder-white/30
              focus:outline-none focus:ring-2 focus:ring-emerald-500/50
              transition-all duration-200
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          />
        </div>

        {/* 이메일 */}
        <div>
          <label className="block text-xs text-white/50 mb-1">
            이메일 <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="example@email.com"
            disabled={disabled}
            className={`
              w-full px-4 py-3 rounded-xl text-sm
              bg-white/5 border border-white/10 text-white placeholder-white/30
              focus:outline-none focus:ring-2 focus:ring-emerald-500/50
              transition-all duration-200
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          />
        </div>

        {/* 소속 */}
        <div>
          <label className="block text-xs text-white/50 mb-1">
            소속 (선택)
          </label>
          <input
            type="text"
            value={formData.organization}
            onChange={(e) => handleChange('organization', e.target.value)}
            placeholder="회사/플랫폼명"
            disabled={disabled}
            className={`
              w-full px-4 py-3 rounded-xl text-sm
              bg-white/5 border border-white/10 text-white placeholder-white/30
              focus:outline-none focus:ring-2 focus:ring-emerald-500/50
              transition-all duration-200
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          />
        </div>

        {/* 에러 메시지 */}
        {error && (
          <p className="text-red-400 text-xs">{error}</p>
        )}

        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={disabled || !isValid}
          className={`
            w-full flex items-center justify-center gap-2
            px-6 py-3 rounded-xl text-sm font-bold
            transition-all duration-200
            ${
              !disabled && isValid
                ? 'bg-emerald-500 text-white hover:bg-emerald-400'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            }
          `}
        >
          <Send className="w-4 h-4" />
          문의 제출하기
        </button>
      </form>
    </motion.div>
  );
};
