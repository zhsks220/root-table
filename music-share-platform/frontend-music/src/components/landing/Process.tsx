import processAnalysis from '../../assets/process/원고 콘티 분석.jpg';
import processEmotion from '../../assets/process/감정선 & 캐릭터 매핑.jpg';
import processPlot from '../../assets/process/음악 플롯 설계.jpg';
import processDirection from '../../assets/process/음악 연출.jpg';
import processRevision from '../../assets/process/수정 & 마감.jpg';
import processExpansion from '../../assets/process/OST 앨범 확장 고려.jpg';

const steps = [
    {
        title: "원고·콘티 분석",
        description: "작품의 서사 구조와 장면 흐름을 면밀히 분석합니다.",
        image: processAnalysis,
    },
    {
        title: "기획 & 설계",
        description: "회차별 감정선과 스토리를 음악적으로 설계합니다.",
        image: processEmotion,
    },
    {
        title: "음원 제작",
        description: "작품에 어울리는 음악을 제작합니다.",
        image: processPlot,
    },
    {
        title: "음악 연출",
        description: "원고를 읽는 속도에 맞춰 적절한 타이밍에 음악을 연출합니다.",
        image: processDirection,
    },
    {
        title: "수정 & 마감",
        description: "현업 작곡진의 제작과 피드백 기반 수정을 진행합니다.",
        image: processRevision,
    },
    {
        title: "OST / 앨범 / IP 확장",
        description: "작품의 IP 확장을 완성합니다.",
        image: processExpansion,
    },
];

// 화살표 컴포넌트 (수평/대각선/수직)
const FlowArrow = ({ type }: { type: 'right' | 'left' | 'down' | 'down-left' | 'down-right' }) => {
    if (type === 'right') {
        return (
            <div className="flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
            </div>
        );
    }
    if (type === 'left') {
        return (
            <div className="flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-500 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
            </div>
        );
    }
    if (type === 'down') {
        return (
            <div className="flex items-center justify-center h-12">
                <svg className="w-8 h-8 text-emerald-500 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
            </div>
        );
    }
    if (type === 'down-left') {
        return (
            <div className="flex items-center justify-center h-12">
                <svg className="w-8 h-8 text-emerald-500 rotate-[135deg]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
            </div>
        );
    }
    // down-right
    return (
        <div className="flex items-center justify-center h-12">
            <svg className="w-8 h-8 text-emerald-500 rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
        </div>
    );
};

// 스텝 카드 컴포넌트 - 이미지 배경 + 왼쪽 하단 텍스트
const StepCard = ({ step }: { step: typeof steps[0] }) => (
    <div className="relative bg-white/[0.03] border border-white/10 hover:border-emerald-500/30 rounded-2xl overflow-hidden transition-all duration-300 group aspect-[4/3] w-full">
        {/* 배경 이미지 */}
        {step.image ? (
            <img
                src={step.image}
                alt={step.title}
                className="absolute inset-0 w-full h-full object-cover brightness-50"
            />
        ) : (
            // 이미지 없을 때 플레이스홀더
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/[0.02]" />
        )}

        {/* 하단 그라데이션 오버레이 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />

        {/* 텍스트 - 왼쪽 하단 */}
        <div className="absolute bottom-0 left-0 right-0 p-3 min-[360px]:p-5">
            <h3 className="text-base min-[360px]:text-lg md:text-xl font-bold text-white mb-1 break-keep">
                {step.title}
            </h3>
            <p className="text-xs min-[360px]:text-sm md:text-base text-white/70 break-keep leading-relaxed">
                {step.description}
            </p>
        </div>
    </div>
);

export const Process = () => {
    return (
        <section id="process" className="py-24 mt-16 px-4 min-[360px]:px-6 bg-black overflow-hidden scroll-mt-16">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-2xl min-[360px]:text-3xl md:text-5xl 3xl:text-7xl font-black mb-6">
                        웹툰을 더 재밌게, <br />
                        <span className="text-emerald-500">마감일까지 체계적으로.</span>
                    </h2>
                </div>

                {/* 데스크탑 레이아웃: 화살표로 플로우 표시 */}
                <div className="hidden md:block">
                    {/* 첫 번째 줄: 1 → 2 → 3 */}
                    <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] gap-4 items-center mb-4">
                        <div className="w-[320px] justify-self-center"><StepCard step={steps[0]} /></div>
                        <FlowArrow type="right" />
                        <div className="w-[320px] justify-self-center"><StepCard step={steps[1]} /></div>
                        <FlowArrow type="right" />
                        <div className="w-[320px] justify-self-center"><StepCard step={steps[2]} /></div>
                    </div>

                    {/* 아래 화살표 줄 (3번에서 4번으로) */}
                    <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] gap-4 items-center">
                        <div />
                        <div />
                        <div />
                        <div />
                        <FlowArrow type="down" />
                    </div>

                    {/* 두 번째 줄: 6 ← 5 ← 4 */}
                    <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] gap-4 items-center">
                        <div className="w-[320px] justify-self-center"><StepCard step={steps[5]} /></div>
                        <FlowArrow type="left" />
                        <div className="w-[320px] justify-self-center"><StepCard step={steps[4]} /></div>
                        <FlowArrow type="left" />
                        <div className="w-[320px] justify-self-center"><StepCard step={steps[3]} /></div>
                    </div>
                </div>

                {/* 모바일 레이아웃: 세로 리스트 */}
                <div className="md:hidden space-y-4">
                    {steps.map((step, idx) => (
                        <StepCard key={idx} step={step} />
                    ))}
                </div>

            </div>
        </section>
    );
};
