import { motion } from 'framer-motion';
import { useMousePosition } from '../../hooks/useMousePosition';
import { useIsMobile } from '../../hooks/useResponsive';

export const Hero = () => {
    const isMobile = useIsMobile();
    const mousePosition = useMousePosition(!isMobile); // 모바일에서는 비활성화

    // Glow position - 모바일에서는 화면 중앙 고정
    const glowX = isMobile ? '50%' : `${mousePosition.x}px`;
    const glowY = isMobile ? '40%' : `${mousePosition.y}px`;
    const glowStyle = {
        background: `radial-gradient(400px circle at ${glowX} ${glowY}, rgba(16, 185, 129, 0.12), transparent 70%)`,
    };

    return (
        <section className="relative min-h-screen flex flex-col justify-center items-center px-4 min-[360px]:px-6 pt-20 overflow-hidden bg-black text-white">
            {/* Background Interactive Glow */}
            <div
                className="hidden md:block fixed inset-0 z-40 pointer-events-none transition-opacity duration-300"
                style={glowStyle}
            />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-center z-10 max-w-4xl 3xl:max-w-7xl"
            >
                <h1 className="text-2xl min-[360px]:text-3xl sm:text-5xl md:text-6xl lg:text-7xl 3xl:text-8xl font-black tracking-tight mb-6 md:mb-8 leading-[1.1] mx-auto">
                    <span className="whitespace-nowrap">우리는 <span className="text-emerald-500">웹툰 음악</span>을</span> <br />
                    만듭니다.
                </h1>

                <p className="text-sm min-[360px]:text-base sm:text-lg md:text-xl 3xl:text-3xl text-white/50 max-w-2xl 3xl:max-w-4xl mx-auto mb-8 md:mb-10 leading-relaxed">
                    곡을 납품하는 팀이 아니라, <br />
                    회차마다 서사를 설계하는 사운드 디렉터입니다.
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
