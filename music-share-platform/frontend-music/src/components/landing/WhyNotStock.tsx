import { useState, useRef, useEffect } from 'react';
import { motion, useInView, useAnimation } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCardSize, useIsMobile } from '../../hooks/useResponsive';

// 장르별 카드 데이터
const genreCards = [
    {
        genre: "액션 / 배틀",
        description: "전투와 각성의 순간을 음악으로 극대화합니다.",
        features: ["고조되는 텐션 설계", "캐릭터 각성 테마", "임팩트 있는 타이밍"],
        accentText: "text-red-400",
        accentBorder: "border-red-400",
        accentDot: "bg-red-400",
        accentGradient: "linear-gradient(135deg, rgba(248,113,113,0.8), rgba(248,113,113,0.2), rgba(248,113,113,0.6))",
        audioSrc: "/audio/액션 테마.mp3",
        youtubeLink: "https://www.youtube.com/@routelabel",
    },
    {
        genre: "로맨스",
        description: "설렘과 애틋함, 그리고 이별의 감정선을 섬세하게 담아냅니다.",
        features: ["감정선 따라가는 멜로디", "캐릭터 케미 표현", "클라이맥스 연출"],
        accentText: "text-pink-400",
        accentBorder: "border-pink-400",
        accentDot: "bg-pink-400",
        accentGradient: "linear-gradient(135deg, rgba(244,114,182,0.8), rgba(244,114,182,0.2), rgba(244,114,182,0.6))",
        audioSrc: "/audio/발라드 테마.mp3",
        youtubeLink: "https://www.youtube.com/@routelabel",
    },
    {
        genre: "공포 / 호러",
        description: "반전과 긴장, 공포의 순간을 청각적으로 완성합니다.",
        features: ["불안감 조성", "반전 포인트 강조", "심리적 압박감"],
        accentText: "text-purple-400",
        accentBorder: "border-purple-400",
        accentDot: "bg-purple-400",
        accentGradient: "linear-gradient(135deg, rgba(192,132,252,0.8), rgba(192,132,252,0.2), rgba(192,132,252,0.6))",
        audioSrc: "/audio/공포 호러 테마.mp3",
        youtubeLink: "https://www.youtube.com/@routelabel",
    },
    {
        genre: "판타지 / 이세계",
        description: "웅장한 세계관과 마법의 순간을 음악으로 구현합니다.",
        features: ["세계관 몰입도 강화", "마법/스킬 효과음", "에픽한 스케일"],
        accentText: "text-blue-400",
        accentBorder: "border-blue-400",
        accentDot: "bg-blue-400",
        accentGradient: "linear-gradient(135deg, rgba(96,165,250,0.8), rgba(96,165,250,0.2), rgba(96,165,250,0.6))",
        audioSrc: "/audio/판타지 테마.mp3",
        youtubeLink: "https://www.youtube.com/@routelabel",
    },
    {
        genre: "스포츠",
        description: "승리를 향한 열정과 도전의 순간을 음악으로 담아냅니다.",
        features: ["긴장감 고조", "승리의 순간 강조", "팀워크와 열정 표현"],
        accentText: "text-lime-400",
        accentBorder: "border-lime-400",
        accentDot: "bg-lime-400",
        accentGradient: "linear-gradient(135deg, rgba(163,230,53,0.8), rgba(163,230,53,0.2), rgba(163,230,53,0.6))",
        audioSrc: "/audio/스포츠 테마.mp3",
        youtubeLink: "https://www.youtube.com/@routelabel",
    },
    {
        genre: "일상 / 코믹",
        description: "유쾌하고 편안한 분위기로 독자에게 휴식을 선사합니다.",
        features: ["개그 타이밍 강조", "편안한 배경 음악", "상황별 효과음"],
        accentText: "text-amber-400",
        accentBorder: "border-amber-400",
        accentDot: "bg-amber-400",
        accentGradient: "linear-gradient(135deg, rgba(251,191,36,0.8), rgba(251,191,36,0.2), rgba(251,191,36,0.6))",
        audioSrc: "/audio/일상-코믹 테마.mp3",
        youtubeLink: "https://www.youtube.com/@routelabel",
    },
    {
        genre: "국악 / 동양",
        description: "동양적 정서와 전통의 멋을 현대적으로 재해석합니다.",
        features: ["전통악기 활용", "동양적 선율", "역사/무협 장르 특화"],
        accentText: "text-amber-500",
        accentBorder: "border-amber-500",
        accentDot: "bg-amber-500",
        accentGradient: "linear-gradient(135deg, rgba(245,158,11,0.8), rgba(245,158,11,0.2), rgba(245,158,11,0.6))",
        audioSrc: "/audio/국악-동양 테마.mp3",
        youtubeLink: "https://www.youtube.com/@routelabel",
    },
];

