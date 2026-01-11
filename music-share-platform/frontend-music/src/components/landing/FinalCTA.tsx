import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface FinalCTAProps {
    onCTAClick?: () => void;
}

export const FinalCTA = ({ onCTAClick }: FinalCTAProps) => {
    return (
        <section className="py-24 px-6 bg-gradient-to-b from-black to-[#0a0a0a] relative overflow-hidden">
            {/* Background Logo Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                <img
                    src="/images/wordmark_B.png"
                    alt=""
                    className="w-[500px] h-[500px] md:w-[700px] md:h-[700px] object-contain invert"
                />
            </div>

            <div className="max-w-4xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center"
                >
                    <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">
                        웹툰의 음악 연출은, <br />
                        곡이 아니라 <span className="text-emerald-500">설계</span>입니다
                    </h2>

                    <p className="text-xl text-white/50 mb-12 max-w-2xl mx-auto leading-relaxed">
                        우리는 곡을 전달하지 않습니다. <br />
                        장면의 감정과 캐릭터의 흐름을 따라가는 <br className="sm:hidden" />
                        음악 플롯을 함께 설계합니다.
                    </p>

                    <div className="flex flex-col items-center justify-center gap-4">
                        <button
                            onClick={onCTAClick}
                            className="group bg-white hover:bg-gray-100 text-black px-10 py-5 rounded-full
                                     font-bold text-xl transition-all flex items-center gap-3 cursor-pointer"
                        >
                            프로젝트 의뢰 문의
                            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    <p className="mt-8 text-sm text-white/40">
                        레퍼런스 없이 시작해도 괜찮습니다. 작품 링크만 보내주세요.
                    </p>
                </motion.div>
            </div>
        </section>
    );
};
