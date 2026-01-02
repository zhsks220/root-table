import { motion } from 'framer-motion';
import { useMousePosition } from '../../hooks/useMousePosition';
import { ArrowRight } from 'lucide-react';

export const Hero = () => {
    const mousePosition = useMousePosition();

    // Glow position calculated relative to the mouse
    const glowStyle = {
        background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(16, 185, 129, 0.15), transparent 80%)`,
    };

    return (
        <section className="relative min-h-screen flex flex-col justify-center items-center px-6 pt-20 overflow-hidden bg-black text-white">
            {/* Background Interactive Glow */}
            <div
                className="fixed inset-0 pointer-events-none transition-opacity duration-300"
                style={glowStyle}
            />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-center z-10 max-w-4xl"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/50 mb-8 backdrop-blur-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    The next generation of webtoon music
                </div>

                <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6 md:mb-8 leading-[1.1]">
                    웹툰 음악, <br />
                    외주가 아니라 <span className="whitespace-nowrap"><span className="text-emerald-500">'연출'</span>입니다.</span>
                </h1>

                <p className="text-base sm:text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed">
                    루트레이블은 곡을 납품하지 않습니다. <br />
                    회차·장면·캐릭터를 따라가는 <br className="sm:hidden" />
                    웹툰을 위한 음악 플롯을 설계합니다.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                    <a
                        href="#contact"
                        className="group bg-white hover:bg-gray-100 text-black px-6 py-3 sm:px-8 sm:py-4 rounded-full font-bold text-base sm:text-lg transition-all flex items-center gap-2"
                    >
                        프로젝트 의뢰 문의
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                    </a>
                </div>

                <p className="mt-6 md:mt-8 text-xs sm:text-sm text-white/40 font-medium">
                    레퍼런스가 없어도 괜찮습니다.
                </p>
            </motion.div>

            {/* Background Logo Watermark */}
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] md:w-[600px] md:h-[600px] pointer-events-none opacity-[0.03]">
                <img
                    src="/images/wordmark_B.png"
                    alt=""
                    className="w-full h-full object-contain invert"
                />
            </div>
        </section>
    );
};
