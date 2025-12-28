import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';

const reactions = [
    {
        text: "음악 나오는 순간 소름 돋았어요",
        source: "네이버웹툰 댓글",
        highlight: "소름"
    },
    {
        text: "이 장면에서 이 음악... 완벽해요",
        source: "카카오페이지 댓글",
        highlight: "완벽"
    },
    {
        text: "브금 때문에 몰입감 미쳤다",
        source: "레진코믹스 댓글",
        highlight: "몰입감"
    },
    {
        text: "음악 제작자 누구예요? 천재 아님?",
        source: "봄툰 댓글",
        highlight: "천재"
    },
    {
        text: "이 웹툰 음악만 따로 듣고 싶어요",
        source: "리디 댓글",
        highlight: "따로 듣고 싶어요"
    },
    {
        text: "음악이 스토리를 두 배로 만들어줌",
        source: "네이버웹툰 댓글",
        highlight: "두 배"
    }
];

export const ReaderReactions = () => {
    return (
        <section id="testimonials" className="py-24 px-6 bg-[#0a0a0a]">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <span className="text-xs font-mono text-white/30 uppercase tracking-widest mb-4 block">
                        Reader Reactions
                    </span>
                    <h2 className="text-3xl md:text-5xl font-black mb-6">
                        독자들이 <span className="text-emerald-500 italic">직접</span> 남긴 반응
                    </h2>
                    <p className="text-white/50 text-lg max-w-2xl mx-auto">
                        루트레이블의 음악이 삽입된 작품에서 수집된 실제 독자 댓글입니다.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reactions.map((reaction, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            viewport={{ once: true }}
                            className="group p-6 rounded-2xl bg-white/[0.02] border border-white/5
                                       hover:border-emerald-500/30 transition-all"
                        >
                            <MessageSquare className="w-8 h-8 text-emerald-500/30 mb-4" />
                            <p className="text-lg text-white/80 mb-4 leading-relaxed">
                                "{reaction.text}"
                            </p>
                            <p className="text-sm text-white/30 font-medium">
                                — {reaction.source}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
