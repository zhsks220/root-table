import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useIsMobile } from '../../hooks/useResponsive';

// 실제 독자 반응 데이터 (36개)
const comments = [
    {
        nickname: "@webtoon_lover724",
        avatar: "W",
        avatarColor: "bg-purple-500",
        text: "루트레이블의 음악은 배경음이 아니라 캐릭터 해석을 완성시키는 연출이었다.",
        likes: 847,
        time: "3일 전",
    },
    {
        nickname: "@midnight_reader",
        avatar: "M",
        avatarColor: "bg-blue-500",
        text: "캐릭터를 떠올리면 음악이 함께 떠오를 정도로 테마가 각인되어 있었다.",
        likes: 623,
        time: "1주 전",
    },
    {
        nickname: "@감성충전소",
        avatar: "감",
        avatarColor: "bg-rose-500",
        text: "아쉬운 장면에서도 음악이 감정을 설득하며 연출의 완성도를 끌어올렸다.",
        likes: 512,
        time: "2주 전",
    },
    {
        nickname: "@정주행마스터",
        avatar: "정",
        avatarColor: "bg-emerald-500",
        text: "작품 이해도가 높아 장면의 의도와 감정을 정확히 짚어냈다.",
        likes: 389,
        time: "3주 전",
    },
    {
        nickname: "@webtoon_critic",
        avatar: "C",
        avatarColor: "bg-orange-500",
        text: "다른 웹툰 음악과 비교해도 캐릭터 중심 설계라는 차이가 분명했다.",
        likes: 456,
        time: "1개월 전",
    },
    {
        nickname: "@밤샘독서",
        avatar: "밤",
        avatarColor: "bg-indigo-500",
        text: "장면 전환마다 음악이 정확히 맞물려 연출 컨트롤이 정교했다.",
        likes: 278,
        time: "1개월 전",
    },
    {
        nickname: "@박태준유니버스",
        avatar: "박",
        avatarColor: "bg-red-500",
        text: "Ground 음악 들으면서 보니까 진짜 몰입감이 다르더라.",
        likes: 534,
        time: "2주 전",
    },
    {
        nickname: "@웹툰정주행러",
        avatar: "웹",
        avatarColor: "bg-cyan-500",
        text: "이거 진짜 웹툰 BGM 중에 최고임. 작품 이해도가 남다름.",
        likes: 421,
        time: "1주 전",
    },
    {
        nickname: "@브실러",
        avatar: "브",
        avatarColor: "bg-pink-500",
        text: "브실에서 그림체의 무게감을 살려주는 음악 연출이 대단했음.",
        likes: 367,
        time: "3주 전",
    },
    {
        nickname: "@Hounds팬",
        avatar: "H",
        avatarColor: "bg-violet-500",
        text: "Hounds 읽으면서 음악 틀면 진짜 전투씬 몰입감 미쳤음.",
        likes: 298,
        time: "2주 전",
    },
    {
        nickname: "@음악감상러",
        avatar: "음",
        avatarColor: "bg-amber-500",
        text: "와 근데 이번에 쓰신 음악이 분위기랑 완전히 잘 맞아서 소름돋음.",
        likes: 445,
        time: "1주 전",
    },
    {
        nickname: "@감동이",
        avatar: "감",
        avatarColor: "bg-teal-500",
        text: "침묵하는 장면에서도 음악이 감정을 살려주는 연출이 좋았어요.",
        likes: 312,
        time: "4일 전",
    },
    {
        nickname: "@ㅇㅇ",
        avatar: "ㅇ",
        avatarColor: "bg-slate-500",
        text: "박태준 유니버스 갤러리에서 루트레이블 이야기 많이 나오더라.",
        likes: 189,
        time: "5일 전",
    },
    {
        nickname: "@전설의독자",
        avatar: "전",
        avatarColor: "bg-lime-500",
        text: "키지감이 작업 이후로 거의 2년 만에 다시 들었는데 여전히 좋다.",
        likes: 523,
        time: "1개월 전",
    },
    {
        nickname: "@외모지상주의팬",
        avatar: "외",
        avatarColor: "bg-fuchsia-500",
        text: "외지 보면서 BGM 틀으니까 감정이입 미쳤음 ㄹㅇ",
        likes: 267,
        time: "2주 전",
    },
    {
        nickname: "@킹슬레이어",
        avatar: "킹",
        avatarColor: "bg-sky-500",
        text: "킹슬레이어 곡 터닝포인트에서 나올 때 소름 쫙",
        likes: 345,
        time: "3주 전",
    },
    {
        nickname: "@뮤직러버",
        avatar: "뮤",
        avatarColor: "bg-rose-400",
        text: "전투씬 음악 타이밍 진짜 나이스하게 맞췄더라.",
        likes: 412,
        time: "1주 전",
    },
    {
        nickname: "@웹툰매니아",
        avatar: "매",
        avatarColor: "bg-blue-400",
        text: "스토리 읽으면서 음악 들으니 몰입감이 완전 다름.",
        likes: 289,
        time: "4일 전",
    },
    {
        nickname: "@일상독자",
        avatar: "일",
        avatarColor: "bg-green-500",
        text: "이번 앨범의 콘셉트가 작품 세계관이랑 너무 잘 맞아서 좋았음.",
        likes: 378,
        time: "2주 전",
    },
    {
        nickname: "@음악덕후",
        avatar: "덕",
        avatarColor: "bg-orange-400",
        text: "진짜 연출의 완성은 음악이라는 걸 느끼게 해준 팀.",
        likes: 467,
        time: "1주 전",
    },
    {
        nickname: "@hound_fan",
        avatar: "H",
        avatarColor: "bg-purple-400",
        text: "지인한테 추천받았는데 듣자마자 바로 팬 됐습니다.",
        likes: 234,
        time: "5일 전",
    },
    {
        nickname: "@해외에서",
        avatar: "해",
        avatarColor: "bg-indigo-400",
        text: "해외에서도 웹툰 음악 찾아 듣는데 퀄리티가 진짜 다르네요.",
        likes: 567,
        time: "3일 전",
    },
    {
        nickname: "@전율팬",
        avatar: "전",
        avatarColor: "bg-red-400",
        text: "마지막 전투씬에서 곡이 딱 맞았을 때의 전율 ㄷㄷ",
        likes: 623,
        time: "1주 전",
    },
    {
        nickname: "@비교감상",
        avatar: "비",
        avatarColor: "bg-cyan-400",
        text: "음악 없이 봤다가 다시 음악과 함께 보니까 완전 다름.",
        likes: 445,
        time: "2주 전",
    },
    {
        nickname: "@Little_Wolf",
        avatar: "L",
        avatarColor: "bg-emerald-400",
        text: "Little Wolf 곡 진짜 좋아서 계속 반복재생 중.",
        likes: 334,
        time: "4주 전",
    },
    {
        nickname: "@노래신청",
        avatar: "노",
        avatarColor: "bg-pink-400",
        text: "이거 BGM으로 들으면서 정주행하니까 몰입감 최고.",
        likes: 289,
        time: "1주 전",
    },
    {
        nickname: "@작품이해",
        avatar: "작",
        avatarColor: "bg-violet-400",
        text: "이건 진짜 음악감독이 작품을 제대로 봤다는 증거.",
        likes: 512,
        time: "3주 전",
    },
    {
        nickname: "@아기사자",
        avatar: "아",
        avatarColor: "bg-amber-400",
        text: "브실이 미디어믹스의 완성형이 된 건 음악 덕분.",
        likes: 378,
        time: "2주 전",
    },
    {
        nickname: "@연출팬",
        avatar: "연",
        avatarColor: "bg-teal-400",
        text: "그냥 진짜 음악 넣으니까 캐릭터 해석이 다르더라고요.",
        likes: 445,
        time: "1주 전",
    },
    {
        nickname: "@소울뮤직",
        avatar: "소",
        avatarColor: "bg-slate-400",
        text: "아 근데 이번 앨범은 진짜 MASTERPIECE급임.",
        likes: 534,
        time: "4일 전",
    },
    {
        nickname: "@취향저격",
        avatar: "취",
        avatarColor: "bg-lime-400",
        text: "루트레이블 덕분에 웹툰 보는 게 더 즐거워졌어요.",
        likes: 412,
        time: "2주 전",
    },
    {
        nickname: "@눈물샘",
        avatar: "눈",
        avatarColor: "bg-fuchsia-400",
        text: "감동적인 장면에서 음악 나오니까 눈물이 막 나왔어요ㅜㅜ",
        likes: 367,
        time: "1주 전",
    },
    {
        nickname: "@개인취향",
        avatar: "개",
        avatarColor: "bg-sky-400",
        text: "개인적으로 Wolf랑 Hounds 앨범이 제일 좋았음.",
        likes: 289,
        time: "3주 전",
    },
    {
        nickname: "@캐릭터팬",
        avatar: "캐",
        avatarColor: "bg-rose-300",
        text: "캐릭터 이해도가 음악에 녹아있음.",
        likes: 445,
        time: "2주 전",
    },
    {
        nickname: "@음악완성",
        avatar: "완",
        avatarColor: "bg-blue-300",
        text: "음악이 웹툰의 감정을 완성시킴.",
        likes: 534,
        time: "1주 전",
    },
    {
        nickname: "@정주행중",
        avatar: "정",
        avatarColor: "bg-green-400",
        text: "작가님이 직접 추천하신 음악이라 더 의미있게 들림.",
        likes: 312,
        time: "4일 전",
    },
];

