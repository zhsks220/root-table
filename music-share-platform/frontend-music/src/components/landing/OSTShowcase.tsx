import { useState, useRef, useEffect } from 'react';
import { motion, useInView, useAnimation } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCardSize, useIsMobile } from '../../hooks/useResponsive';

// OST 카드 데이터 - 나중에 실제 데이터로 교체
const ostCards = [
    {
        workTitle: "작품명 1",
        trackTitle: "OST 타이틀 1",
        description: "OST 설명이 들어갑니다.",
        accentText: "text-emerald-400",
        accentBorder: "border-emerald-400",
        accentDot: "bg-emerald-400",
        accentGradient: "linear-gradient(135deg, rgba(52,211,153,0.8), rgba(52,211,153,0.2), rgba(52,211,153,0.6))",
        audioSrc: "/audio/ost-sample-1.mp3",
        youtubeLink: "https://www.youtube.com/@routelabel",
        coverImage: "/images/ost-cover-1.jpg",
    },
    {
        workTitle: "작품명 2",
        trackTitle: "OST 타이틀 2",
        description: "OST 설명이 들어갑니다.",
        accentText: "text-cyan-400",
        accentBorder: "border-cyan-400",
        accentDot: "bg-cyan-400",
        accentGradient: "linear-gradient(135deg, rgba(34,211,238,0.8), rgba(34,211,238,0.2), rgba(34,211,238,0.6))",
        audioSrc: "/audio/ost-sample-2.mp3",
        youtubeLink: "https://www.youtube.com/@routelabel",
        coverImage: "/images/ost-cover-2.jpg",
    },
    {
        workTitle: "작품명 3",
        trackTitle: "OST 타이틀 3",
        description: "OST 설명이 들어갑니다.",
        accentText: "text-violet-400",
        accentBorder: "border-violet-400",
        accentDot: "bg-violet-400",
        accentGradient: "linear-gradient(135deg, rgba(167,139,250,0.8), rgba(167,139,250,0.2), rgba(167,139,250,0.6))",
        audioSrc: "/audio/ost-sample-3.mp3",
        youtubeLink: "https://www.youtube.com/@routelabel",
        coverImage: "/images/ost-cover-3.jpg",
    },
];

