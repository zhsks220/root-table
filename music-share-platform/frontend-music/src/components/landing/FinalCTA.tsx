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
                    <p className="text-xl 2xl:text-2xl 3xl:text-3xl text-white/50 mb-8 max-w-2xl 3xl:max-w-4xl mx-auto leading-relaxed">
                        우리는 콘티를 읽고, 작품을 보며 <br className="hidden sm:block" />
                        웹툰과 딱 맞는 곡을 설계합니다.
                    </p>

                    <h3 className="text-2xl md:text-4xl 2xl:text-5xl 3xl:text-6xl font-black leading-tight mb-12">
                        <span className="whitespace-nowrap">지금, <span className="text-emerald-500">작품</span>에 대해서</span> <br className="hidden sm:block" />
                        우리와 이야기 나눠보면 어떨까요?
                    </h3>

                    <motion.button
                        onClick={onCTAClick}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-black font-bold px-8 py-4 rounded-full text-lg transition-colors"
                    >
                        상담하기
                        <ArrowRight className="w-5 h-5" />
                    </motion.button>

                    <p className="text-white/30 text-sm 2xl:text-base mt-6">
                        레퍼런스 없이 시작해도 괜찮습니다. 작품 링크만 보내주세요.
                    </p>
                </motion.div>
            </div>
        </section>
    );
};