// 배경 댓글 위치 - 레이어별 깊이감 (scale, blur, animationDelay)
// layer: 1=가장 뒤(작고 흐림), 2=중간, 3=앞쪽(크고 선명)
// 중앙 영역(25%-75% 가로, 25%-75% 세로)은 피해서 배치
const backgroundPositions = [
    // 상단 영역 (top 0-20%)
    { left: '1%', top: '3%', rotation: -4, scale: 0.7, layer: 1, delay: 0 },
    { left: '12%', top: '8%', rotation: 5, scale: 0.85, layer: 2, delay: 0.5 },
    { left: '24%', top: '2%', rotation: -3, scale: 0.75, layer: 1, delay: 1.2 },
    { left: '76%', top: '5%', rotation: 4, scale: 0.9, layer: 3, delay: 0.3 },
    { left: '85%', top: '10%', rotation: -5, scale: 0.7, layer: 1, delay: 0.8 },
    { left: '94%', top: '3%', rotation: 3, scale: 0.8, layer: 2, delay: 1.5 },
    // 좌측 영역 (left 0-22%)
    { left: '-2%', top: '25%', rotation: 6, scale: 0.85, layer: 2, delay: 0.2 },
    { left: '8%', top: '38%', rotation: -4, scale: 0.7, layer: 1, delay: 1.0 },
    { left: '2%', top: '52%', rotation: 5, scale: 0.9, layer: 3, delay: 0.6 },
    { left: '10%', top: '68%', rotation: -3, scale: 0.75, layer: 1, delay: 1.3 },
    // 우측 영역 (left 78-100%)
    { left: '80%', top: '28%', rotation: -5, scale: 0.8, layer: 2, delay: 0.4 },
    { left: '92%', top: '35%', rotation: 4, scale: 0.7, layer: 1, delay: 1.1 },
    { left: '82%', top: '50%', rotation: -6, scale: 0.85, layer: 2, delay: 0.7 },
    { left: '94%', top: '62%', rotation: 3, scale: 0.9, layer: 3, delay: 0.1 },
    // 하단 영역 (top 80-100%)
    { left: '2%', top: '82%', rotation: -4, scale: 0.75, layer: 1, delay: 0.9 },
    { left: '15%', top: '88%', rotation: 5, scale: 0.85, layer: 2, delay: 1.4 },
    { left: '28%', top: '85%', rotation: -3, scale: 0.7, layer: 1, delay: 0.2 },
    { left: '72%', top: '83%', rotation: 4, scale: 0.8, layer: 2, delay: 0.5 },
    { left: '84%', top: '90%', rotation: -5, scale: 0.9, layer: 3, delay: 1.0 },
    { left: '95%', top: '85%', rotation: 3, scale: 0.7, layer: 1, delay: 0.3 },
    // 추가 - 가장자리 보강
    { left: '-3%', top: '15%', rotation: 4, scale: 0.65, layer: 1, delay: 1.6 },
    { left: '96%', top: '18%', rotation: -4, scale: 0.7, layer: 1, delay: 0.8 },
    { left: '5%', top: '78%', rotation: 5, scale: 0.8, layer: 2, delay: 1.2 },
    { left: '90%', top: '75%', rotation: -3, scale: 0.75, layer: 1, delay: 0.4 },
    // 상단/하단 중앙 (메인 카드 위아래)
    { left: '35%', top: '0%', rotation: -2, scale: 0.65, layer: 1, delay: 1.8 },
    { left: '55%', top: '2%', rotation: 3, scale: 0.7, layer: 1, delay: 0.6 },
    { left: '38%', top: '92%', rotation: 4, scale: 0.75, layer: 1, delay: 1.1 },
    { left: '58%', top: '95%', rotation: -3, scale: 0.65, layer: 1, delay: 0.9 },
    // 코너 강조
    { left: '-1%', top: '95%', rotation: 6, scale: 0.8, layer: 2, delay: 1.4 },
    { left: '97%', top: '92%', rotation: -5, scale: 0.85, layer: 2, delay: 0.7 },
];

