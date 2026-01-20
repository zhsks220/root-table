import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';
import { useRef } from 'react';

// 애니메이션 타이밍 상수
const ANIMATION = {
    BUBBLE_START: 0.25,      // 더 늦게 시작 (0.15 → 0.25)
    BUBBLE_INTERVAL: 0.10,   // 간격 조절 (0.14 → 0.10)
    BUBBLE_DURATION: 0.08,   // 나타나는 시간 (0.10 → 0.08)
    FADE_OUT_START: 0.80,    // 사라지기 시작 (0.85 → 0.80)
    FADE_OUT_END: 0.90,      // 사라지기 완료 (0.95 → 0.90)
    CONCLUSION_START: 0.85,  // 결론 시작 (0.88 → 0.85)
    CONCLUSION_END: 0.95,    // 결론 완료 (0.98 → 0.95)
} as const;

const thoughts = [
    "이번 회차에\nBGM 연출하면 좋을것 같은데..",
    "너무 바빠서 음악 제작 의뢰\n맡길 시간이 없어..",
    "뭔가 머릿속에 떠오르는건 있는데..\n이걸 어떻게 설명해야 하지?",
    "우리 작품 IP도\nOST 앨범 만들어 볼까?",
    "이 캐릭터의 서사를\n음악으로 표현 할순 없을까?"
];

// 말풍선 위치 - 좌우 교차하되 살짝 중앙 쪽으로
const bubblePositions = [
    { x: -8, rotate: -2, tailDir: 'left' },
    { x: 12, rotate: 1.5, tailDir: 'right' },
    { x: -5, rotate: -1, tailDir: 'left' },
    { x: 15, rotate: 2, tailDir: 'right' },
    { x: -10, rotate: -1.5, tailDir: 'left' },
];

// 헤드라인 컴포넌트 - 결론이 나타날 때 사라짐
const Headline = ({ progress }: { progress: MotionValue<number> }) => {
    const opacity = useTransform(progress, [ANIMATION.FADE_OUT_START, ANIMATION.FADE_OUT_END], [1, 0]);

    return (
        <motion.div className="text-center mb-8" style={{ opacity }}>
            <h2 className="text-3xl md:text-5xl 3xl:text-7xl font-black mb-4">
                <span className="whitespace-nowrap">잘 맞는 <span className="text-emerald-500">프로젝트</span>가</span> <br />
                있습니다.
            </h2>
        </motion.div>
    );
};

// 결론 텍스트 컴포넌트 - 말풍선 사라진 후 화면 중앙에 표시
const ConclusionText = ({ progress }: { progress: MotionValue<number> }) => {
    const opacity = useTransform(progress, [ANIMATION.CONCLUSION_START, ANIMATION.CONCLUSION_END], [0, 1]);
    const scale = useTransform(progress, [ANIMATION.CONCLUSION_START, ANIMATION.CONCLUSION_END], [0.9, 1]);

    return (
        <motion.div
            className="absolute inset-0 flex items-center justify-center"
            style={{
                opacity,
                scale,
                willChange: 'transform, opacity',
            }}
        >
            <h3 className="text-4xl md:text-6xl 3xl:text-8xl font-black leading-tight text-center">
                이런 고민들, <br />
                <span className="text-emerald-500">우리가 해결합니다.</span>
            </h3>
        </motion.div>
    );
};

