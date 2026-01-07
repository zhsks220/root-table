import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';

interface FloatingCTAProps {
    onClick: () => void;
}

export const FloatingCTA = ({ onClick }: FloatingCTAProps) => {
    return (
        <motion.button
            onClick={onClick}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-white hover:bg-gray-100 text-black font-bold px-5 py-3 rounded-full shadow-lg shadow-white/30 transition-colors cursor-pointer"
        >
            <MessageCircle className="w-5 h-5" />
            <span className="hidden sm:inline">프로젝트 의뢰 문의</span>
        </motion.button>
    );
};
