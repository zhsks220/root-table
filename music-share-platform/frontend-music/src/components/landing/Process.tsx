import panel1 from '../../assets/panels/panel1.png';
import panel2 from '../../assets/panels/panel2.png';
import panel3 from '../../assets/panels/panel3.png';
import panel4 from '../../assets/panels/panel4.png';
import panel5 from '../../assets/panels/panel5.png';

const steps = [
    {
        title: "원고·콘티 분석",
        description: "작품의 서사 구조와 장면 흐름을 면밀히 분석합니다.",
        image: panel1,
    },
    {
        title: "감정선 & 캐릭터 매핑",
        description: "회차별 감정의 고저와 캐릭터 관계를 음악적으로 해석합니다.",
        image: panel2,
    },
    {
        title: "음악 플롯 설계",
        description: "작품에 어울리는 음악 레퍼런스 방향도 역제안합니다.",
        image: panel3,
    },
    {
        title: "제작 & 수정",
        description: "현업 작곡진의 제작과 피드백 기반 수정을 진행합니다.",
        image: panel4,
    },
    {
        title: "OST / 앨범 / 확장 고려",
        description: "작품의 IP 확장까지 고려한 음악 설계를 완성합니다.",
        image: panel5,
    },
];

// 화살표 컴포넌트 (수평/대각선)
const FlowArrow = ({ type }: { type: 'right' | 'left' | 'down-left' | 'down-right' }) => {
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
        <div className="absolute bottom-0 left-0 right-0 p-5">
            <h3 className="text-lg md:text-xl font-bold text-white mb-1 break-keep">
                {step.title}
            </h3>
            <p className="text-sm md:text-base text-white/70 break-keep leading-relaxed">
                {step.description}
            </p>
        </div>
    </div>
);

export const Process = () => {
    return (
        <section id="process" className="py-24 mt-16 px-6 bg-black overflow-hidden scroll-mt-16">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl 3xl:text-7xl font-black mb-6">
                        마감일까지, <br />
                        <span className="text-emerald-500">체계적으로.</span>
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

                    {/* 대각선 화살표 줄 (3번에서 4번으로) */}
                    <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] gap-4 items-center">
                        <div />
                        <div />
                        <div />
                        <div />
                        <FlowArrow type="down-left" />
                    </div>

                    {/* 두 번째 줄: 5 ← 4 */}
                    <div className="grid grid-cols-[1fr_1fr_auto_1fr_1fr] gap-4 items-center">
                        <div />
                        <div className="w-[320px] justify-self-center"><StepCard step={steps[4]} /></div>
                        <FlowArrow type="left" />
                        <div className="w-[320px] justify-self-center"><StepCard step={steps[3]} /></div>
                        <div />
                    </div>
                </div>

                {/* 모바일 레이아웃: 세로 리스트 */}
                <div className="md:hidden space-y-4">
                    {steps.map((step, idx) => (
                        <StepCard key={idx} step={step} />
                    ))}
                </div>

                {/* 하단 문장 */}
                <p className="text-center text-white/50 text-base md:text-lg 3xl:text-2xl max-w-2xl 3xl:max-w-4xl mx-auto mt-16">
                    이 방식으로, 작품의 흐름과 <br />
                    캐릭터 해석이 흔들리지 않게 음악을 설계합니다.
                </p>
            </div>
        </section>
    );
};
