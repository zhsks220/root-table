import { useState, useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { Play, Pause, Volume2, SkipBack, SkipForward } from 'lucide-react';

// 장르별 카드 데이터
const genreCards = [
    {
        genre: "액션 / 배틀",
        description: "긴장감 넘치는 전투 씬과 캐릭터의 각성 순간을 음악으로 극대화합니다.",
        features: ["고조되는 텐션 설계", "캐릭터 각성 테마", "임팩트 있는 타이밍"],
        accent: "from-red-500/20 to-orange-500/20",
        accentText: "text-red-400",
    },
    {
        genre: "로맨스",
        description: "설렘과 애틋함, 그리고 이별의 감정선을 섬세하게 담아냅니다.",
        features: ["감정선 따라가는 멜로디", "캐릭터 케미 표현", "클라이맥스 연출"],
        accent: "from-pink-500/20 to-rose-500/20",
        accentText: "text-pink-400",
    },
    {
        genre: "스릴러 / 서스펜스",
        description: "반전과 긴장, 공포의 순간을 청각적으로 완성합니다.",
        features: ["불안감 조성", "반전 포인트 강조", "심리적 압박감"],
        accent: "from-purple-500/20 to-violet-500/20",
        accentText: "text-purple-400",
    },
    {
        genre: "판타지 / 이세계",
        description: "웅장한 세계관과 마법의 순간을 음악으로 구현합니다.",
        features: ["세계관 몰입도 강화", "마법/스킬 효과음", "에픽한 스케일"],
        accent: "from-blue-500/20 to-cyan-500/20",
        accentText: "text-blue-400",
    },
    {
        genre: "일상 / 힐링",
        description: "따뜻하고 편안한 분위기로 독자에게 휴식을 선사합니다.",
        features: ["편안한 배경 음악", "감성적인 멜로디", "자연스러운 전환"],
        accent: "from-green-500/20 to-teal-500/20",
        accentText: "text-green-400",
    },
    {
        genre: "코미디 / 개그",
        description: "유쾌한 타이밍과 리듬으로 웃음을 배가시킵니다.",
        features: ["개그 타이밍 강조", "상황별 효과음", "긴장-이완 리듬"],
        accent: "from-yellow-500/20 to-amber-500/20",
        accentText: "text-yellow-400",
    },
    {
        genre: "드라마 / 감동",
        description: "깊은 서사와 캐릭터의 성장을 음악으로 완성합니다.",
        features: ["서사적 깊이 표현", "감정 폭발 연출", "여운 있는 마무리"],
        accent: "from-emerald-500/20 to-emerald-500/20",
        accentText: "text-emerald-400",
    },
];

export const WhyNotStock = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    const sectionRef = useRef<HTMLElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const isInView = useInView(sectionRef, { once: false, amount: 0.5 });

    const minSwipeDistance = 50;

    // 섹션 벗어나면 오디오 정지
    useEffect(() => {
        if (!isInView && audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    }, [isInView]);

    // 오디오 재생/일시정지
    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            audio.currentTime = 0;
            audio.play().catch(() => {});
            setIsPlaying(true);
        }
    };

    // 이전 트랙으로 이동 + 재생
    const goToPrevious = () => {
        const newIndex = currentIndex === 0 ? genreCards.length - 1 : currentIndex - 1;
        setCurrentIndex(newIndex);

        // 오디오 재생
        const audio = audioRef.current;
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(() => {});
            setIsPlaying(true);
        }
    };

    // 다음 트랙으로 이동 + 재생
    const goToNext = () => {
        const newIndex = (currentIndex + 1) % genreCards.length;
        setCurrentIndex(newIndex);

        // 오디오 재생
        const audio = audioRef.current;
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(() => {});
            setIsPlaying(true);
        }
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

    // 오디오 끝났을 때
    const handleAudioEnded = () => {
        setIsPlaying(false);
    };

    const currentCard = genreCards[currentIndex];

    return (
        <section ref={sectionRef} className="py-24 px-6 bg-black overflow-hidden">
            {/* 오디오 요소 - 기존 샘플 음악 사용 */}
            <audio
                ref={audioRef}
                src="/audio/routelabel-music.mp3"
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
                    <h2 className="text-3xl md:text-5xl font-black mb-6">
                        음악은 많지만, <br />
                        <span className="text-emerald-500">연출</span>은 다릅니다
                    </h2>
                    <p className="text-white/50 text-base md:text-lg">
                        장르마다 다른 접근, 작품마다 다른 설계
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
                            animate={{ x: `calc(50% - 200px - ${currentIndex * 420}px)` }}
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
                                        className={`relative flex-shrink-0 w-[380px] mx-[20px] p-8 rounded-3xl transition-all duration-500 backdrop-blur-sm ${
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
                                            <h3 className={`text-xl md:text-2xl font-bold mb-3 ${
                                                isActive ? card.accentText : 'text-white/40'
                                            }`}>
                                                {card.genre}
                                            </h3>

                                            {/* 설명 */}
                                            <p className={`text-sm md:text-base mb-5 leading-relaxed transition-colors duration-500 ${
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
                                        </div>
                                    </div>
                                );
                            })}
                        </motion.div>
                    </div>
                </div>

                {/* 유튜브 뮤직 스타일 컨트롤 */}
                <div className="relative flex items-center justify-center gap-6 mb-8">
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
                    className="text-center text-white/50 text-base md:text-lg max-w-2xl mx-auto leading-relaxed"
                >
                    우리는 음악을 만드는 팀이 아니라, <br />
                    웹툰의 흐름을 함께 설계하는 팀입니다.
                </motion.p>
            </div>
        </section>
    );
};
