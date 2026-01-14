import { useState, useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, ExternalLink } from 'lucide-react';
import { useCardSize } from '../../hooks/useResponsive';

// 장르별 카드 데이터
const genreCards = [
    {
        genre: "액션 / 배틀",
        description: "전투와 각성의 순간을 음악으로 극대화합니다.",
        features: ["고조되는 텐션 설계", "캐릭터 각성 테마", "임팩트 있는 타이밍"],
        accent: "from-red-600/30 via-orange-500/20 to-red-900/40",
        accentText: "text-red-400",
        audioSrc: "/audio/액션 테마.mp3",
        youtubeLink: "https://www.youtube.com/@routelabel",
    },
    {
        genre: "로맨스",
        description: "설렘과 애틋함, 그리고 이별의 감정선을 섬세하게 담아냅니다.",
        features: ["감정선 따라가는 멜로디", "캐릭터 케미 표현", "클라이맥스 연출"],
        accent: "from-pink-600/30 via-rose-400/20 to-fuchsia-900/40",
        accentText: "text-pink-400",
        audioSrc: "/audio/발라드 테마.mp3",
        youtubeLink: "https://www.youtube.com/@routelabel",
    },
    {
        genre: "공포 / 호러",
        description: "반전과 긴장, 공포의 순간을 청각적으로 완성합니다.",
        features: ["불안감 조성", "반전 포인트 강조", "심리적 압박감"],
        accent: "from-purple-700/35 via-violet-500/20 to-slate-900/50",
        accentText: "text-purple-400",
        audioSrc: "/audio/공포 호러 테마.mp3",
        youtubeLink: "https://www.youtube.com/@routelabel",
    },
    {
        genre: "판타지 / 이세계",
        description: "웅장한 세계관과 마법의 순간을 음악으로 구현합니다.",
        features: ["세계관 몰입도 강화", "마법/스킬 효과음", "에픽한 스케일"],
        accent: "from-blue-600/30 via-cyan-400/20 to-indigo-900/40",
        accentText: "text-blue-400",
        audioSrc: "/audio/판타지 테마.mp3",
        youtubeLink: "https://www.youtube.com/@routelabel",
    },
    {
        genre: "스포츠",
        description: "승리를 향한 열정과 도전의 순간을 음악으로 담아냅니다.",
        features: ["긴장감 고조", "승리의 순간 강조", "팀워크와 열정 표현"],
        accent: "from-lime-500/30 via-green-400/20 to-emerald-900/40",
        accentText: "text-lime-400",
        audioSrc: "/audio/스포츠 테마.mp3",
        youtubeLink: "https://www.youtube.com/@routelabel",
    },
    {
        genre: "일상 / 코믹",
        description: "유쾌하고 편안한 분위기로 독자에게 휴식을 선사합니다.",
        features: ["개그 타이밍 강조", "편안한 배경 음악", "상황별 효과음"],
        accent: "from-amber-500/30 via-yellow-400/20 to-orange-800/40",
        accentText: "text-amber-400",
        audioSrc: "/audio/일상-코믹 테마.mp3",
        youtubeLink: "https://www.youtube.com/@routelabel",
    },
    {
        genre: "국악 / 동양",
        description: "동양적 정서와 전통의 멋을 현대적으로 재해석합니다.",
        features: ["전통악기 활용", "동양적 선율", "역사/무협 장르 특화"],
        accent: "from-amber-700/35 via-red-800/25 to-stone-900/50",
        accentText: "text-amber-500",
        audioSrc: "/audio/국악-동양 테마.mp3",
        youtubeLink: "https://www.youtube.com/@routelabel",
    },
];

