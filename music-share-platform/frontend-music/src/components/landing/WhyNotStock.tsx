import { useState, useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { X, Check, Play, Pause, Volume2 } from 'lucide-react';

const leftItems = [
    { text: "분위기 중심", isNegative: true },
    { text: "장면 맥락 반영 한계", isNegative: true },
    { text: "단발 사용 전제", isNegative: true },
];

const rightItems = [
    { text: "회차·장면·전개 기반 설계", isNegative: false },
    { text: "원고 중심 연출", isNegative: false },
    { text: "장기 연재 흐름 고려", isNegative: false },
];

export const WhyNotStock = () => {
    const sectionRef = useRef<HTMLElement>(null);
    const leftAudioRef = useRef<HTMLAudioElement>(null);
    const rightAudioRef = useRef<HTMLAudioElement>(null);
    const isInView = useInView(sectionRef, { once: false, amount: 0.5 });

    const [playingAudio, setPlayingAudio] = useState<'none' | 'left' | 'right'>('none');
    const [isSequencePlaying, setIsSequencePlaying] = useState(false);
    const sequenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // 섹션 벗어나면 정지
    useEffect(() => {
        if (!isInView) {
            leftAudioRef.current?.pause();
            rightAudioRef.current?.pause();
            setPlayingAudio('none');
            setIsSequencePlaying(false);
            if (sequenceTimeoutRef.current) {
                clearTimeout(sequenceTimeoutRef.current);
            }
        }
    }, [isInView]);

    const toggleAudio = (side: 'left' | 'right') => {
        const leftAudio = leftAudioRef.current;
        const rightAudio = rightAudioRef.current;

        if (!leftAudio || !rightAudio) return;

        // 기존 타임아웃 클리어
        if (sequenceTimeoutRef.current) {
            clearTimeout(sequenceTimeoutRef.current);
        }

        if (side === 'left') {
            if (playingAudio === 'left') {
                // 재생 중이면 정지
                leftAudio.pause();
                setPlayingAudio('none');
                setIsSequencePlaying(false);
            } else {
                // 왼쪽 재생 시작 → 7초 후 오른쪽으로 자동 전환
                rightAudio.pause();
                leftAudio.currentTime = 0;
                leftAudio.play().catch(() => {});
                setPlayingAudio('left');
                setIsSequencePlaying(true);

                sequenceTimeoutRef.current = setTimeout(() => {
                    leftAudio.pause();
                    rightAudio.currentTime = 0;
                    rightAudio.play().catch(() => {});
                    setPlayingAudio('right');

                    sequenceTimeoutRef.current = setTimeout(() => {
                        rightAudio.pause();
                        setPlayingAudio('none');
                        setIsSequencePlaying(false);
                    }, 8000);
                }, 7000);
            }
        } else {
            // 오른쪽 버튼은 개별 재생/정지
            setIsSequencePlaying(false);
            if (playingAudio === 'right') {
                rightAudio.pause();
                setPlayingAudio('none');
            } else {
                leftAudio.pause();
                rightAudio.currentTime = 0;
                rightAudio.play().catch(() => {});
                setPlayingAudio('right');
            }
        }
    };

    const isLeftPlaying = playingAudio === 'left';
    const isRightPlaying = playingAudio === 'right';

    return (
        <section ref={sectionRef} className="py-24 px-6 bg-black">
            {/* 숨겨진 오디오 요소 */}
            <audio ref={leftAudioRef} src="/audio/stock-music.mp3" preload="auto" />
            <audio ref={rightAudioRef} src="/audio/routelabel-music.mp3" preload="auto" />

            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl md:text-5xl font-black mb-6">
                        음악은 많지만, <br />
                        <span className="text-emerald-500">연출</span>은 다릅니다
                    </h2>
                </motion.div>

                {/* 통합 비교 카드 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="rounded-3xl border border-white/10 bg-white/[0.02] overflow-hidden mb-12"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2">
                        {/* 왼쪽: 일반 음원 */}
                        <div className={`p-8 md:p-10 transition-all duration-300 ${isLeftPlaying ? 'bg-white/5' : ''}`}>
                            <div className="flex items-center gap-3 mb-6">
                                <h3 className="text-lg font-bold text-white/50">
                                    일반 음원 / AI
                                </h3>
                                {isLeftPlaying && (
                                    <div className="flex items-center gap-2 text-white/60">
                                        <Volume2 className="w-4 h-4 animate-pulse" />
                                        <span className="text-xs">재생 중</span>
                                    </div>
                                )}
                            </div>

                            <ul className="space-y-4 mb-8">
                                {leftItems.map((item, idx) => (
                                    <li key={idx} className="flex items-center gap-3">
                                        <X className="w-5 h-5 text-red-400/60 flex-shrink-0" />
                                        <span className="text-white/40">{item.text}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* 재생 버튼 */}
                            <div className="flex flex-col items-center gap-2">
                                <button
                                    onClick={() => toggleAudio('left')}
                                    className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 ${
                                        isLeftPlaying
                                            ? 'bg-white/30 text-white scale-105'
                                            : 'bg-white/10 hover:bg-white/20 text-white/60 hover:scale-105'
                                    }`}
                                >
                                    {isLeftPlaying ? (
                                        <Pause className="w-5 h-5" />
                                    ) : (
                                        <Play className="w-5 h-5 ml-0.5" />
                                    )}
                                </button>
                                <span className="text-xs text-white/40">
                                    {isLeftPlaying ? '일시정지' : '샘플 듣기'}
                                </span>
                            </div>
                        </div>

                        {/* 오른쪽: ROUTELABEL */}
                        <div className={`p-8 md:p-10 border-t md:border-t-0 md:border-l border-white/10 transition-all duration-300 ${
                            isRightPlaying ? 'bg-emerald-500/10' : 'bg-emerald-500/[0.03]'
                        }`}>
                            <div className="flex items-center gap-3 mb-6">
                                <h3 className="text-lg font-bold text-emerald-400">
                                    ROUTELABEL
                                </h3>
                                {isRightPlaying && (
                                    <div className="flex items-center gap-2 text-emerald-400">
                                        <Volume2 className="w-4 h-4 animate-pulse" />
                                        <span className="text-xs">재생 중</span>
                                    </div>
                                )}
                            </div>

                            <ul className="space-y-4 mb-8">
                                {rightItems.map((item, idx) => (
                                    <li key={idx} className="flex items-center gap-3">
                                        <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                                        <span className="text-white/80">{item.text}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* 재생 버튼 */}
                            <div className="flex flex-col items-center gap-2">
                                <button
                                    onClick={() => toggleAudio('right')}
                                    className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 ${
                                        isRightPlaying
                                            ? 'bg-emerald-500 text-black scale-105'
                                            : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 hover:scale-105'
                                    }`}
                                >
                                    {isRightPlaying ? (
                                        <Pause className="w-5 h-5" />
                                    ) : (
                                        <Play className="w-5 h-5 ml-0.5" />
                                    )}
                                </button>
                                <span className="text-xs text-emerald-400/60">
                                    {isRightPlaying ? '일시정지' : '샘플 듣기'}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>

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
