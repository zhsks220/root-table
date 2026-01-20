import { motion, useScroll, useTransform, MotionValue, useInView } from 'framer-motion';
import { useRef } from 'react';

// 패널 이미지 import
import panel1 from '../../assets/panels/panel1.png';
import panel2 from '../../assets/panels/panel2.png';
import panel3 from '../../assets/panels/panel3.png';
import panel4 from '../../assets/panels/panel4.png';
import panel5 from '../../assets/panels/panel5.png';

// 애니메이션 타이밍 상수 (PC용)
const ANIMATION = {
    PANEL_START: 0.08,
    PANEL_INTERVAL: 0.06,
    PANEL_DURATION: 0.10,
    FADE_OUT_START: 0.50,
    FADE_OUT_END: 0.62,
    CONCLUSION_START: 0.58,
    CONCLUSION_END: 0.70,
} as const;

// 패널 데이터
const panels = [
    { id: 1, src: panel1, alt: "웹툰 작가 - BGM 연출 고민" },
    { id: 2, src: panel2, alt: "바쁜 PD - 시간 없음" },
    { id: 3, src: panel3, alt: "설명하기 어려움" },
    { id: 4, src: panel4, alt: "OST 앨범 제작" },
    { id: 5, src: panel5, alt: "캐릭터 서사 음악화" },
];

// ========== PC용 컴포넌트 (스크롤 애니메이션) ==========

// PC 헤드라인 컴포넌트
const DesktopHeadline = ({ progress }: { progress: MotionValue<number> }) => {
    const opacity = useTransform(progress, [ANIMATION.FADE_OUT_START, ANIMATION.FADE_OUT_END], [1, 0]);

    return (
        <motion.div className="text-center mb-8 mt-20" style={{ opacity }}>
            <h2 className="text-5xl 3xl:text-7xl font-black">
                <span className="whitespace-nowrap">잘 맞는 <span className="text-emerald-500">프로젝트</span>가</span> <br />
                있습니다.
            </h2>
        </motion.div>
    );
};

// PC 결론 텍스트 컴포넌트
const DesktopConclusionText = ({ progress }: { progress: MotionValue<number> }) => {
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
            <h3 className="text-6xl 3xl:text-8xl font-black leading-tight text-center">
                이런 고민들, <br />
                <span className="text-emerald-500">우리가 해결합니다.</span>
            </h3>
        </motion.div>
    );
};

// PC 개별 패널 컴포넌트
const DesktopMangaPanel = ({
    panel,
    index,
    progress,
    size,
}: {
    panel: typeof panels[0];
    index: number;
    progress: MotionValue<number>;
    size: number;
}) => {
    const start = ANIMATION.PANEL_START + index * ANIMATION.PANEL_INTERVAL;
    const end = start + ANIMATION.PANEL_DURATION;

    const opacity = useTransform(progress, [start, end, ANIMATION.FADE_OUT_START, ANIMATION.FADE_OUT_END], [0, 1, 1, 0]);
    const scale = useTransform(progress, [start, end], [0.85, 1]);

    return (
        <motion.div
            style={{
                opacity,
                scale,
                width: size,
                height: size,
                willChange: 'transform, opacity',
            }}
        >
            <img
                src={panel.src}
                alt={panel.alt}
                className="w-full h-full object-contain"
                style={{
                    border: '3px solid #fff',
                    boxShadow: '4px 4px 0 rgba(255,255,255,0.3)',
                }}
            />
        </motion.div>
    );
};