export const WhyNotStock = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.7);
    const [isMuted, setIsMuted] = useState(false);

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
        audio.src = genreCards[currentIndex].audioSrc;
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
        const newIndex = currentIndex === 0 ? genreCards.length - 1 : currentIndex - 1;
        changeTrack(newIndex, true);
    };

    // 다음 트랙으로 이동 + 재생
    const goToNext = () => {
        const newIndex = (currentIndex + 1) % genreCards.length;
        changeTrack(newIndex, true);
    };

    // 특정 슬라이드로 이동 (페이지네이션)
    const goToSlide = (index: number) => {
        setCurrentIndex(index);
    };

    // 터치 이벤트 (방향 잠금 포함 - native listener로 preventDefault 허용)
    const touchStartY = useRef<number | null>(null);
    const isHorizontalSwipe = useRef<boolean | null>(null);
    const touchStartRef = useRef<number | null>(null);
    const touchEndRef = useRef<number | null>(null);
    const carouselTouchRef = useRef<HTMLDivElement>(null);

    const onTouchStart = (e: React.TouchEvent) => {
        touchStartRef.current = e.targetTouches[0].clientX;
        touchEndRef.current = null;
        touchStartY.current = e.targetTouches[0].clientY;
        isHorizontalSwipe.current = null;
    };

    useEffect(() => {
        const el = carouselTouchRef.current;
        if (!el) return;

        const handleTouchMove = (e: TouchEvent) => {
            const clientX = e.touches[0].clientX;
            touchEndRef.current = clientX;

            if (isHorizontalSwipe.current === null && touchStartRef.current !== null && touchStartY.current !== null) {
                const dx = Math.abs(clientX - touchStartRef.current);
                const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
                if (dx > 10 || dy > 10) {
                    isHorizontalSwipe.current = dx > dy;
                }
            }

            if (isHorizontalSwipe.current) {
                e.preventDefault();
            }
        };

        el.addEventListener('touchmove', handleTouchMove, { passive: false });
        return () => el.removeEventListener('touchmove', handleTouchMove);
    }, []);

    const onTouchEnd = () => {
        if (!touchStartRef.current || !touchEndRef.current || !isHorizontalSwipe.current) return;

        const distance = touchStartRef.current - touchEndRef.current;
        if (distance > minSwipeDistance) goToNext();
        if (distance < -minSwipeDistance) goToPrevious();
    };

    // 오디오 끝났을 때 - 다음 곡 자동 재생
    const handleAudioEnded = () => {
        goToNext();
    };

    return (
        <section id="genre-bgm" ref={sectionRef} className="py-24 px-6 bg-black overflow-hidden scroll-mt-0">
            {/* 오디오 요소 - 장르별 샘플 음악 (metadata만 프리로드하여 초기 로딩 최적화) */}
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
                        어떤 <span className="text-emerald-500">BGM</span>이 필요하신가요?
                    </h2>
                    <p className="text-white/50 text-base md:text-lg 3xl:text-2xl">
                        웹툰만을 위한 루트레이블의 음악들입니다.
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
                            ref={carouselTouchRef}
                            className="flex items-center"
                            style={{ touchAction: 'pan-y' }}
                            animate={showSwipeHint && isMobile ? swipeHintControls : {
                                x: `calc(50% - ${cardSize.offset}px - ${currentIndex * (cardSize.width + cardSize.margin * 2)}px)`,
                            }}
                            initial={{
                                x: `calc(50% - ${cardSize.offset}px - ${currentIndex * (cardSize.width + cardSize.margin * 2)}px)`,
                            }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                            onTouchStart={onTouchStart}
                            onTouchEnd={onTouchEnd}
                        >
                            {genreCards.map((card, idx) => {
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
                                        {/* PC: 재생 버튼 - 카드 정중앙 하단 (calc로 패딩 보정) */}
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
                                            {/* 장르 타이틀 */}
                                            <h3 className={`text-2xl md:text-3xl 3xl:text-5xl font-bold mb-3 break-keep ${
                                                isActive ? card.accentText : 'text-white/60'
                                            }`}>
                                                {card.genre}
                                            </h3>

                                            {/* 설명 */}
                                            <p className={`text-sm md:text-base 3xl:text-xl mb-5 leading-relaxed transition-colors duration-500 break-keep ${
                                                isActive ? 'text-white/70' : 'text-white/50'
                                            }`}>
                                                {card.description}
                                            </p>

                                            {/* 특징 리스트 */}
                                            {isActive && (
                                                <motion.ul
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="space-y-2"
                                                >
                                                    {card.features.map((feature, fidx) => (
                                                        <li key={fidx} className="flex items-center gap-2 text-sm text-white/50">
                                                            <span className={`w-1.5 h-1.5 rounded-full ${card.accentDot}`} />
                                                            {feature}
                                                        </li>
                                                    ))}
                                                </motion.ul>
                                            )}


                                            {/* 더보기 버튼 - 오른쪽 하단 (원래 위치 유지) */}
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
                                                    자세히
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
                        aria-label="이전 장르"
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
                        aria-label="다음 장르"
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
                    {genreCards.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => goToSlide(idx)}
                            className={`h-2 rounded-full transition-all duration-500 hover:bg-emerald-400 ${
                                idx === currentIndex
                                    ? 'bg-emerald-500 w-8'
                                    : 'bg-white/30 w-2 hover:w-3'
                            }`}
                            aria-label={`${idx + 1}번 장르로 이동`}
                        />
                    ))}
                </div>

                {/* 하단 문장 */}
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-center text-white/50 text-base md:text-lg 3xl:text-2xl max-w-2xl 3xl:max-w-4xl mx-auto leading-relaxed"
                >
                    
                </motion.p>
            </div>
        </section>
    );
};
