import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCardSize } from '../../hooks/useResponsive';

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
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const sectionRef = useRef<HTMLElement>(null);
    const isInView = useInView(sectionRef, { once: false, amount: 0.5 });
    const cardSize = useCardSize();

    // 첫 슬라이드는 2초 후, 그 다음부터는 3.5초 간격
    const [isFirstSlide, setIsFirstSlide] = useState(true);

    // 최소 스와이프 거리
    const minSwipeDistance = 50;

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

    const goToPrevious = () => {
        const newIndex = currentIndex === 0 ? steps.length - 1 : currentIndex - 1;
        goToSlide(newIndex);
    };

    const goToNext = () => {
        const newIndex = (currentIndex + 1) % steps.length;
        goToSlide(newIndex);
    };

    // 터치 이벤트 핸들러
    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            goToNext();
        }
        if (isRightSwipe) {
            goToPrevious();
        }
    };

    return (
        <section ref={sectionRef} id="process" className="py-24 mt-16 px-6 bg-black overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-5xl 3xl:text-7xl font-black mb-6">
                        마감일까지, <br />
                        <span className="text-emerald-500">체계적으로.</span>
                    </h2>
                </motion.div>

                {/* 카드 캐러셀 컨테이너 - 버튼 포함 */}
                <div className="relative mb-12 mx-auto" style={{ maxWidth: '1000px' }}>
                    <div className="flex items-center justify-center gap-4">
                        {/* 좌측 버튼 - PC only, 바깥쪽 배치 */}
                        <button
                            onClick={goToPrevious}
                            className="hidden md:flex flex-shrink-0 w-12 h-12 items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/50 rounded-full transition-all duration-300 -mt-3"
                            aria-label="이전 단계"
                        >
                            <ChevronLeft className="w-6 h-6 text-white" />
                        </button>

                        {/* 슬라이드 영역 */}
                        <div className="relative overflow-hidden" style={{ maxWidth: '900px', minHeight: '220px', flex: '1' }}>
                            {/* 양쪽 그라데이션 오버레이 */}
                            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
                            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
                            <motion.div
                                className="flex items-center"
                                animate={{ x: `calc(50% - ${cardSize.offset}px - ${currentIndex * (cardSize.width + cardSize.margin * 2)}px)` }}
                                transition={{ duration: 0.5, ease: "easeInOut" }}
                                onTouchStart={onTouchStart}
                                onTouchMove={onTouchMove}
                                onTouchEnd={onTouchEnd}
                            >
                                {steps.map((step, idx) => {
                                    const isActive = idx === currentIndex;
                                    return (
                                        <div
                                            key={idx}
                                            className={`flex-shrink-0 w-[280px] sm:w-[420px] md:w-[520px] mx-[10px] sm:mx-[20px] p-6 sm:p-8 rounded-3xl transition-all duration-500 ${
                                                isActive
                                                    ? 'bg-white/[0.03] border border-emerald-500/30 scale-100 opacity-100'
                                                    : 'bg-white/[0.02] border border-white/20 scale-95 opacity-60 hover:border-emerald-500/30'
                                            }`}
                                            style={{ minHeight: '200px' }}
                                        >
                                            <div className="text-center py-4">
                                                <h3 className={`text-2xl md:text-3xl 3xl:text-5xl font-bold mb-4 transition-colors duration-500 ${
                                                    isActive ? 'text-white' : 'text-white/30'
                                                }`}>
                                                    {step.title}
                                                </h3>
                                                {isActive && (
                                                    <p className="text-base md:text-lg 3xl:text-2xl leading-relaxed text-white/60">
                                                        {step.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </motion.div>
                        </div>

                        {/* 우측 버튼 - PC only, 바깥쪽 배치 */}
                        <button
                            onClick={goToNext}
                            className="hidden md:flex flex-shrink-0 w-12 h-12 items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/50 rounded-full transition-all duration-300 -mt-3"
                            aria-label="다음 단계"
                        >
                            <ChevronRight className="w-6 h-6 text-white" />
                        </button>
                    </div>
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
                    className="text-center text-white/50 text-base md:text-lg 3xl:text-2xl max-w-2xl 3xl:max-w-4xl mx-auto"
                >
                    이 방식으로, 작품의 흐름과 캐릭터 해석이 흔들리지 않게 음악을 설계합니다.
                </motion.p>
            </div>
        </section>
    );
};
