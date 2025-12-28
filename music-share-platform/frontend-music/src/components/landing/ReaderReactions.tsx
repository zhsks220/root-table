import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const reactions = [
    {
        text: "루트레이블의 음악은\n배경음이 아니라\n캐릭터 해석을 완성시키는 연출이었다."
    },
    {
        text: "캐릭터를 떠올리면\n음악이 함께 떠오를 정도로\n테마가 각인되어 있었다."
    },
    {
        text: "아쉬운 장면에서도\n음악이 감정을 설득하며\n연출의 완성도를 끌어올렸다."
    },
    {
        text: "작품 이해도가 높아\n장면의 의도와 감정을\n정확히 짚어냈다."
    },
    {
        text: "다른 웹툰 음악과 비교해도\n캐릭터 중심 설계라는\n차이가 분명했다."
    },
    {
        text: "장면 전환마다\n음악이 정확히 맞물려\n연출 컨트롤이 정교했다."
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
                    <h2 className="text-3xl md:text-5xl font-black mb-6">
                        독자는, <span className="text-emerald-500 italic">차이</span>를 먼저 느낍니다
                    </h2>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                    {reactions.map((reaction, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            viewport={{ once: true }}
                            className="p-8 rounded-3xl bg-white/[0.02] border border-white/5
                                       hover:border-emerald-500/30 transition-all"
                        >
                            <p className="text-lg text-white/80 leading-relaxed whitespace-pre-line">
                                {reaction.text}
                            </p>
                        </motion.div>
                    ))}
                </div>

                {/* 하단 문장 */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-center"
                >
                    <p className="text-white/50 text-base md:text-lg mb-10 leading-relaxed">
                        이런 반응은, <br />
                        음악을 '곡'이 아니라 연출로 설계했을 때 나옵니다.
                    </p>

                    {/* CTA */}
                    <a
                        href="#contact"
                        className="inline-flex items-center gap-3 bg-white hover:bg-gray-100 text-black px-8 py-4 rounded-full font-bold text-lg transition-all group"
                    >
                        프로젝트 의뢰 문의
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </a>
                    <p className="mt-4 text-sm text-white/40">
                        레퍼런스 없이 시작하셔도 됩니다.
                    </p>
                </motion.div>
            </div>
        </section>
    );
};