// PC 그리드 레이아웃
const DesktopGrid = ({ progress }: { progress: MotionValue<number> }) => {
    const gridOpacity = useTransform(progress, [ANIMATION.FADE_OUT_START, ANIMATION.FADE_OUT_END], [1, 0]);

    const size = 320;
    const gap = 12;

    return (
        <motion.div
            className="flex items-center justify-center gap-3"
            style={{ opacity: gridOpacity }}
        >
            {/* 왼쪽 2개 (세로) */}
            <div className="flex flex-col" style={{ gap }}>
                <DesktopMangaPanel panel={panels[0]} index={0} progress={progress} size={size} />
                <DesktopMangaPanel panel={panels[1]} index={1} progress={progress} size={size} />
            </div>

            {/* 가운데 1개 (큰 사이즈) */}
            <DesktopMangaPanel panel={panels[2]} index={2} progress={progress} size={size * 2 + gap} />

            {/* 오른쪽 2개 (세로) */}
            <div className="flex flex-col" style={{ gap }}>
                <DesktopMangaPanel panel={panels[3]} index={3} progress={progress} size={size} />
                <DesktopMangaPanel panel={panels[4]} index={4} progress={progress} size={size} />
            </div>
        </motion.div>
    );
};

// PC 섹션 (스크롤 애니메이션)
const DesktopSection = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    return (
        <div ref={containerRef} className="hidden md:block relative h-[280vh]">
            <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden">
                <DesktopHeadline progress={scrollYProgress} />
                <DesktopGrid progress={scrollYProgress} />
                <DesktopConclusionText progress={scrollYProgress} />
            </div>
        </div>
    );
};

// ========== 모바일용 컴포넌트 (일반 스크롤) ==========

// 모바일 패널 (viewport 진입 시 fade in)
const MobileMangaPanel = ({ panel, index }: { panel: typeof panels[0]; index: number }) => {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="w-full"
        >
            <img
                src={panel.src}
                alt={panel.alt}
                className="w-full h-auto object-contain"
                style={{
                    border: '3px solid #fff',
                    boxShadow: '4px 4px 0 rgba(255,255,255,0.3)',
                }}
            />
        </motion.div>
    );
};

// 모바일 섹션 (일반 스크롤 + 마지막에 결론 오버레이)
const MobileSection = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    // 전체 섹션 스크롤 진행도
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    // 마지막 구간에서 전환, 섹션 벗어나면 사라짐
    // 0.80~0.90: 결론 나타남
    // 0.95~1.0: 결론 사라짐 (섹션 벗어남)
    const conclusionOpacity = useTransform(scrollYProgress, [0.80, 0.90, 0.95, 1.0], [0, 1, 1, 0]);
    const panelsOpacity = useTransform(scrollYProgress, [0.80, 0.90], [1, 0]);

    return (
        <div ref={containerRef} className="md:hidden relative">
            {/* 결론 - 항상 화면 중앙에 고정, 처음엔 투명 */}
            <motion.div
                className="fixed inset-0 flex items-center justify-center px-4 bg-black pointer-events-none z-10"
                style={{ opacity: conclusionOpacity }}
            >
                <h3 className="text-3xl font-black leading-tight text-center">
                    이런 고민들, <br />
                    <span className="text-emerald-500">우리가 해결합니다.</span>
                </h3>
            </motion.div>

            {/* 스크롤 콘텐츠 */}
            <motion.div style={{ opacity: panelsOpacity }}>
                {/* 헤드라인 */}
                <div className="text-center py-16 px-4">
                    <h2 className="text-3xl font-black">
                        <span className="whitespace-nowrap">잘 맞는 <span className="text-emerald-500">프로젝트</span>가</span> <br />
                        있습니다.
                    </h2>
                </div>

                {/* 웹툰 패널들 - 세로 일렬 */}
                <div className="flex flex-col items-center gap-4 max-w-sm mx-auto px-4 pb-8">
                    {panels.map((panel, idx) => (
                        <MobileMangaPanel key={panel.id} panel={panel} index={idx} />
                    ))}
                </div>
            </motion.div>

            {/* 결론 표시를 위한 추가 스크롤 영역 */}
            <div className="h-[50vh]" />
        </div>
    );
};

// ========== 메인 컴포넌트 ==========

export const WhoWeWorkWith = () => {
    return (
        <section id="who-we-work-with" className="bg-black">
            {/* PC: 스크롤 애니메이션 */}
            <DesktopSection />

            {/* 모바일: 일반 스크롤 */}
            <MobileSection />
        </section>
    );
};
