import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatWindow } from './ChatWindow';

interface ChatbotInquiryProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatbotInquiry = ({ isOpen, onClose }: ChatbotInquiryProps) => {
  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 스크롤 잠금
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 배경 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999]"
            onClick={onClose}
          />

          {/* 채팅창 모달 */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed z-[1000] overflow-hidden shadow-2xl
              /* 모바일: 전체화면 */
              inset-4 rounded-2xl
              /* 태블릿 이상: 우하단 플로팅 */
              md:inset-auto md:bottom-6 md:right-6
              md:w-[420px] md:h-[640px] md:rounded-3xl
            "
            style={{
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            <ChatWindow onClose={onClose} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
