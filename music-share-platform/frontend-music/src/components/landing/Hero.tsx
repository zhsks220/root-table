import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useMousePosition } from '../../hooks/useMousePosition';
import { ArrowRight, Play } from 'lucide-react';

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

                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 leading-[1.1]">
                    웹툰 음악, <br />
                    외주가 아니라 <span className="text-emerald-500 italic">'연출'</span>입니다.
                </h1>

                <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
                    귀하의 작품에서만 울리는 사운드트랙. <br />
                    장르, 분위기, 캐릭터까지—레퍼런스 없이도 제안드립니다.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        to="/login"
                        className="group bg-white hover:bg-gray-100 text-black px-8 py-4 rounded-full font-bold text-lg transition-all flex items-center gap-2"
                    >
                        <Play className="w-5 h-5" />
                        플랫폼 시작하기
                    </Link>
                    <a href="#contact" className="group border border-white/20 hover:border-white/40 text-white px-8 py-4 rounded-full font-bold text-lg transition-all flex items-center gap-2">
                        음악 설계 상담 신청
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </a>
                </div>

                <p className="mt-8 text-sm text-white/30 font-medium">
                    2018년부터 226곡 이상 제작 · 57개 작품 협력
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