export const OSTShowcase = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.7);
    const [isMuted, setIsMuted] = useState(false);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    const sectionRef = useRef<HTMLElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const isInView = useInView(sectionRef, { once: false, amount: 0.5 });
    const cardSize = useCardSize();
    const pendingPlayRef = useRef(false);
    const isMobile = useIsMobile();
    const swipeHintControls = useAnimation();

    // 모바일 스와이프 힌트 애니메이션 상태
    const [showSwipeHint, setShowSwipeHint] = useState(true);
    const hasShownHintRef = useRef(false);

    const minSwipeDistance = 50;

    // 섹션 벗어나면 오디오 정지
    useEffect(() => {
        if (!isInView && audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    }, [isInView]);

    // 모바일 스와이프 힌트: 섹션이 뷰에 들어오면 한 번만 힌트 애니메이션
    useEffect(() => {
        if (isInView && isMobile && !hasShownHintRef.current) {
            hasShownHintRef.current = true;
            swipeHintControls.start({
                x: [0, -30, 30, -15, 15, 0],
                transition: {
                    duration: 1.2,
                    ease: "easeInOut",
                }
            }).then(() => {
                setShowSwipeHint(false);
            });
        }
    }, [isInView, isMobile, swipeHintControls]);

    // 오디오 재생 함수
    const playCurrentTrack = () => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.currentTime = 0;
        audio.play()
            .then(() => setIsPlaying(true))
            .catch((err) => console.error('Play failed:', err));
    };

    // 오디오 재생/일시정지
    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            playCurrentTrack();
        }
    };

    // 음량 변경
    const handleVolumeChange = (newVolume: number) => {
        setVolume(newVolume);
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
        }
        if (newVolume > 0 && isMuted) {
            setIsMuted(false);
        }
    };

    // 음소거 토글
    const toggleMute = () => {
        if (audioRef.current) {
            if (isMuted) {
                audioRef.current.volume = volume;
                setIsMuted(false);
            } else {
                audioRef.current.volume = 0;
                setIsMuted(true);
            }
        }
    };

    // 트랙 변경 함수
    const changeTrack = (newIndex: number, autoPlay: boolean) => {
        const audio = audioRef.current;
        if (!audio) return;

        // 현재 재생 중지
        audio.pause();

        // 인덱스 변경
        setCurrentIndex(newIndex);

        // 자동 재생 플래그 설정
        if (autoPlay) {
            pendingPlayRef.current = true;
        }
    };

    // currentIndex가 변경되면 오디오 소스 업데이트 및 재생
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        // 소스 변경
        audio.src = ostCards[currentIndex].audioSrc;
        audio.load();

        // 자동 재생이 필요한 경우
        if (pendingPlayRef.current) {
            const handleCanPlay = () => {
                audio.play()
                    .then(() => setIsPlaying(true))
                    .catch((err) => console.error('Auto play failed:', err));
                audio.removeEventListener('canplay', handleCanPlay);
            };

            audio.addEventListener('canplay', handleCanPlay);
            pendingPlayRef.current = false;

            return () => {
                audio.removeEventListener('canplay', handleCanPlay);
            };
        } else {
            setIsPlaying(false);
        }
    }, [currentIndex]);

    // 이전 트랙으로 이동 + 재생
    const goToPrevious = () => {
        const newIndex = currentIndex === 0 ? ostCards.length - 1 : currentIndex - 1;
        changeTrack(newIndex, true);
    };

    // 다음 트랙으로 이동 + 재생
    const goToNext = () => {
        const newIndex = (currentIndex + 1) % ostCards.length;
        changeTrack(newIndex, true);
    };

    // 특정 슬라이드로 이동 (페이지네이션)
    const goToSlide = (index: number) => {
        setCurrentIndex(index);
    };

    // 터치 이벤트
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
        if (distance > minSwipeDistance) goToNext();
        if (distance < -minSwipeDistance) goToPrevious();
    };

    // 오디오 끝났을 때 - 다음 곡 자동 재생
    const handleAudioEnded = () => {
        goToNext();
    };

    return (
        <section ref={sectionRef} className="py-24 px-6 bg-black overflow-hidden">
            {/* 오디오 요소 - OST 샘플 음악 */}
            <audio
                ref={audioRef}
                preload="metadata"
                onEnded={handleAudioEnded}
            />

            <div className="max-w-7xl mx-auto mt-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-5xl 3xl:text-7xl font-black mb-6">
                        어떤 <span className="text-emerald-500">OST</span>가 필요하신가요?
                    </h2>
                    <p className="text-white/50 text-base md:text-lg 3xl:text-2xl">
                        작품의 세계관을 완성하는 OST를 제작합니다.
                    </p>
                </motion.div>

                {/* 캐러셀 컨테이너 */}
                <div className="relative mb-3 md:mb-8 mx-auto" style={{ maxWidth: '1400px' }}>
                    {/* 슬라이드 영역 */}
                    <div
                        className="relative overflow-hidden mx-auto"
                        style={{ maxWidth: '1200px', minHeight: '260px' }}
                    >
                        {/* 양쪽 그라데이션 오버레이 */}
                        <div className="absolute left-0 top-0 bottom-0 w-12 md:w-20 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
                        <div className="absolute right-0 top-0 bottom-0 w-12 md:w-20 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

                        {/* 모바일 스와이프 힌트 화살표 */}
                        {showSwipeHint && isMobile && (
                            <>
                                <motion.div
                                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 pointer-events-none"
                                    animate={{ x: [0, -8, 0], opacity: [0.7, 1, 0.7] }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                                >
                                    <ChevronLeft className="w-8 h-8 text-white/60" />
                                </motion.div>
                                <motion.div
                                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 pointer-events-none"
                                    animate={{ x: [0, 8, 0], opacity: [0.7, 1, 0.7] }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                                >
                                    <ChevronRight className="w-8 h-8 text-white/60" />
                                </motion.div>
                            </>
                        )}

                        <motion.div
                            className="flex items-center"
                            animate={showSwipeHint && isMobile ? swipeHintControls : {
                                x: `calc(50% - ${cardSize.offset}px - ${currentIndex * (cardSize.width + cardSize.margin * 2)}px)`,
                            }}
                            initial={{
                                x: `calc(50% - ${cardSize.offset}px - ${currentIndex * (cardSize.width + cardSize.margin * 2)}px)`,
                            }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                            onTouchStart={onTouchStart}
                            onTouchMove={onTouchMove}
                            onTouchEnd={onTouchEnd}
                        >
                            {ostCards.map((card, idx) => {
                                const isActive = idx === currentIndex;

                                // 비활성 카드 클릭 시 해당 트랙으로 이동 및 재생
                                const handleCardClick = () => {
                                    if (!isActive) {
                                        changeTrack(idx, true);
                                    }
                                };

                                return (
                                    <div
                                        key={idx}
                                        onClick={handleCardClick}
                                        className={`group relative flex-shrink-0 w-[240px] sm:w-[360px] md:w-[520px] mx-[8px] sm:mx-[16px] md:mx-[20px] rounded-3xl transition-all duration-500 ${
                                            isActive
                                                ? 'scale-100 opacity-100'
                                                : 'scale-[0.92] opacity-70 cursor-pointer md:hover:opacity-90 md:hover:scale-[0.94]'
                                        }`}
                                        style={{ minHeight: '240px' }}
                                    >
                                        {/* 그라데이션 테두리 배경 (호버 시 표시) - 각 카드 고유 색상 */}
                                        {!isActive && (
                                            <div
                                                className="absolute inset-0 rounded-3xl opacity-0 md:group-hover:opacity-100 transition-opacity duration-500"
                                                style={{
                                                    background: card.accentGradient,
                                                    padding: '2px',
                                                }}
                                            >
                                                <div className="w-full h-full rounded-[22px] bg-black" />
                                            </div>
                                        )}

                                        {/* 카드 내용 */}
                                        <div
                                            className={`relative w-full h-full p-5 sm:p-6 md:p-8 rounded-3xl transition-all duration-500 ${
                                                isActive
                                                    ? `bg-white/[0.03] border-2 ${card.accentBorder}`
                                                    : 'bg-white/[0.02] border-2 border-white/20 md:group-hover:border-transparent'
                                            }`}
                                            style={{ minHeight: '240px' }}
                                        >
                                        {/* PC: 재생 버튼 - 카드 정중앙 하단 */}
                                        {isActive && (
                                            <motion.button
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.1 }}
                                                onClick={togglePlay}
                                                className={`hidden md:flex absolute bottom-6 z-20 w-14 h-14 items-center justify-center rounded-full transition-all duration-300 ${
                                                    isPlaying
                                                        ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                                                        : 'bg-white/10 hover:bg-white/20 text-white'
                                                }`}
                                                style={{ left: 'calc(50% - 28px)' }}
                                                aria-label={isPlaying ? '일시정지' : '재생'}
                                            >
                                                {isPlaying ? (
                                                    <Pause className="w-6 h-6" />
                                                ) : (
                                                    <Play className="w-6 h-6 ml-0.5" />
                                                )}
                                            </motion.button>
                                        )}

                                        <div className="relative z-10">
                                            {/* 작품명 */}
                                            <p className={`text-sm md:text-base 3xl:text-lg mb-1 transition-colors duration-500 ${
                                                isActive ? 'text-white/60' : 'text-white/40'
                                            }`}>
                                                {card.workTitle}
                                            </p>

                                            {/* OST 타이틀 */}
                                            <h3 className={`text-2xl md:text-3xl 3xl:text-5xl font-bold mb-3 break-keep ${
                                                isActive ? card.accentText : 'text-white/60'
                                            }`}>
                                                {card.trackTitle}
                                            </h3>

                                            {/* 설명 */}
                                            <p className={`text-sm md:text-base 3xl:text-xl mb-5 leading-relaxed transition-colors duration-500 break-keep ${
                                                isActive ? 'text-white/70' : 'text-white/50'
                                            }`}>
                                                {card.description}
                                            </p>

                                            {/* 더보기 버튼 - 오른쪽 하단 */}
                                            {isActive && (
                                                <motion.a
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: 0.1 }}
                                                    href={card.youtubeLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`absolute -bottom-3 -right-2 sm:-bottom-5 sm:-right-4 inline-flex items-center gap-1 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 ${card.accentText} bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20`}
                                                >
                                                    <span className="sm:hidden">더보기</span>
                                                    <span className="hidden sm:inline">YouTube에서 보기</span>
                                                    <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                                </motion.a>
                                            )}
                                        </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </motion.div>
                    </div>
                </div>

                {/* 모바일 컨트롤 */}
                <div className="md:hidden relative flex items-center justify-center gap-6 mb-8">
                    {/* 이전 트랙 */}
                    <button
                        onClick={goToPrevious}
                        className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300"
                        aria-label="이전 OST"
                    >
                        <SkipBack className="w-5 h-5 text-white/70" />
                    </button>

                    {/* 재생/일시정지 */}
                    <button
                        onClick={togglePlay}
                        className={`w-16 h-16 flex items-center justify-center rounded-full transition-all duration-300 ${
                            isPlaying
                                ? 'bg-emerald-500 hover:bg-emerald-400 text-black scale-105'
                                : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                        aria-label={isPlaying ? '일시정지' : '재생'}
                    >
                        {isPlaying ? (
                            <Pause className="w-7 h-7" />
                        ) : (
                            <Play className="w-7 h-7 ml-1" />
                        )}
                    </button>

                    {/* 다음 트랙 */}
                    <button
                        onClick={goToNext}
                        className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300"
                        aria-label="다음 OST"
                    >
                        <SkipForward className="w-5 h-5 text-white/70" />
                    </button>
                </div>

                {/* 음량 조절 - PC에서만 표시 */}
                <div className="hidden md:flex items-center justify-center gap-3 mb-6">
                    <button
                        onClick={toggleMute}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors"
                        aria-label={isMuted ? '음소거 해제' : '음소거'}
                    >
                        {isMuted || volume === 0 ? (
                            <VolumeX className="w-5 h-5 text-white/50" />
                        ) : (
                            <Volume2 className="w-5 h-5 text-white/50" />
                        )}
                    </button>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={isMuted ? 0 : volume}
                        onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                        className="w-24 h-1 bg-white/20 rounded-full appearance-none cursor-pointer
                            [&::-webkit-slider-thumb]:appearance-none
                            [&::-webkit-slider-thumb]:w-3
                            [&::-webkit-slider-thumb]:h-3
                            [&::-webkit-slider-thumb]:bg-white
                            [&::-webkit-slider-thumb]:rounded-full
                            [&::-webkit-slider-thumb]:cursor-pointer
                            [&::-webkit-slider-thumb]:hover:bg-emerald-400
                            [&::-webkit-slider-thumb]:transition-colors"
                        aria-label="음량 조절"
                    />
                    <span className="text-xs text-white/40 w-8">
                        {Math.round((isMuted ? 0 : volume) * 100)}%
                    </span>
                </div>

                {/* 페이지네이션 인디케이터 */}
                <div className="flex justify-center gap-2 mb-12">
                    {ostCards.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => goToSlide(idx)}
                            className={`h-2 rounded-full transition-all duration-500 hover:bg-emerald-400 ${
                                idx === currentIndex
                                    ? 'bg-emerald-500 w-8'
                                    : 'bg-white/30 w-2 hover:w-3'
                            }`}
                            aria-label={`${idx + 1}번 OST로 이동`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};
