import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { QuestionOption } from '../../types/chatbot';

interface ChatOptionsProps {
  options: QuestionOption[];
  type: 'single-select' | 'multi-select';
  onSelect: (value: string | string[]) => void;
  disabled?: boolean;
  skipLabel?: string;
  onSkip?: () => void;
}

export const ChatOptions = ({
  options,
  type,
  onSelect,
  disabled = false,
  skipLabel,
  onSkip,
}: ChatOptionsProps) => {
  const [selected, setSelected] = useState<string[]>([]);

  const handleSelect = (value: string) => {
    if (disabled) return;

    if (type === 'single-select') {
      onSelect(value);
    } else {
      setSelected(prev => {
        if (prev.includes(value)) {
          return prev.filter(v => v !== value);
        }
        return [...prev, value];
      });
    }
  };

  const handleConfirm = () => {
    if (selected.length > 0) {
      onSelect(selected);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2 mb-4"
    >
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option.value);

          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.value)}
              disabled={disabled}
              className={`
                relative px-4 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-200
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${
                  isSelected
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                    : 'bg-white/5 border-white/10 text-white/80 hover:bg-emerald-500/10 hover:border-emerald-500/30'
                }
                border
              `}
            >
              {type === 'multi-select' && isSelected && (
                <Check className="inline-block w-4 h-4 mr-1.5 -ml-1" />
              )}
              {option.label}
            </button>
          );
        })}
      </div>

      {/* 다중 선택 확인 버튼 */}
      {type === 'multi-select' && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleConfirm}
            disabled={selected.length === 0 || disabled}
            className={`
              px-6 py-2.5 rounded-xl text-sm font-bold
              transition-all duration-200
              ${
                selected.length > 0 && !disabled
                  ? 'bg-emerald-500 text-white hover:bg-emerald-400'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }
            `}
          >
            선택 완료 ({selected.length}개)
          </button>
        </div>
      )}

      {/* 건너뛰기 버튼 */}
      {skipLabel && onSkip && (
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
