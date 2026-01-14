import { motion } from 'framer-motion';

export const FinalCTA = () => {
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
                    <h2 className="text-3xl md:text-5xl 2xl:text-6xl 3xl:text-7xl font-black mb-36 leading-tight">
                        이런 고민들, <br className="hidden sm:block" />
                        <span className="text-emerald-500">우리가 해결합니다.</span>
                    </h2>

                    <p className="text-xl 2xl:text-2xl 3xl:text-3xl text-white/50 mb-8 max-w-2xl 3xl:max-w-4xl mx-auto leading-relaxed">
                        우리는 콘티를 읽고, 작품을 보며 <br className="hidden sm:block" />
                        웹툰과 딱 맞는 곡을 설계합니다.
                    </p>

                    <h3 className="text-2xl md:text-4xl 2xl:text-5xl 3xl:text-6xl font-black leading-tight">
                        <span className="whitespace-nowrap">지금, <span className="text-emerald-500">작품</span>에 대해서</span> <br className="hidden sm:block" />
                        우리와 이야기 나눠보면 어떨까요?
                    </h3>
                </motion.div>
            </div>
        </section>
    );
};
