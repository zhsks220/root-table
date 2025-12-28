import { motion } from 'framer-motion';
import { Layout, UserCheck, Zap, Repeat, TrendingUp } from 'lucide-react';
import { cn } from '../../lib/utils';

const features = [
    {
        title: "회차별 맞춤 연출",
        description: "장면의 템포와 연출 의도에 맞춰 음악의 감정선이 정교하게 맞물리도록 설계합니다.",
        icon: Layout,
        className: "md:col-span-2 md:row-span-2",
    },
    {
        title: "캐릭터 테마 설계",
        description: "캐릭터의 등장이 곧 독자들의 전율이 되도록 테마곡을 각인시킵니다.",
        icon: UserCheck,
        className: "md:col-span-1 md:row-span-1",
    },
    {
        title: "빠른 피드백 & 수정",
        description: "현업 웹툰 제작 프로세스를 완벽히 이해하고 있어 지연 없는 협업이 가능합니다.",
        icon: Zap,
        className: "md:col-span-1 md:row-span-1",
    },
    {
        title: "장기 연재 최적화",
        description: "1,200일 이상의 협업 경험으로 작품의 호흡을 끝까지 함께 유지합니다.",
        icon: Repeat,
        className: "md:col-span-1 md:row-span-1",
    },
    {
        title: "독자가 체감하는 퀄리티",
        description: "음악이 함께 떠오르는 댓글 반응, 독자가 먼저 인정하는 연출의 깊이를 제공합니다.",
        icon: TrendingUp,
        className: "md:col-span-1 md:row-span-1",
    },
];

export const Features = () => {
    return (
        <section id="features" className="py-24 px-6 bg-black">
            <div className="max-w-7xl mx-auto">
                <div className="mb-20">
                    <h2 className="text-3xl md:text-5xl font-black mb-6">음악 이상의 <br /><span className="text-white/40">차이를 만듭니다</span></h2>
                    <p className="text-white/50 max-w-xl text-lg">
                        단순히 좋은 곡을 만드는 것이 목적이 아닙니다. <br />
                        웹툰의 서사를 완성하는 마지막 조각으로서의 음악을 추구합니다.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[200px]">
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            whileHover={{ scale: 0.99 }}
                            className={cn(
                                "group relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] p-8 flex flex-col justify-between hover:bg-white/[0.04] transition-all",
                                feature.className
                            )}
                        >
                            <div className="relative z-10">
                                <feature.icon className="w-8 h-8 text-emerald-500 mb-6 group-hover:scale-110 transition-transform" />
                                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-white/40 leading-relaxed text-sm md:text-base">
                                    {feature.description}
                                </p>
                            </div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/5 blur-[80px] -mr-16 -mt-16 group-hover:bg-emerald-600/10 transition-all" />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
