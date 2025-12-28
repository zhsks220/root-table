import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const projectFilters = [
    "연출과 감정 흐름이 중요한 웹툰",
    "회차가 이어지는 서사 중심 작품",
    "캐릭터 해석이 중요한 IP",
    "음악 레퍼런스 선정에 부담을 느끼는 경우"
];

export const WhoWeWorkWith = () => {
    return (
        <section className="py-24 px-6 bg-black">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-5xl font-black mb-6">
                        잘 맞는 <span className="text-emerald-500 italic">프로젝트</span>가 있습니다
                    </h2>
                </motion.div>

                <div className="max-w-2xl mx-auto mb-16">
                    <div className="space-y-4">
                        {projectFilters.map((filter, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                viewport={{ once: true }}
                                className="flex items-center gap-4 p-6 rounded-2xl bg-white/[0.02] border border-white/5
                                           hover:border-emerald-500/30 transition-all"
                            >
                                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                                    <Check className="w-4 h-4 text-emerald-500" />
                                </div>
                                <span className="text-lg text-white/80">{filter}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* 하단 문장 */}
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-center text-white/50 text-base md:text-lg"
                >
                    스케일보다, 작품에 대한 이해가 기준입니다.
                </motion.p>
            </div>
        </section>
    );
};
