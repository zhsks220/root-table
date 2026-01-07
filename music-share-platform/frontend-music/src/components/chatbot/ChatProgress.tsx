import { motion } from 'framer-motion';

interface ChatProgressProps {
  current: number;
  total: number;
}

export const ChatProgress = ({ current, total }: ChatProgressProps) => {
  const progress = (current / total) * 100;

  return (
    <div className="px-4 py-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-white/40">진행률</span>
        <span className="text-xs text-white/60">{current} / {total}</span>
      </div>
      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-emerald-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
};
