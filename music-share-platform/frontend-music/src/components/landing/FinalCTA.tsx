import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';

export const FinalCTA = () => {
    return (
        <section className="py-32 px-6 bg-gradient-to-b from-black to-[#0a0a0a] relative overflow-hidden">
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
                        작품의 소리를 <br />
                        <span className="text-emerald-500 italic">함께 설계</span>할 준비가 되셨나요?
                    </h2>

                    <p className="text-xl text-white/50 mb-12 max-w-2xl mx-auto leading-relaxed">
                        레퍼런스가 없어도 괜찮습니다. <br />
                        작품 링크만 보내주시면, 최적의 음악 설계안을 무료로 제안드립니다.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            to="/login"
                            className="group bg-white hover:bg-gray-100 text-black px-10 py-5 rounded-full
                                     font-bold text-xl transition-all flex items-center gap-3"
                        >
                            <Play className="w-6 h-6" />
                            플랫폼 시작하기
                        </Link>
                        <a
                            href="#contact"
                            className="group border border-white/20 hover:border-white/40 text-white px-10 py-5 rounded-full
                                     font-bold text-xl transition-all flex items-center gap-3"
                        >
                            무료 상담 신청하기
                            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </a>
                    </div>

                    <p className="mt-8 text-sm text-white/30">
                        평균 응답 시간: 영업일 기준 24시간 이내
                    </p>
                </motion.div>
            </div>
        </section>
    );
};
