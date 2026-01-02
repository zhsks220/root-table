import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const steps = [
    {
        title: "원고·콘티 분석",
        description: "작품의 서사 구조와 장면 흐름을 면밀히 분석합니다."
    },
    {
        title: "감정선 & 캐릭터 매핑",
        description: "회차별 감정의 고저와 캐릭터 관계를 음악적으로 해석합니다."
    },
    {
        title: "음악 플롯 설계",
        description: "작품에 어울리는 음악 레퍼런스 방향도 역제안합니다."
    },
    {
        title: "제작 & 수정",
        description: "현업 작곡진의 제작과 피드백 기반 수정을 진행합니다."
    },
    {
        title: "OST / 앨범 / 확장 고려",
        description: "작품의 IP 확장까지 고려한 음악 설계를 완성합니다."
    },
];

export const Process = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlay, setIsAutoPlay] = useState(true);
    const sectionRef = useRef<HTMLElement>(null);
    const isInView = useInView(sectionRef, { once: false, amount: 0.5 });

    // 첫 슬라이드는 2초 후, 그 다음부터는 3.5초 간격
    const [isFirstSlide, setIsFirstSlide] = useState(true);

    useEffect(() => {
        if (!isInView || !isAutoPlay) return;

        const delay = isFirstSlide ? 2000 : 3500;

        const timeout = setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % steps.length);
            setIsFirstSlide(false);
        }, delay);

        return () => clearTimeout(timeout);
    }, [isInView, isAutoPlay, currentIndex, isFirstSlide]);

    useEffect(() => {
        if (!isInView) {
            setIsAutoPlay(true);
        }
    }, [isInView]);

    const goToSlide = (index: number) => {
        setIsAutoPlay(false);
        setCurrentIndex(index);
        setTimeout(() => setIsAutoPlay(true), 5000);
    };

    return (
        <section ref={sectionRef} id="process" className="py-24 px-6 bg-black overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-5xl font-black mb-6">
                        웹툰을 읽는 것부터, <br />
                        <span className="text-emerald-500">연출</span>은 시작됩니다
                    </h2>
                </motion.div>

                {/* 카드 캐러셀 - 전체가 같이 움직임 */}
                <div className="relative mb-12 mx-auto overflow-hidden" style={{ maxWidth: '800px', minHeight: '220px' }}>
                    <motion.div
                        className="flex items-center"
                        animate={{ x: `calc(50% - 280px - ${currentIndex * 560}px)` }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                    >
                        {steps.map((step, idx) => {
                            const isActive = idx === currentIndex;
                            return (
                                <div
                                    key={idx}
                                    className={`flex-shrink-0 w-[520px] mx-[20px] p-8 rounded-3xl transition-all duration-500 ${
                                        isActive
                                            ? 'bg-white/[0.03] border border-emerald-500/30 scale-100 opacity-100'
                                            : 'bg-white/[0.02] border border-white/10 scale-95 opacity-50'
                                    }`}
                                    style={{ minHeight: '200px' }}
                                >
                                    <div className="text-center py-4">
                                        <h3 className={`text-2xl md:text-3xl font-bold mb-4 transition-colors duration-500 ${
                                            isActive ? 'text-white' : 'text-white/30'
                                        }`}>
                                            {step.title}
                                        </h3>
                                        {isActive && (
                                            <p className="text-base md:text-lg leading-relaxed text-white/60">
                                                {step.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </motion.div>
                </div>

                {/* 페이지네이션 인디케이터 */}
                <div className="flex justify-center gap-3 mb-12">
                    {steps.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => goToSlide(idx)}
                            className={`h-2 rounded-full transition-all duration-500 hover:bg-emerald-400 ${
                                idx === currentIndex
                                    ? 'bg-emerald-500 w-10'
                                    : 'bg-white/30 w-2 hover:w-4'
                            }`}
                            aria-label={`${idx + 1}번 단계로 이동`}
                        />
                    ))}
                </div>

                {/* 하단 문장 */}
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-center text-white/50 text-base md:text-lg max-w-2xl mx-auto"
                >
                    이 방식으로, 작품의 흐름과 캐릭터 해석이 흔들리지 않게 음악을 설계합니다.
                </motion.p>
            </div>
        </section>
    );
};
