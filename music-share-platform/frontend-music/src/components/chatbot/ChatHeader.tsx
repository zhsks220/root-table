import { X, Minus } from 'lucide-react';

interface ChatHeaderProps {
  onClose: () => void;
  onMinimize?: () => void;
}

export const ChatHeader = ({ onClose, onMinimize }: ChatHeaderProps) => {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
      {/* 로고 & 타이틀 */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
          <span className="text-white font-bold text-sm">R</span>
        </div>
        <div>
          <h3 className="text-white font-bold text-sm">루트레이블</h3>
          <p className="text-white/50 text-xs">프로젝트 문의</p>
        </div>
      </div>

      {/* 버튼들 */}
      <div className="flex items-center gap-1">
        {onMinimize && (
          <button
            onClick={onMinimize}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="최소화"
          >
            <Minus className="w-5 h-5 text-white/60" />
          </button>
        )}
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="닫기"
        >
          <X className="w-5 h-5 text-white/60" />
        </button>
      </div>
    </div>
  );
};
