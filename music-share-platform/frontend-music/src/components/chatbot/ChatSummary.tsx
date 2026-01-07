import { motion } from 'framer-motion';
import { CheckCircle, Mail } from 'lucide-react';
import { ChatbotInquiryData } from '../../types/chatbot';

interface ChatSummaryProps {
  data: ChatbotInquiryData;
  onClose: () => void;
}

export const ChatSummary = ({ data, onClose }: ChatSummaryProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex-1 flex flex-col items-center justify-center px-6 py-8"
    >
      {/* 성공 아이콘 */}
      <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
        <CheckCircle className="w-8 h-8 text-emerald-500" />
      </div>

      {/* 메시지 */}
      <h3 className="text-white font-bold text-lg mb-2 text-center">
        문의가 접수되었습니다!
      </h3>
      <p className="text-white/50 text-sm text-center mb-6">
        빠른 시일 내에 연락드리겠습니다.
      </p>

      {/* 요약 카드 */}
      <div className="w-full bg-white/5 rounded-2xl p-4 border border-white/10 mb-6">
        <h4 className="text-white/70 text-xs font-medium mb-3 uppercase tracking-wider">
          문의 내용 요약
        </h4>
        <div className="space-y-2 text-sm">
          <SummaryRow label="작품명" value={data.workTitle} />
          <SummaryRow label="장르" value={data.genres.join(', ')} />
          <SummaryRow label="필요 음악" value={data.musicTypes.join(', ')} />
          <SummaryRow label="분량" value={data.estimatedTracks} />
          <SummaryRow label="일정" value={data.timeline} />
          {data.budget && <SummaryRow label="예산" value={data.budget} />}
        </div>
      </div>

      {/* 이메일 안내 */}
      <div className="flex items-center gap-2 text-white/40 text-xs mb-6">
        <Mail className="w-4 h-4" />
        <span>{data.email}로 확인 메일이 발송됩니다</span>
      </div>

      {/* 닫기 버튼 */}
      <button
        onClick={onClose}
        className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-colors"
      >
        확인
      </button>
    </motion.div>
  );
};

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between">
    <span className="text-white/50">{label}</span>
    <span className="text-white/90 text-right max-w-[60%] truncate">{value}</span>
  </div>
);
