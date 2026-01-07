import { motion } from 'framer-motion';

export const TypingIndicator = () => {
  return (
    <div className="flex items-start gap-3 mb-4">
      {/* 봇 아바타 */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
        <span className="text-white text-xs font-bold">R</span>
      </div>

      {/* 타이핑 인디케이터 */}
      <div className="bg-white/5 rounded-2xl rounded-tl px-4 py-3">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-white/40 rounded-full"
              animate={{
                y: [0, -6, 0],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
