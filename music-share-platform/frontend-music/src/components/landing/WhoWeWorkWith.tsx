import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';

const thoughts = [
    "이번 회차에 BGM 연출하면 좋을것 같은데..",
    "너무 바빠서 마감일에 겨우 완성될것 같은데, 음악 제작 의뢰를 맡길 시간이 없네..",
    "뭔가 머릿속에 떠오르는건 있는데.. 이걸 어떻게 만들어 달라고 해야 하지?",
    "우리 작품 IP도 OST 앨범 만들어 볼까?",
    "이 캐릭터의 서사를 음악으로 표현 할순 없을까?"
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
            delayChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4 }
    }
};

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
                        잘 맞는 <span className="text-emerald-500">프로젝트</span>가 <br />
                        있습니다
                    </h2>
                </motion.div>

                <motion.div
                    className="max-w-3xl mx-auto"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                >
                    <div className="space-y-4">
                        {thoughts.map((thought, idx) => (
                            <motion.div
                                key={idx}
                                variants={itemVariants}
                                className="flex items-start gap-4 p-5 md:p-6 rounded-2xl bg-white/[0.02] border border-white/5
                                           hover:border-emerald-500/30 transition-all"
                            >
                                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <MessageCircle className="w-4 h-4 text-emerald-500" />
                                </div>
                                <span className="text-base md:text-lg text-white/80 leading-relaxed">{thought}</span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
