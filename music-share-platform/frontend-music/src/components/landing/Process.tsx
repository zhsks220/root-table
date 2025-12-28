import { motion } from 'framer-motion';

const steps = [
    {
        num: "01",
        title: "원고·콘티 분석",
        description: "작품의 서사 구조와 장면 흐름을 면밀히 분석합니다."
    },
    {
        num: "02",
        title: "감정선 & 캐릭터 매핑",
        description: "회차별 감정의 고저와 캐릭터 관계를 음악적으로 해석합니다."
    },
    {
        num: "03",
        title: "음악 플롯 설계",
        description: "작품에 어울리는 음악 레퍼런스 방향도 역제안합니다."
    },
    {
        num: "04",
        title: "제작 & 수정",
        description: "현업 작곡진의 제작과 피드백 기반 수정을 진행합니다."
    },
    {
        num: "05",
        title: "OST / 앨범 / 확장 고려",
        description: "작품의 IP 확장까지 고려한 음악 설계를 완성합니다."
    },
];

export const Process = () => {
    return (
        <section id="process" className="py-24 px-6 bg-black">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-5xl font-black mb-6">
                        웹툰을 읽는 것부터, <br />
                        <span className="text-emerald-500 italic">연출</span>은 시작됩니다
                    </h2>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-16">
                    {steps.map((step, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            viewport={{ once: true }}
                            className="group p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/30 transition-all"
                        >
                            <div className="text-4xl font-black text-white/10 group-hover:text-emerald-500/20 transition-colors mb-6 font-mono">
                                {step.num}
                            </div>
                            <h3 className="text-xl font-bold mb-4">{step.title}</h3>
                            <p className="text-white/40 text-sm leading-relaxed">
                                {step.description}
                            </p>
                        </motion.div>
                    ))}
                </div>

                {/* 하단 문장 */}
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-center text-white/50 text-base md:text-lg max-w-2xl mx-auto"
                >
                    이 방식으로, 작품의 흐름과 캐릭터 해석이 흔들리지 않게 음악을 설계합니다.
                </motion.p>
            </div>
        </section>
    );
};
