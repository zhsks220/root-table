import { motion } from 'framer-motion';

const stats = [
    { value: "226+", label: "누적 제작 곡 수" },
    { value: "57+", label: "협력 작품 수" },
    { value: "5", label: "인하우스 작곡가" },
];

// 협력 플랫폼/파트너사 (흑백 로고 스타일)
const partners = [
    { name: "네이버웹툰", shortName: "NAVER WEBTOON" },
    { name: "카카오웹툰", shortName: "KAKAO WEBTOON" },
    { name: "카카오페이지", shortName: "KAKAO PAGE" },
    { name: "레진코믹스", shortName: "LEZHIN" },
    { name: "봄툰", shortName: "BOMTOON" },
    { name: "리디", shortName: "RIDI" },
];

export const SocialProof = () => {
    return (
        <section className="py-20 px-6 bg-[#0a0a0a]">
            <div className="max-w-7xl mx-auto">
                {/* 통계 숫자 */}
                <div className="grid grid-cols-3 gap-8 mb-16">
                    {stats.map((stat, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            viewport={{ once: true }}
                            className="text-center"
                        >
                            <div className="text-5xl md:text-7xl font-black text-white mb-2">
                                {stat.value}
                            </div>
                            <div className="text-sm md:text-base text-white/40 font-medium">
                                {stat.label}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* 파트너사 로고 섹션 - 흑백 스타일 */}
                <div className="text-center">
                    <p className="text-xs font-mono text-white/30 uppercase tracking-widest mb-8">
                        주요 협력 플랫폼
                    </p>

                    <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
                        {partners.map((partner, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                viewport={{ once: true }}
                                className="group"
                            >
                                {/* 흑백 텍스트 로고 스타일 */}
                                <span className="text-sm md:text-base font-medium text-white/30
                                               hover:text-white/60 transition-colors cursor-default
                                               tracking-wide">
                                    {partner.shortName}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};