// 배열 셔플 함수 (Fisher-Yates)
const shuffleArray = <T,>(array: T[], seed: number): T[] => {
    const shuffled = [...array];
    let currentIndex = shuffled.length;

    // 시드 기반 랜덤 (같은 페이지에서는 일관된 결과)
    const seededRandom = (s: number) => {
        const x = Math.sin(s) * 10000;
        return x - Math.floor(x);
    };

    while (currentIndex !== 0) {
        const randomIndex = Math.floor(seededRandom(seed + currentIndex) * currentIndex);
        currentIndex--;
        [shuffled[currentIndex], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[currentIndex]];
    }

    return shuffled;
};

// 중앙 6개 카드 위치 세트 (페이지별로 다른 배치)
// 레이아웃: 왼쪽 2개, 오른쪽 2개, 상단 중앙 1개, 하단 중앙 1개 (불규칙 그리드)
// 카드 크기 300px 기준 최소 350px 간격 확보하여 겹침 방지
const centerPositionSets = [
    [
        // 상단 왼쪽
        { x: -340, y: -140, rotation: -4, scale: 0.95 },
        // 상단 오른쪽
        { x: 340, y: -120, rotation: 3, scale: 0.98 },
        // 중앙 왼쪽 (약간 아래)
        { x: -320, y: 100, rotation: 2, scale: 1.0 },
        // 중앙 오른쪽 (약간 위)
        { x: 320, y: 80, rotation: -3, scale: 0.96 },
        // 상단 중앙
        { x: 0, y: -160, rotation: -2, scale: 1.02 },
        // 하단 중앙
        { x: 20, y: 180, rotation: 3, scale: 0.94 },
    ],
    [
        // 왼쪽 상단
        { x: -360, y: -100, rotation: 3, scale: 0.96 },
        // 오른쪽 상단
        { x: 320, y: -160, rotation: -4, scale: 1.0 },
        // 왼쪽 하단
        { x: -300, y: 120, rotation: -2, scale: 0.98 },
        // 오른쪽 하단
        { x: 360, y: 100, rotation: 2, scale: 0.94 },
        // 중앙 상단
        { x: -20, y: -140, rotation: 4, scale: 1.02 },
        // 중앙 하단
        { x: 40, y: 180, rotation: -3, scale: 0.95 },
    ],
    [
        // 왼쪽 위
        { x: -320, y: -160, rotation: -3, scale: 1.0 },
        // 오른쪽 위
        { x: 360, y: -100, rotation: 4, scale: 0.95 },
        // 왼쪽 아래
        { x: -360, y: 80, rotation: 2, scale: 0.96 },
        // 오른쪽 아래
        { x: 300, y: 140, rotation: -2, scale: 1.02 },
        // 상단 중앙 (약간 왼쪽)
        { x: -30, y: -120, rotation: -4, scale: 0.98 },
        // 하단 중앙 (약간 오른쪽)
        { x: 60, y: 180, rotation: 3, scale: 0.94 },
    ],
    [
        // 좌상
        { x: -340, y: -120, rotation: 2, scale: 0.98 },
        // 우상
        { x: 340, y: -140, rotation: -3, scale: 0.96 },
        // 좌하
        { x: -320, y: 100, rotation: -4, scale: 1.0 },
        // 우하
        { x: 340, y: 120, rotation: 3, scale: 0.94 },
        // 중앙 위
        { x: 20, y: -160, rotation: 2, scale: 1.02 },
        // 중앙 아래
        { x: -40, y: 180, rotation: -2, scale: 0.95 },
    ],
    [
        // 왼쪽 상
        { x: -360, y: -140, rotation: -2, scale: 0.95 },
        // 오른쪽 상
        { x: 320, y: -120, rotation: 4, scale: 1.0 },
        // 왼쪽 하
        { x: -300, y: 100, rotation: 3, scale: 0.96 },
        // 오른쪽 하
        { x: 360, y: 80, rotation: -3, scale: 1.02 },
        // 상단 가운데
        { x: -20, y: -160, rotation: -4, scale: 0.98 },
        // 하단 가운데
        { x: 30, y: 180, rotation: 2, scale: 0.94 },
    ],
    [
        // 좌측 위
        { x: -340, y: -100, rotation: 4, scale: 1.0 },
        // 우측 위
        { x: 360, y: -160, rotation: -2, scale: 0.96 },
        // 좌측 아래
        { x: -360, y: 120, rotation: -3, scale: 0.95 },
        // 우측 아래
        { x: 320, y: 100, rotation: 3, scale: 0.98 },
        // 위 중앙
        { x: 10, y: -140, rotation: 2, scale: 1.02 },
        // 아래 중앙
        { x: -30, y: 180, rotation: -4, scale: 0.94 },
    ],
];

