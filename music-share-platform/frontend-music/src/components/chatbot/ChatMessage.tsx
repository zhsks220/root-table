import { motion } from 'framer-motion';
import { ChatMessage as ChatMessageType } from '../../types/chatbot';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const isBot = message.type === 'bot';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-start gap-3 mb-4 ${isBot ? '' : 'flex-row-reverse'}`}
    >
      {/* 아바타 */}
      {isBot && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
          <span className="text-white text-xs font-bold">R</span>
        </div>
      )}

      {/* 메시지 버블 */}
      <div
        className={`max-w-[80%] px-4 py-3 ${
          isBot
            ? 'bg-white/5 rounded-2xl rounded-tl text-white/90'
            : 'bg-emerald-500 rounded-2xl rounded-tr text-white'
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
      </div>
    </motion.div>
  );
};
