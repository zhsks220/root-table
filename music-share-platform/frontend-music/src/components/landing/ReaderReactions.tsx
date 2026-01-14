import { useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useIsMobile } from '../../hooks/useResponsive';

// 욕설 패턴 목록 (blur 처리할 단어들)
const profanityPatterns = [
    'ㅅㅂ', 'ㅆㅂ', 'ㅈㄴ', 'ㅂㅅ', 'ㅄ', 'ㅁㅊ', 'ㄲㅈ',
    '시발', '씨발', '존나', '병신', '미친', '꺼져',
    '지랄', '새끼', 'ㅅㅋ', 'ㄱㅅㄲ',
    '좆', '씹', 'ㅈ같', '개새끼', 'ㄱㅅㅋ',
];

// 텍스트에서 욕설을 blur 처리된 span으로 변환
const renderTextWithBlur = (text: string): ReactNode => {
    // 욕설 패턴을 정규식으로 변환 (대소문자 무시, 전역 검색)
    const pattern = new RegExp(`(${profanityPatterns.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');

    const parts = text.split(pattern);

    return parts.map((part, index) => {
        const isProfanity = profanityPatterns.some(p => p.toLowerCase() === part.toLowerCase());
        if (isProfanity) {
            return (
                <span
                    key={index}
                    className="blur-[3px] select-none pointer-events-none"
                    style={{ userSelect: 'none' }}
                >
                    {part}
                </span>
            );
        }
        return part;
    });
};

// 실제 독자 반응 데이터 - 랜덤 닉네임 적용, 원문 기반
// 출처: DC인사이드 박태준 유니버스 갤러리, 네이버 카페, YouTube
const comments = [
    // === DC인사이드 반응들 (1-29번) ===
    {
        nickname: "@밤하늘_독자",
        avatar: "밤",
        avatarColor: "bg-purple-500",
        text: "브금이 캐릭터의 정체성 중 하나가 되는 거라 의미가 크다. wolf, 주마등, 데칼코마니 같은 브금은 비교 자체가 안 됨",
        likes: 234,
        time: "1개월 전",
    },
    {
        nickname: "@webtoon_fan92",
        avatar: "W",
        avatarColor: "bg-blue-500",
        text: "종건을 생각하면 자연스럽게 백귀와 캐치미, 준구를 생각하면 칼의 춤. 브금 자체가 캐릭터를 완성시킴",
        likes: 189,
        time: "2주 전",
    },
    {
        nickname: "@헌신과_애정",
        avatar: "헌",
        avatarColor: "bg-rose-500",
        text: "박만사 이상으로 작품에 대한 헌신과 애정이 컸음. 유튜브에 브금 올라오는 걸 그 날 웹툰 올라오는 거 마냥 기대함",
        likes: 267,
        time: "3주 전",
    },
    {
        nickname: "@영화음악급",
        avatar: "영",
        avatarColor: "bg-emerald-500",
        text: "영화에서 음악의 중요성을 뺄 수 없듯이 웹툰도 마찬가지. 적절한 음악이 있으면 몰입감이 비교할 수가 없음",
        likes: 312,
        time: "1개월 전",
    },
    // 네이버 카페 반응 (3번)
    {
        nickname: "@정주행러",
        avatar: "정",
        avatarColor: "bg-orange-500",
        text: "진짜 루트레이블이 브금 기깔나게 잘 만드는 듯 ㅇㅇ. 이 브금 회사 아니면 감질맛 떨어져서 웹툰 못 봄 ㅋㅋ",
        likes: 156,
        time: "3주 전",
    },
    // DC인사이드 반응들 계속
    {
        nickname: "@캐릭터_해석가",
        avatar: "캐",
        avatarColor: "bg-indigo-500",
        text: "루트레이블 브금은 캐릭이해도가 그냥 미쳤음",
        likes: 278,
        time: "2주 전",
    },
    {
        nickname: "@몰입감_마스터",
        avatar: "몰",
        avatarColor: "bg-red-500",
        text: "콘티 미리보는지 독자들 읽는속도 계산해서 장면장면 딱 적당하게 브금 녹여냄. 이 컨트롤이 ㅈㄴ 정교함",
        likes: 198,
        time: "1주 전",
    },
    {
        nickname: "@진랑_기태",
        avatar: "진",
        avatarColor: "bg-cyan-500",
        text: "하운드스로 진랑 풀각성 밀어붙이다가 기태 맨손으로 도끼 막으면서 킹슬레이어로 바뀌는 거 ㅈㄴ 소름",
        likes: 423,
        time: "2주 전",
    },
    {
        nickname: "@브금_감상러",
        avatar: "브",
        avatarColor: "bg-pink-500",
        text: "캐릭터 하나하나에 알맞고 어울리게 브금을 만드는 능력이 쌔오짐. 다른 업체가 이만큼 할 수 있을까",
        likes: 356,
        time: "1주 전",
    },
    {
        nickname: "@전율파",
        avatar: "전",
        avatarColor: "bg-violet-500",
        text: "첫컷이랑 타이밍과 브금의 타이밍이 절묘할때 전율이 흘렀음",
        likes: 289,
        time: "3일 전",
    },
    {
        nickname: "@감성_충전소",
        avatar: "감",
        avatarColor: "bg-amber-500",
        text: "만화에 대한 이해도가 대단했음. 병맛 내용도 슬픈 선율이 잘 구슬려서 평타 이상으로 만듦",
        likes: 178,
        time: "1개월 전",
    },
    {
        nickname: "@테마곡_분석가",
        avatar: "테",
        avatarColor: "bg-teal-500",
        text: "백귀 종건, 디에고 이지훈, 칼의춤 김준구, 킹슬2 김기태, war4 성요한, 울프 진랑. 전용 테마곡이란게 확실히 느껴짐",
        likes: 234,
        time: "2주 전",
    },
    {
        nickname: "@브금빨_체감",
        avatar: "빨",
        avatarColor: "bg-slate-500",
        text: "브금빨이 ㅈㄴ크긴하네. 브금키고봤을땐 호감될뻔했는데 브금끄고보니까 다시 별로임",
        likes: 312,
        time: "1개월 전",
    },
    {
        nickname: "@hounds_fan",
        avatar: "H",
        avatarColor: "bg-lime-500",
        text: "hounds 이건 걍 영화 엔딩곡같네. 웹툰 브금 퀄이 아닌데 ㄹㅇ",
        likes: 198,
        time: "2주 전",
    },
    {
        nickname: "@소름파",
        avatar: "소",
        avatarColor: "bg-fuchsia-500",
        text: "Hounds 처음 나왔을때 사이렌 울리면서 이목 집중시키더니 코러스 개 쩔게 잡고 진랑 회상장면으로 브금 시작. 소름",
        likes: 267,
        time: "1주 전",
    },
    {
        nickname: "@도파민_분비",
        avatar: "도",
        avatarColor: "bg-sky-500",
        text: "Now he's glowing in the color of the wolves 하면서 진랑 극경 펀치 날릴때 도파민 분비",
        likes: 345,
        time: "3주 전",
    },
    {
        nickname: "@킹슬레이어_러버",
        avatar: "킹",
        avatarColor: "bg-rose-400",
        text: "킹슬2로 넘어갈 때 진랑 브금이랑 섞어서 어레인지한게 미친놈같음. 진랑의 처절함까지 같이 보여줌",
        likes: 289,
        time: "2주 전",
    },
    {
        nickname: "@명곡_수집가",
        avatar: "명",
        avatarColor: "bg-blue-400",
        text: "브금 5개가 하나같이 미쳐돌아감. 하운즈가 브금중 제일 좋은듯. 울프랑 바로크도 잘뽑혔고",
        likes: 178,
        time: "1주 전",
    },
    {
        nickname: "@느와르_팬",
        avatar: "느",
        avatarColor: "bg-green-500",
        text: "진짜 완벽한 느와르 브금. 훈태가 진짜 악역이라고 느끼게 해준 최고의 브금. Diego 2년만에 재탕나와서 전율",
        likes: 234,
        time: "2주 전",
    },
    {
        nickname: "@몰입_중독자",
        avatar: "몰",
        avatarColor: "bg-orange-400",
        text: "외지주는 브금빨이 ㅈㄴ 큰듯. 브금틀고 보는지 그냥 보는지에 따라 차이 은근 큼",
        likes: 156,
        time: "3일 전",
    },
    {
        nickname: "@탑5_선정단",
        avatar: "탑",
        avatarColor: "bg-purple-400",
        text: "브금이 ㄹㅇ 조오오오오온나 잘뽑힘. 개인적으로 외지주 브금 탑 5안에 들어갈듯",
        likes: 423,
        time: "1주 전",
    },
    {
        nickname: "@절반은_브금",
        avatar: "절",
        avatarColor: "bg-indigo-400",
        text: "외지주는 브금이 절반은 하는거 같다. 브금 있고 없고 차이가 진짜 심해",
        likes: 289,
        time: "2주 전",
    },
    {
        nickname: "@유일한_구원",
        avatar: "유",
        avatarColor: "bg-red-400",
        text: "유일하게 외지주 살리는 장본인인데. 역대급 천량편도 덕분에 그나마 재밌게 봄",
        likes: 312,
        time: "3주 전",
    },
    {
        nickname: "@쿠키값",
        avatar: "쿠",
        avatarColor: "bg-cyan-400",
        text: "토끼로 불법 안보고 쿠키로 돈내고 보는 가장 큰 이유가 브금 때문",
        likes: 198,
        time: "1주 전",
    },
    {
        nickname: "@먹여살림",
        avatar: "먹",
        avatarColor: "bg-emerald-400",
        text: "진짜 루트레이블이 먹여살리는구나. 추모브금 어레인지 깔리니까 죽는 장면 생각나면서 대가리 깨질뻔함",
        likes: 134,
        time: "2주 전",
    },
    {
        nickname: "@브금_GOAT",
        avatar: "G",
        avatarColor: "bg-pink-400",
        text: "브금이 진짜 GOAT인 이유. 오랜만에 육성지 + 주마등 브금 나오니까 뭔가 아련하면서 슬픔",
        likes: 267,
        time: "1개월 전",
    },
    {
        nickname: "@안틀면_노잼",
        avatar: "안",
        avatarColor: "bg-violet-400",
        text: "이번화 브금 안틀고 보니까 개씹노잼이노. 루트레이블은 언제나 신이다",
        likes: 189,
        time: "3주 전",
    },
    {
        nickname: "@캐릭터_브금",
        avatar: "캐",
        avatarColor: "bg-amber-400",
        text: "캐릭터들 전용브금은 진짜 기깔나게 잘 뽑는듯. 백귀 칼의춤 war4 seize 토라오니 빌런 다 ㅅㅌㅊ고 킹슬레이어2는 역대급",
        likes: 356,
        time: "2주 전",
    },
    {
        nickname: "@역대급",
        avatar: "역",
        avatarColor: "bg-teal-400",
        text: "이번주 킹슬레이어2 브금 역대급으로 좋지않냐? 10번 넘게 들음",
        likes: 423,
        time: "1주 전",
    },
    {
        nickname: "@절망감",
        avatar: "절",
        avatarColor: "bg-slate-400",
        text: "오늘 기태임팩트에 브금도 크게 한몫한듯. 중간에 브금 바뀌는데 ㄹㅇ 절망적이라는 느낌",
        likes: 289,
        time: "2주 전",
    },
    {
        nickname: "@경고신호",
        avatar: "경",
        avatarColor: "bg-lime-400",
        text: "Kingslayer2브금 나올때 진짜 ㅈ됐구나 느낌받음. 도망가라는 경고신호처럼 들림. 급박한 분위기 연출 지렸음",
        likes: 312,
        time: "3주 전",
    },
    {
        nickname: "@전율_올라옴",
        avatar: "전",
        avatarColor: "bg-fuchsia-400",
        text: "이번화 브금타이밍 나만 전율 올라왔냐? 캐치미 하이라이트 부분에서 김갑룡 막컷 겹쳐서 싸버림 ㅆㅂ",
        likes: 198,
        time: "1주 전",
    },
    // === YouTube 댓글들 (30-36번) ===
    {
        nickname: "@3년_애독자",
        avatar: "3",
        avatarColor: "bg-sky-400",
        text: "22년 9월부터 25년 12월까지 3년동안 외지주 음악 만들어주셔서 감사. 제 24살~27살까지 삶에 녹아들어있습니다",
        likes: 36,
        time: "1개월 전",
    },
    {
        nickname: "@플레이리스트",
        avatar: "플",
        avatarColor: "bg-rose-300",
        text: "유튜브 재생목록 따로 만들어서 운동할때 들음. Epic, war, dark change, puppet, data, asap 다 명곡",
        likes: 32,
        time: "1개월 전",
    },
    {
        nickname: "@80퍼센트",
        avatar: "8",
        avatarColor: "bg-blue-300",
        text: "외지주 보는 이유중 80%는 브금때문에 보는건데",
        likes: 5,
        time: "1개월 전",
    },
    {
        nickname: "@음악이_만화를",
        avatar: "음",
        avatarColor: "bg-green-400",
        text: "뛰어넘었다는겁니다... 음악이 만화를!!!!!",
        likes: 11,
        time: "1개월 전",
    },
    {
        nickname: "@몰입감_증인",
        avatar: "몰",
        avatarColor: "bg-purple-300",
        text: "루트레이블의 진귀한 브금 덕분에 작품을 더욱 몰입감 있게 즐길 수 있었습니다. 끝까지 함께 못하는게 아쉽지만 응원합니다",
        likes: 9,
        time: "1개월 전",
    },
    {
        nickname: "@허망한_기분",
        avatar: "허",
        avatarColor: "bg-orange-300",
        text: "와... 왤케 허망하지.. ㅈㄴ우울하네... 뭔가 ㅈㄴ 좋아하는 연예인 사망 소식 듣는 기분임...",
        likes: 17,
        time: "1개월 전",
    },
    {
        nickname: "@환영해요",
        avatar: "환",
        avatarColor: "bg-indigo-300",
        text: "김기명 과거편부터 인천편까지 덕분에 웹툰 더 몰입해서 볼 수 있었습니다. 언제든 다시 돌아와도 환영할게요",
        likes: 6,
        time: "1개월 전",
    },
    {
        nickname: "@버틸수없어",
        avatar: "버",
        avatarColor: "bg-cyan-300",
        text: "외지주 질질 끌때도 브금때문에 봤는데 당신이 사라진다면 버틸수 없어",
        likes: 2,
        time: "1개월 전",
    },
    {
        nickname: "@쌉고트",
        avatar: "쌉",
        avatarColor: "bg-emerald-300",
        text: "개인적으로 부산편때 나온 1세대2, wolf, hounds 쌉고트였음",
        likes: 4,
        time: "5일 전",
    },
    {
        nickname: "@과거의_위로",
        avatar: "과",
        avatarColor: "bg-pink-300",
        text: "이 노래하나로 잊고있던 소중한 과거로 돌아간것같아요. 소중한 기억들이 지금의 저를 위로해주는것같아요",
        likes: 42,
        time: "4년 전",
    },
    {
        nickname: "@매일_듣는중",
        avatar: "매",
        avatarColor: "bg-violet-300",
        text: "원래 노래에 댓글 잘 안다는데 이 곡은 진짜 매일 들을 정도로 넘 좋음...ㅠㅠ",
        likes: 5,
        time: "1년 전",
    },
    {
        nickname: "@MASTERPIECE",
        avatar: "M",
        avatarColor: "bg-amber-300",
        text: "수고하셨어요 ㅠㅠ MASTERPIECE 진짜 명곡이었습니다",
        likes: 11,
        time: "1개월 전",
    },
    {
        nickname: "@용기를_주셨어요",
        avatar: "용",
        avatarColor: "bg-teal-300",
        text: "덕분에 힘든 일이 있을 때도 늘 자신감을 가지고 일어설 수 있었습니다. 진심으로 감사했습니다",
        likes: 6,
        time: "1개월 전",
    },
    {
        nickname: "@노래_겁나좋다",
        avatar: "노",
        avatarColor: "bg-slate-300",
        text: "노래 겁나 좋다",
        likes: 11,
        time: "4년 전",
    },
    {
        nickname: "@감성_충만",
        avatar: "감",
        avatarColor: "bg-lime-300",
        text: "어른이 되어버린 지금보다 그때 그시절이 더 감정에 솔직하고 성숙했던걸까. 마음이 무겁네",
        likes: 7,
        time: "10개월 전",
    },
    {
        nickname: "@왕자림_팬",
        avatar: "왕",
        avatarColor: "bg-fuchsia-300",
        text: "왕자림이 갈수록 감성충만해지니 노래도 절절하네",
        likes: 3,
        time: "2년 전",
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
    // 추가 페이지 7
    [
        // 왼쪽 위
        { x: -350, y: -130, rotation: -3, scale: 0.97 },
        // 오른쪽 위
        { x: 330, y: -150, rotation: 4, scale: 0.99 },
        // 왼쪽 아래
        { x: -310, y: 90, rotation: 2, scale: 1.01 },
        // 오른쪽 아래
        { x: 350, y: 110, rotation: -4, scale: 0.95 },
        // 상단 중앙
        { x: 15, y: -170, rotation: -2, scale: 0.98 },
        // 하단 중앙
        { x: -25, y: 175, rotation: 3, scale: 0.96 },
    ],
    // 추가 페이지 8
    [
        // 좌상단
        { x: -330, y: -140, rotation: 3, scale: 0.98 },
        // 우상단
        { x: 350, y: -110, rotation: -3, scale: 1.0 },
        // 좌하단
        { x: -355, y: 100, rotation: -2, scale: 0.96 },
        // 우하단
        { x: 315, y: 130, rotation: 4, scale: 0.97 },
        // 중앙 상
        { x: -10, y: -155, rotation: 2, scale: 1.02 },
        // 중앙 하
        { x: 35, y: 185, rotation: -3, scale: 0.94 },
    ],
];

interface ReaderReactionsProps {
    onCTAClick?: () => void;
}

export const ReaderReactions = ({ onCTAClick }: ReaderReactionsProps) => {
    // 모바일 여부 감지
    const isMobile = useIsMobile();

    // PC: 메인 댓글 페이지 상태 (0-7, 8페이지 = 48개/6개씩)
    const [currentPage, setCurrentPage] = useState(0);
    // 모바일: 개별 카드 인덱스 (0-47)
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
                // PC: 페이지 단위 순환 (48개 댓글 / 6개씩 = 8페이지)
                setCurrentPage((prev) => (prev + 1) % 8);
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
        Array.from({ length: comments.length }, (_, i) => i),
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
                                            {renderTextWithBlur(comment.text)}
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
                                                {renderTextWithBlur(comments[mobileIndex].text)}
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
                                                    {renderTextWithBlur(comment.text)}
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
                        상담하기
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
