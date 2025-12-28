import { motion } from 'framer-motion';
import { Users, Briefcase, Sparkles } from 'lucide-react';

const targetGroups = [
    {
        icon: Users,
        title: "웹툰 작가님",
        description: "작품에 어울리는 음악이 필요하지만, 어떻게 의뢰해야 할지 모르겠다면",
        highlights: ["레퍼런스 없이도 OK", "장르 불문 대응 가능"]
    },
    {
        icon: Briefcase,
        title: "웹툰 PD / 제작사",
        description: "다수의 작품을 관리하며 일관된 품질의 음악 파트너가 필요하다면",
        highlights: ["안정적인 납품 일정", "다작품 동시 진행 가능"]
    },
    {
        icon: Sparkles,
        title: "플랫폼 담당자",
        description: "오리지널 콘텐츠의 차별화된 음악 연출이 필요하다면",
        highlights: ["플랫폼 맞춤 믹싱", "독점 저작권 양도"]
    }
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
                        이런 분들과 <span className="text-emerald-500 italic">함께</span>합니다
                    </h2>
                    <p className="text-white/50 text-lg max-w-2xl mx-auto">
                        웹툰 음악 연출, 어디서부터 시작해야 할지 모르겠다면<br />
                        먼저 작품 링크만 보내주세요.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {targetGroups.map((group, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            viewport={{ once: true }}
                            className="group p-8 rounded-3xl bg-white/[0.02] border border-white/5
                                       hover:border-emerald-500/30 transition-all"
                        >
                            <group.icon className="w-12 h-12 text-emerald-500/50 mb-6" />
                            <h3 className="text-2xl font-bold mb-4">{group.title}</h3>
                            <p className="text-white/50 mb-6 leading-relaxed">
                                {group.description}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {group.highlights.map((highlight, hIdx) => (
                                    <span
                                        key={hIdx}
                                        className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm"
                                    >
                                        {highlight}
                                    </span>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