// 생각 말풍선 컴포넌트 (구름 꼬리)
const ThoughtBubble = ({
    children,
    position,
    index,
    progress,
}: {
    children: React.ReactNode;
    position: typeof bubblePositions[0];
    index: number;
    progress: MotionValue<number>;
}) => {
    // 각 말풍선이 스크롤 진행에 따라 순차적으로 나타남
    const start = ANIMATION.BUBBLE_START + index * ANIMATION.BUBBLE_INTERVAL;
    const end = start + ANIMATION.BUBBLE_DURATION;

    // 나타날 때: 0.85→1, 사라질 때: 1→1.15 (확대되면서 사라짐)
    const opacity = useTransform(progress, [start, end, ANIMATION.FADE_OUT_START, ANIMATION.FADE_OUT_END], [0, 1, 1, 0]);
    const scale = useTransform(progress, [start, end, ANIMATION.FADE_OUT_START, ANIMATION.FADE_OUT_END], [0.85, 1, 1, 1.15]);
    const y = useTransform(progress, [start, end], [30, 0]);

    const isLeft = position.tailDir === 'left';

    return (
        <motion.div
            className="relative inline-block"
            style={{
                opacity,
                scale,
                y,
                x: `${position.x}%`,
                willChange: 'transform, opacity',
            }}
        >
            {/* 메인 말풍선 - 코믹북 스타일 */}
            <div
                className="relative px-6 py-4 md:px-8 md:py-5"
                style={{
                    borderRadius: '30px',
                    transform: `rotate(${position.rotate}deg)`,
                    background: '#1a1a1a',
                    border: '2px solid #fff',
                    boxShadow: '4px 4px 0 #fff',
                }}
            >
                <span className="text-base md:text-lg 3xl:text-2xl text-white font-bold leading-snug whitespace-pre-line text-center block">
                    {children}
                </span>
            </div>

            {/* 구름 꼬리 - 코믹북 스타일 */}
            <div
                className="absolute"
                style={{
                    top: '100%',
                    left: isLeft ? '20%' : 'auto',
                    right: isLeft ? 'auto' : '20%',
                    marginTop: '-2px',
                }}
            >
                {/* 큰 원 */}
                <div
                    className="absolute"
                    style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: '#1a1a1a',
                        border: '2px solid #fff',
                        boxShadow: '2px 2px 0 #fff',
                        top: '0px',
                        left: isLeft ? '0px' : 'auto',
                        right: isLeft ? 'auto' : '0px',
                    }}
                />
                {/* 중간 원 */}
                <div
                    className="absolute"
                    style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: '#1a1a1a',
                        border: '2px solid #fff',
                        boxShadow: '2px 2px 0 #fff',
                        top: '16px',
                        left: isLeft ? '-8px' : 'auto',
                        right: isLeft ? 'auto' : '-8px',
                    }}
                />
                {/* 작은 원 */}
                <div
                    className="absolute"
                    style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#1a1a1a',
                        border: '2px solid #fff',
                        boxShadow: '1px 1px 0 #fff',
                        top: '28px',
                        left: isLeft ? '-14px' : 'auto',
                        right: isLeft ? 'auto' : '-14px',
                    }}
                />
            </div>
        </motion.div>
    );
};

export const WhoWeWorkWith = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    // 스크롤 진행도 추적 (애플 스타일 - sticky 구간)
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    return (
        <section id="who-we-work-with" className="bg-black">
            {/* 스크롤 영역 */}
            <div ref={containerRef} className="relative h-[250vh]">
                {/* Sticky 컨테이너 */}
                <div className="sticky top-0 h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
                    {/* 헤드라인 - 스크롤 시 사라짐 */}
                    <Headline progress={scrollYProgress} />

                    {/* 말풍선 컨테이너 - 좌우 교차 레이아웃 */}
                    <div className="max-w-3xl mx-auto space-y-3 w-full">
                        {thoughts.map((thought, idx) => (
                            <div
                                key={idx}
                                className={`flex ${idx % 2 === 0 ? 'justify-start' : 'justify-end'}`}
                            >
                                <ThoughtBubble
                                    position={bubblePositions[idx]}
                                    index={idx}
                                    progress={scrollYProgress}
                                >
                                    {thought}
                                </ThoughtBubble>
                            </div>
                        ))}
                    </div>

                    {/* 결론 - 말풍선 사라진 후 중앙에 표시 */}
                    <ConclusionText progress={scrollYProgress} />

                </div>
            </div>
        </section>
    );
};
