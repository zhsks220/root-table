import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';

const comparisons = [
    {
        category: "일반 음원 / AI",
        items: [
            { text: "분위기 중심", isNegative: true },
            { text: "장면 맥락 반영 한계", isNegative: true },
            { text: "단발 사용 전제", isNegative: true },
        ],
        isLeft: true
    },
    {
        category: "ROUTELABEL",
        items: [
            { text: "회차·장면·전개 기반 설계", isNegative: false },
            { text: "원고 중심 연출", isNegative: false },
            { text: "장기 연재 흐름 고려", isNegative: false },
        ],
        isLeft: false
    }
];

export const WhyNotStock = () => {
    return (
        <section className="py-24 px-6 bg-black">
            <div className="max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-5xl font-black mb-6">
                        음악은 많지만, <br />
                        <span className="text-emerald-500 italic">연출</span>은 다릅니다
                    </h2>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                    {comparisons.map((col, colIdx) => (
                        <motion.div
                            key={colIdx}
                            initial={{ opacity: 0, x: col.isLeft ? -20 : 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: colIdx * 0.1 }}
                            viewport={{ once: true }}
                            className={`p-8 rounded-3xl border ${
                                col.isLeft
                                    ? 'bg-white/[0.02] border-white/10'
                                    : 'bg-emerald-500/5 border-emerald-500/20'
                            }`}
                        >
                            <h3 className={`text-xl font-bold mb-6 ${
                                col.isLeft ? 'text-white/50' : 'text-emerald-400'
                            }`}>
                                {col.category}
                            </h3>
                            <ul className="space-y-4">
                                {col.items.map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        {item.isNegative ? (
                                            <X className="w-5 h-5 text-red-400/60 mt-0.5 flex-shrink-0" />
                                        ) : (
                                            <Check className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                                        )}
                                        <span className={`${
                                            item.isNegative ? 'text-white/40' : 'text-white/80'
                                        }`}>
                                            {item.text}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>

                {/* 하단 문장 */}
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-center text-white/50 text-base md:text-lg max-w-2xl mx-auto leading-relaxed"
                >
                    우리는 음악을 만드는 팀이 아니라, <br />
                    웹툰의 흐름을 함께 설계하는 팀입니다.
                </motion.p>
            </div>
        </section>
    );
};