interface ReaderReactionsProps {
    onCTAClick?: () => void;
}

export const ReaderReactions = ({ onCTAClick }: ReaderReactionsProps) => {
    // 모바일 여부 감지
    const isMobile = useIsMobile();

    // PC: 메인 댓글 페이지 상태 (0-5, 6페이지 = 36개/6개씩)
    const [currentPage, setCurrentPage] = useState(0);
    // 모바일: 개별 카드 인덱스 (0-35)
    const [mobileIndex, setMobileIndex] = useState(0);
    // 메인 카드 hover 시 자동 순환 멈춤
    const [isHovering, setIsHovering] = useState(false);
    // 모바일 터치 상태
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const [isTouching, setIsTouching] = useState(false);

    const minSwipeDistance = 50;

    // 3초마다 자동 순환 (PC: hover 시 멈춤, 모바일: 터치 중 멈춤)
    useEffect(() => {
        if (isMobile && isTouching) return;
        if (!isMobile && isHovering) return;

        const interval = setInterval(() => {
            if (isMobile) {
                // 모바일: 개별 카드 순환
                setMobileIndex((prev) => (prev + 1) % comments.length);
            } else {
                // PC: 페이지 단위 순환
                setCurrentPage((prev) => (prev + 1) % 6);
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [isHovering, isMobile, isTouching]);

    // 모바일 터치 핸들러
    const onTouchStart = (e: React.TouchEvent) => {
        setIsTouching(true);
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        setIsTouching(false);
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        if (distance > minSwipeDistance) {
            // 왼쪽으로 스와이프 → 다음 카드
            setMobileIndex((prev) => (prev + 1) % comments.length);
        }
        if (distance < -minSwipeDistance) {
            // 오른쪽으로 스와이프 → 이전 카드
            setMobileIndex((prev) => (prev - 1 + comments.length) % comments.length);
        }
    };

    // 현재 페이지 기반으로 셔플된 댓글 인덱스
    const shuffledIndices = shuffleArray(
        Array.from({ length: 36 }, (_, i) => i),
        currentPage * 100
    );

    // 메인에 표시될 6개 댓글 (랜덤 셔플에서 앞 6개)
    const mainCommentIndices = shuffledIndices.slice(0, 6);
    const mainComments = mainCommentIndices.map(idx => comments[idx]);

    // 배경에 표시될 30개 댓글 (나머지)
    const backgroundCommentIndices = shuffledIndices.slice(6);
    const backgroundComments = backgroundCommentIndices.map(idx => comments[idx]);

    // 현재 페이지의 중앙 카드 위치
    const centerCardPositions = centerPositionSets[currentPage];

    return (
        <section id="testimonials" className="py-24 px-6 bg-[#0a0a0a] overflow-hidden relative min-h-[800px]">
            {/* 배경 댓글들 - 30개 항상 표시 (레이어별 깊이감 + floating 애니메이션) */}
            <div className="absolute inset-0 overflow-hidden">
                {/* CSS keyframes for floating animation */}
                <style>{`
                    @keyframes float {
                        0%, 100% { transform: translateY(0px) rotate(var(--rotation)); }
                        50% { transform: translateY(-12px) rotate(var(--rotation)); }
                    }
                    @keyframes floatSlow {
                        0%, 100% { transform: translateY(0px) rotate(var(--rotation)); }
                        50% { transform: translateY(-8px) rotate(var(--rotation)); }
                    }
                    @keyframes floatFast {
                        0%, 100% { transform: translateY(0px) rotate(var(--rotation)); }
                        50% { transform: translateY(-16px) rotate(var(--rotation)); }
                    }
                `}</style>
                {backgroundComments.map((comment, idx) => {
                    const pos = backgroundPositions[idx];
                    if (!pos) return null;

                    // 레이어별 설정 (애니메이션 제거)
                    const layerConfig = {
                        1: { blur: 3, brightness: 0.12 },
                        2: { blur: 2, brightness: 0.18 },
                        3: { blur: 1, brightness: 0.25 },
                    }[pos.layer] || { blur: 2, brightness: 0.15 };

                    return (
                        <div
                            key={`bg-${comment.nickname}-${idx}`}
                            className="absolute"
                            style={{
                                left: pos.left,
                                top: pos.top,
                                transform: `rotate(${pos.rotation}deg)`,
                                filter: `blur(${layerConfig.blur}px) brightness(${layerConfig.brightness})`,
                                zIndex: pos.layer,
                                width: `${324 * pos.scale}px`,
                            } as React.CSSProperties}
                        >
                            <div
                                className="bg-white rounded-xl p-3 border border-gray-200 shadow-lg"
                                style={{ transform: `scale(${pos.scale})`, transformOrigin: 'top left' }}
                            >
                                <div className="flex gap-2.5">
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full ${comment.avatarColor} flex items-center justify-center text-white font-bold text-xs`}>
                                        {comment.avatar}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-gray-900 font-medium text-xs truncate block">
                                            {comment.nickname}
                                        </span>
                                        <p className="text-gray-800 text-xs leading-relaxed line-clamp-2 mt-0.5">
                                            {comment.text}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl md:text-5xl font-black mb-6">
                        독자는, <span className="text-emerald-500">차이</span>를 먼저 느낍니다
                    </h2>
                    <p className="text-white/50 text-base md:text-lg">
                        실제 독자들의 반응입니다
                    </p>
                </motion.div>

                {/* 중앙 댓글 카드 - 모바일: 1개 카드 + 스와이프 / PC: 6개 카드 산개 배치 */}
                <div
                    className="relative h-[300px] md:h-[450px] flex items-center justify-center mb-12"
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                    onTouchStart={isMobile ? onTouchStart : undefined}
                    onTouchMove={isMobile ? onTouchMove : undefined}
                    onTouchEnd={isMobile ? onTouchEnd : undefined}
                >
                    {/* 모바일 인디케이터 - Instagram 스타일 Dynamic Dots */}
                    {isMobile && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center z-20">
                            <div className="flex items-center gap-1.5 overflow-hidden">
                                {Array.from({ length: 5 }).map((_, idx) => {
                                    const offset = idx - 2; // -2, -1, 0, 1, 2 (중앙이 0)
                                    const actualIndex = ((mobileIndex + offset) % comments.length + comments.length) % comments.length;
                                    const distance = Math.abs(offset);

                                    // 중앙에서 멀어질수록 작아짐
                                    const sizes = [8, 6, 4]; // px 단위
                                    const opacities = [1, 0.6, 0.3];
                                    const isCenter = distance === 0;

                                    return (
                                        <motion.div
                                            key={actualIndex}
                                            layoutId={`dot-${actualIndex}`}
                                            initial={false}
                                            animate={{
                                                width: sizes[distance],
                                                height: sizes[distance],
                                                opacity: opacities[distance],
                                                backgroundColor: isCenter ? '#10b981' : '#ffffff',
                                            }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 500,
                                                damping: 30,
                                            }}
                                            className="rounded-full"
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {isMobile ? (
                            /* 모바일: 1개 카드 중앙 배치 */
                            <motion.div
                                key={`mobile-${mobileIndex}`}
                                initial={{ opacity: 0, x: 100, scale: 0.9 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: -100, scale: 0.9 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="w-[280px] cursor-pointer"
                            >
                                <div className="bg-white rounded-xl shadow-2xl p-4 border border-gray-100">
                                    <div className="flex gap-3">
                                        <div className={`flex-shrink-0 w-10 h-10 rounded-full ${comments[mobileIndex].avatarColor} flex items-center justify-center text-white font-bold text-sm`}>
                                            {comments[mobileIndex].avatar}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-gray-900 font-medium text-[13px] truncate">
                                                    {comments[mobileIndex].nickname}
                                                </span>
                                                <span className="text-gray-400 text-xs flex-shrink-0">
                                                    {comments[mobileIndex].time}
                                                </span>
                                            </div>
                                            <p className="text-gray-800 text-[14px] leading-relaxed mb-3 line-clamp-3">
                                                {comments[mobileIndex].text}
                                            </p>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1">
                                                    <ThumbsUp className="w-4 h-4 text-gray-500" />
                                                    <span className="text-gray-500 text-xs">{comments[mobileIndex].likes}</span>
                                                </div>
                                                <ThumbsDown className="w-4 h-4 text-gray-500" />
                                                <span className="text-gray-500 text-xs font-medium">답글</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            /* PC: 6개 카드 산개 배치 */
                            mainComments.map((comment, index) => (
                                <motion.div
                                    key={`main-${currentPage}-${index}`}
                                    initial={{
                                        opacity: 0,
                                        scale: centerCardPositions[index].scale,
                                        x: centerCardPositions[index].x,
                                        y: centerCardPositions[index].y + 20,
                                        rotate: centerCardPositions[index].rotation
                                    }}
                                    animate={{
                                        opacity: 1,
                                        scale: centerCardPositions[index].scale,
                                        x: centerCardPositions[index].x,
                                        y: centerCardPositions[index].y,
                                        rotate: centerCardPositions[index].rotation
                                    }}
                                    exit={{
                                        opacity: 0,
                                        y: centerCardPositions[index].y - 10,
                                        transition: { duration: 0.25, ease: "easeIn" }
                                    }}
                                    transition={{
                                        delay: index * 0.08,
                                        duration: 0.4,
                                        ease: "easeOut"
                                    }}
                                    whileHover={{
                                        scale: 1.08,
                                        zIndex: 50,
                                        rotate: 0,
                                        transition: { duration: 0.2 }
                                    }}
                                    className="absolute w-[300px] cursor-pointer"
                                    style={{
                                        zIndex: 10 + index,
                                    }}
                                >
                                    <div className="bg-white rounded-xl shadow-2xl p-4 border border-gray-100">
                                        <div className="flex gap-3">
                                            <div className={`flex-shrink-0 w-10 h-10 rounded-full ${comment.avatarColor} flex items-center justify-center text-white font-bold text-sm`}>
                                                {comment.avatar}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-gray-900 font-medium text-[13px] truncate">
                                                        {comment.nickname}
                                                    </span>
                                                    <span className="text-gray-400 text-xs flex-shrink-0">
                                                        {comment.time}
                                                    </span>
                                                </div>
                                                <p className="text-gray-800 text-[14px] leading-relaxed mb-3 line-clamp-3">
                                                    {comment.text}
                                                </p>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-1">
                                                        <ThumbsUp className="w-4 h-4 text-gray-500" />
                                                        <span className="text-gray-500 text-xs">{comment.likes}</span>
                                                    </div>
                                                    <ThumbsDown className="w-4 h-4 text-gray-500" />
                                                    <span className="text-gray-500 text-xs font-medium">답글</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>

                {/* 하단 문장 */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-center"
                >
                    <p className="text-white/50 text-base md:text-lg mb-10 leading-relaxed">
                        이런 반응은, <br />
                        음악을 '곡'이 아니라 연출로 설계했을 때 나옵니다.
                    </p>

                    {/* CTA */}
                    <button
                        onClick={onCTAClick}
                        className="inline-flex items-center gap-3 bg-white hover:bg-gray-100 text-black px-8 py-4 rounded-full font-bold text-lg transition-all group cursor-pointer"
                    >
                        프로젝트 의뢰 문의
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <p className="mt-4 text-sm text-white/40">
                        레퍼런스 없이 시작하셔도 됩니다.
                    </p>
                </motion.div>
            </div>
        </section>
    );
};
