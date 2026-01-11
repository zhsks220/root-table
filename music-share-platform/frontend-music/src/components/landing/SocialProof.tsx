import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';

const stats = [
    {
        value: "350+",
        label: "제작 음악 수",
        description: "웹툰의 감정을 음악으로 담아낸 트랙들",
    },
    {
        value: "18개+",
        label: "협업 작품 수",
        description: "다양한 장르의 웹툰과 함께한 프로젝트",
    },
    {
        value: "8년+",
        label: "연재 웹툰 협업 기간",
        description: "오랜 신뢰를 바탕으로 쌓아온 파트너십",
    },
];

// 웹툰 작업 이미지 목록
const webtoonImages = [
    '/images/webtoons/외모지상주의.jpg',
    '/images/webtoons/연애혁명.jpg',
    '/images/webtoons/얼짱시대.jpg',
    '/images/webtoons/촉법소년.jpg',
    '/images/webtoons/먹뀌싸.jpg',
    '/images/webtoons/퀘스트지상주의.jpg',
    '/images/webtoons/킬러 배드로.jpg',
    '/images/webtoons/1초.jpg',
    '/images/webtoons/개짓.jpg',
    '/images/webtoons/김부장.jpg',
    '/images/webtoons/백XX.jpg',
    '/images/webtoons/두 남자의 비서 사이.jpg',
    '/images/webtoons/작두.jpg',
    '/images/webtoons/VS.jpg',
    '/images/webtoons/구룡 사로카.jpg',
    '/images/webtoons/냉동무사.jpg',
    '/images/webtoons/포그랜드.jpg',
    '/images/webtoons/죽여주는 변호사.jpg',
];

export const SocialProof = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlay, setIsAutoPlay] = useState(true);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const sectionRef = useRef<HTMLElement>(null);
    const isInView = useInView(sectionRef, { once: false, amount: 0.5 });

    // 뷰포트에 들어왔을 때만 자동 슬라이드
    const [isFirstSlide, setIsFirstSlide] = useState(true);

    // 최소 스와이프 거리
    const minSwipeDistance = 50;

    useEffect(() => {
        if (!isInView || !isAutoPlay) return;

        // 첫 슬라이드는 2초 후, 그 다음부터는 3.5초 간격
        const delay = isFirstSlide ? 2000 : 3500;

        const timeout = setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % stats.length);
            setIsFirstSlide(false);
        }, delay);

        return () => clearTimeout(timeout);
    }, [isInView, isAutoPlay, currentIndex, isFirstSlide]);

    // 섹션 벗어나면 자동재생 다시 활성화
    useEffect(() => {
        if (!isInView) {
            setIsAutoPlay(true);
        }
    }, [isInView]);

    const goToSlide = (index: number) => {
        setIsAutoPlay(false);
        setCurrentIndex(index);
        // 5초 후 자동재생 다시 시작
        setTimeout(() => setIsAutoPlay(true), 5000);
    };

    const goToPrevious = () => {
        const newIndex = currentIndex === 0 ? stats.length - 1 : currentIndex - 1;
        goToSlide(newIndex);
    };

    const goToNext = () => {
        const newIndex = (currentIndex + 1) % stats.length;
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
        <section ref={sectionRef} className="relative py-24 px-6 bg-[#0a0a0a] overflow-hidden">
            {/* 슬라이딩 웹툰 썸네일 배경 - 두 줄 */}
            <div className="absolute inset-0 z-0 flex flex-col justify-center gap-4">
                {/* 첫 번째 줄 - 왼쪽으로 이동 */}
                <div className="relative flex overflow-hidden">
                    <motion.div
                        className="flex gap-4"
                        animate={{
                            x: [0, -(204 * webtoonImages.length / 2)]
                        }}
                        transition={{
                            x: {
                                repeat: Infinity,
                                repeatType: "loop",
                                duration: (webtoonImages.length / 2) * 3,
                                ease: "linear"
                            }
                        }}
                    >
                        {webtoonImages.slice(0, 9).concat(webtoonImages.slice(0, 9)).map((imageUrl, idx) => (
                            <div
                                key={`row1-${idx}`}
                                className="relative w-[200px] h-[280px] flex-shrink-0 rounded-lg overflow-hidden"
                                style={{
                                    filter: 'blur(3px) brightness(0.7)',
                                }}
                            >
                                <img
                                    src={imageUrl}
                                    alt="webtoon thumbnail"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* 두 번째 줄 - 오른쪽으로 이동 (반대 방향) */}
                <div className="relative flex overflow-hidden">
                    <motion.div
                        className="flex gap-4"
                        animate={{
                            x: [-(204 * webtoonImages.length / 2), 0]
                        }}
                        transition={{
                            x: {
                                repeat: Infinity,
                                repeatType: "loop",
                                duration: (webtoonImages.length / 2) * 3,
                                ease: "linear"
                            }
                        }}
                    >
                        {webtoonImages.slice(9).concat(webtoonImages.slice(9)).map((imageUrl, idx) => (
                            <div
                                key={`row2-${idx}`}
                                className="relative w-[200px] h-[280px] flex-shrink-0 rounded-lg overflow-hidden"
                                style={{
                                    filter: 'blur(3px) brightness(0.7)',
                                }}
                            >
                                <img
                                    src={imageUrl}
                                    alt="webtoon thumbnail"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* 그라데이션 오버레이 - 상하좌우 페이드 */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/90 via-[#0a0a0a]/60 to-[#0a0a0a]/90" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-transparent to-[#0a0a0a]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto">
                {/* 섹션 타이틀 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl md:text-4xl font-black mb-4">
                        이미, 웹툰 안에서 <span className="text-emerald-500">증명</span>했습니다
                    </h2>
                </motion.div>

                {/* 메인 통계 슬라이더 */}
                <div
                    className="relative flex items-center justify-center min-h-[280px] mb-12"
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                >
                    <AnimatePresence mode="wait">
                        {isInView && (
                            <motion.div
                                key={currentIndex}
                                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -30, scale: 0.95 }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                                className="text-center px-8"
                            >
                                <div className="text-7xl sm:text-8xl md:text-9xl font-black text-white mb-4 tracking-tight">
                                    {stats[currentIndex].value}
                                </div>
                                <div className="text-xl md:text-2xl text-white/80 font-bold mb-3">
                                    {stats[currentIndex].label}
                                </div>
                                <div className="text-sm md:text-base text-white/50">
                                    {stats[currentIndex].description}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* 페이지네이션 인디케이터 (클릭 가능) */}
                <div className="flex justify-center gap-3 mb-12">
                    {stats.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => goToSlide(idx)}
                            className={`h-2 rounded-full transition-all duration-500 hover:bg-emerald-400 ${
                                idx === currentIndex
                                    ? 'bg-emerald-500 w-10'
                                    : 'bg-white/30 w-2 hover:w-4'
                            }`}
                            aria-label={`${idx + 1}번 슬라이드로 이동`}
                        />
                    ))}
                </div>

                {/* 보조 문장 */}
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-center text-white/40 text-sm md:text-base"
                >
                    단발 프로젝트가 아닌, 연재 흐름을 함께 설계해왔습니다.
                </motion.p>
            </div>
        </section>
    );
};