export const WhyNotStock = () => {
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

    const minSwipeDistance = 50;

    // 섹션 벗어나면 오디오 정지
    useEffect(() => {
        if (!isInView && audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    }, [isInView]);

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

    const currentCard = genreCards[currentIndex];

    return (
        <section ref={sectionRef} className="py-24 px-6 bg-black overflow-hidden">
            {/* 오디오 요소 - 장르별 샘플 음악 */}
            <audio
                ref={audioRef}
                preload="auto"
                onEnded={handleAudioEnded}
            />

            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-5xl 2xl:text-6xl 3xl:text-7xl font-black mb-6">
                        어떤 <span className="text-emerald-500">음악</span>이 필요하신가요?
                    </h2>
                    <p className="text-white/50 text-base md:text-lg 2xl:text-xl 3xl:text-2xl">
                        작품의 감동을 극대화 시킬 수 있는 음악을 만듭니다.
                    </p>
                </motion.div>

                {/* 캐러셀 컨테이너 */}
                <div className="relative mb-8 mx-auto" style={{ maxWidth: '1100px' }}>
                    {/* 슬라이드 영역 */}
                    <div
                        className="relative overflow-hidden mx-auto"
                        style={{ maxWidth: '900px', minHeight: '280px' }}
                    >
                        {/* 양쪽 그라데이션 오버레이 */}
                        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
                        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

                        <motion.div
                            className="flex items-center"
                            animate={{ x: `calc(50% - ${cardSize.offset}px - ${currentIndex * (cardSize.width + cardSize.margin * 2)}px)` }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                            onTouchStart={onTouchStart}
                            onTouchMove={onTouchMove}
                            onTouchEnd={onTouchEnd}
                        >
                            {genreCards.map((card, idx) => {
                                const isActive = idx === currentIndex;

                                return (
                                    <div
                                        key={idx}
                                        className={`relative flex-shrink-0 w-[280px] sm:w-[420px] md:w-[520px] mx-[10px] sm:mx-[20px] p-6 sm:p-8 rounded-3xl transition-all duration-500 backdrop-blur-sm ${
                                            isActive
                                                ? 'bg-white/[0.08] border border-emerald-500/40 scale-100 opacity-100'
                                                : 'bg-white/[0.03] border border-white/10 scale-95 opacity-50'
                                        }`}
                                        style={{ minHeight: '260px' }}
                                    >
                                        {/* 장르별 그라데이션 배경 */}
                                        <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${card.accent} opacity-30 pointer-events-none`} />

                                        <div className="relative z-10">
                                            {/* 장르 타이틀 */}
                                            <h3 className={`text-2xl md:text-3xl 2xl:text-4xl 3xl:text-5xl font-bold mb-3 ${
                                                isActive ? card.accentText : 'text-white/40'
                                            }`}>
                                                {card.genre}
                                            </h3>

                                            {/* 설명 */}
                                            <p className={`text-sm md:text-base 2xl:text-lg 3xl:text-xl mb-5 leading-relaxed transition-colors duration-500 ${
                                                isActive ? 'text-white/70' : 'text-white/30'
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
                                                            <span className={`w-1.5 h-1.5 rounded-full ${card.accentText.replace('text-', 'bg-')}`} />
                                                            {feature}
                                                        </li>
                                                    ))}
                                                </motion.ul>
                                            )}

                                            {/* 더보기 버튼 - 오른쪽 하단 */}
                                            {isActive && (
                                                <motion.a
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: 0.1 }}
                                                    href={card.youtubeLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`absolute -bottom-5 -right-3 sm:-bottom-5 sm:-right-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${card.accentText} bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20`}
                                                >
                                                    더 많은 작품 보기
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </motion.a>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </motion.div>
                    </div>
                </div>

                {/* 유튜브 뮤직 스타일 컨트롤 */}
                <div className="relative flex items-center justify-center gap-6 mb-4">
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

                {/* 음량 조절 */}
                <div className="flex items-center justify-center gap-3 mb-6">
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

                {/* 재생 중 표시 */}
                {isPlaying && (
                    <div className="flex items-center justify-center gap-2 text-emerald-400 mb-6">
                        <Volume2 className="w-4 h-4 animate-pulse" />
                        <span className="text-sm">{currentCard.genre} 샘플 재생 중</span>
                    </div>
                )}

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
                    className="text-center text-white/50 text-base md:text-lg 2xl:text-xl 3xl:text-2xl max-w-2xl 3xl:max-w-4xl mx-auto leading-relaxed"
                >
                    우리는 음악을 만드는 팀이 아니라, <br className="hidden sm:block" />
                    웹툰의 흐름을 함께 설계하는 팀입니다.
                </motion.p>
            </div>
        </section>
    );
};
