import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';

const comparisons = [
    {
        category: "스톡 뮤직 / AI 생성",
        items: [
            { text: "범용적 분위기만 가능", isNegative: true },
            { text: "작품 세계관과 불일치", isNegative: true },
            { text: "캐릭터별 테마 불가", isNegative: true },
            { text: "회차별 감정선 추적 불가", isNegative: true },
            { text: "저작권/라이선스 리스크", isNegative: true },
        ],
        isLeft: true
    },
    {
        category: "루트레이블 방식",
        items: [
            { text: "작품 전용 오리지널 제작", isNegative: false },
            { text: "세계관 맞춤 사운드 설계", isNegative: false },
            { text: "캐릭터별 라이트모티프", isNegative: false },
            { text: "회차별 음악 플롯 설계", isNegative: false },
            { text: "완전한 저작권 양도", isNegative: false },
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
                        왜 스톡 뮤직이나 <br />
                        <span className="text-emerald-500 italic">AI 생성 음악</span>이 아닌가요?
                    </h2>
                    <p className="text-white/50 text-lg max-w-2xl mx-auto">
                        작품의 몰입도는 디테일에서 결정됩니다. <br />
                        범용 음악으로는 '그 작품만의 소리'를 만들 수 없습니다.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>
        </section>
    );
};
