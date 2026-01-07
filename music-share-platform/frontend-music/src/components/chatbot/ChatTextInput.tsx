import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';

interface ChatTextInputProps {
  placeholder?: string;
  type?: 'text' | 'url' | 'email';
  required?: boolean;
  onSubmit: (value: string) => void;
  disabled?: boolean;
  skipLabel?: string;
  onSkip?: () => void;
  error?: string | null;
}

export const ChatTextInput = ({
  placeholder = '메시지를 입력하세요',
  type = 'text',
  required = false,
  onSubmit,
  disabled = false,
  skipLabel,
  onSkip,
  error,
}: ChatTextInputProps) => {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;

    if (required && !value.trim()) return;

    onSubmit(value.trim());
    setValue('');
  };

  const inputType = type === 'url' ? 'url' : type === 'email' ? 'email' : 'text';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type={inputType}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            flex-1 px-4 py-3 rounded-xl text-sm
            bg-white/5 border text-white placeholder-white/30
            focus:outline-none focus:ring-2 focus:ring-emerald-500/50
            transition-all duration-200
            ${error ? 'border-red-500/50' : 'border-white/10'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        />
        <button
          type="submit"
          disabled={disabled || (required && !value.trim())}
          className={`
            px-4 py-3 rounded-xl
            transition-all duration-200
            ${
              !disabled && (!required || value.trim())
                ? 'bg-emerald-500 text-white hover:bg-emerald-400'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            }
          `}
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

      {/* 에러 메시지 */}
      {error && (
        <p className="text-red-400 text-xs mt-2">{error}</p>
      )}

      {/* 건너뛰기 버튼 */}
      {skipLabel && onSkip && !required && (
        <button
          onClick={onSkip}
          disabled={disabled}
          className="text-sm text-white/40 hover:text-white/60 transition-colors mt-2"
        >
          {skipLabel}
        </button>
      )}
    </motion.div>
  );
};
