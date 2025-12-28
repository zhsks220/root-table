import { motion } from 'framer-motion';

const steps = [
    {
        num: "01",
        title: "작품 분석",
        description: "시놉시스, 캐릭터 관계도, 서사 구조를 면밀히 분석하여 음악적 방향성을 설정합니다."
    },
    {
        num: "02",
        title: "음악 플롯 설계",
        description: "회차별 감정선의 고저에 따른 음악 배치 및 연출 방향을 역제안합니다."
    },
    {
        num: "03",
        title: "사운드 컨셉 도출",
        description: "작품의 장르와 분위기에 맞는 사운드 팔레트를 구성하고 레퍼런스를 공유합니다."
    },
    {
        num: "04",
        title: "제작 및 엔진 믹싱",
        description: "현업 작곡진의 고퀄리티 제작과 웹툰 감상 환경에 최적화된 엔진 믹싱을 진행합니다."
    },
    {
        num: "05",
        title: "연출 컨설팅",
        description: "음악이 삽입된 최종 원고의 몰입도를 검수하고 연출 디테일을 조정합니다."
    },
];

export const Process = () => {
    return (
        <section id="process" className="py-24 px-6 bg-black">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end gap-10 mb-20">
                    <div className="max-w-2xl">
                        <h2 className="text-3xl md:text-5xl font-black mb-6">읽는 것만으로도 <br /><span className="text-emerald-500 italic">'들리는'</span> 연출</h2>
                        <p className="text-white/50 text-lg">
                            루트레이블의 모든 연출은 철저한 분석에서 시작됩니다. <br />
                            단순 배경음이 아닌 스토리텔링의 한 축으로서의 협업 프로세스입니다.
                        </p>
                    </div>
                    <div className="text-right hidden md:block">
                        <span className="text-xs font-mono text-white/20 uppercase tracking-widest">Collaborative Process</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
            </div>
        </section>
    );
};
