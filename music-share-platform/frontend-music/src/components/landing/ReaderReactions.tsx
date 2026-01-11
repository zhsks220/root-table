import { motion } from 'framer-motion';
import { ArrowRight, ThumbsUp, ThumbsDown } from 'lucide-react';

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
        text: "ground 음악 들으면서 보니까 진짜 몰입감이 다르더라.",
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
        nickname: "@브살팬러",
        avatar: "브",
        avatarColor: "bg-pink-500",
        text: "브살팬러가 그림체의 무게를 살려주는 루아테임이랄",
        likes: 367,
        time: "3주 전",
    },
    {
        nickname: "@Hounds팬",
        avatar: "H",
        avatarColor: "bg-violet-500",
        text: "Hounds 리즌 강 창배 영역국경대",
        likes: 298,
        time: "2주 전",
    },
    {
        nickname: "@음악감상러",
        avatar: "음",
        avatarColor: "bg-amber-500",
        text: "와 근데 이번에 쓰신 음악이 아예랑 완전히 달콤 울렁음",
        likes: 445,
        time: "1주 전",
    },
    {
        nickname: "@감동이",
        avatar: "감",
        avatarColor: "bg-teal-500",
        text: "침묵의 장기역에 무식음을 살려주는 루아테임면",
        likes: 312,
        time: "4일 전",
    },
    {
        nickname: "@ㅇㅇ",
        avatar: "ㅇ",
        avatarColor: "bg-slate-500",
        text: "오늘 다시 위니버스 갤러리다니면서 렌트로이야기 그게 해줘 올리브이야기야임",
        likes: 189,
        time: "5일 전",
    },
    {
        nickname: "@전설의독자",
        avatar: "전",
        avatarColor: "bg-lime-500",
        text: "키지감이 작업 이후로 거의 2년 넘어서 마침내 Deeps 미로 다시 혼자팀의 저작권에 큰 쪽팡 빨감 덕저 낙다다디하고 한번",
        likes: 523,
        time: "1개월 전",
    },
    {
        nickname: "@바이커즈",
        avatar: "바",
        avatarColor: "bg-fuchsia-500",
        text: "비급팸은 그거 보낮팀가 좋다 군",
        likes: 267,
        time: "2주 전",
    },
    {
        nickname: "@킹그슬레이어",
        avatar: "킹",
        avatarColor: "bg-sky-500",
        text: "감갈 곧 재피 터닝킹이",
        likes: 345,
        time: "3주 전",
    },
    {
        nickname: "@뮤직러버",
        avatar: "뮤",
        avatarColor: "bg-rose-400",
        text: "작년 전쟁씬 정말 되게나이스쓰",
        likes: 412,
        time: "1주 전",
    },
    {
        nickname: "@웹툰매니아",
        avatar: "매",
        avatarColor: "bg-blue-400",
        text: "브실팬러가 스토리 읽으니 몰입감",
        likes: 289,
        time: "4일 전",
    },
    {
        nickname: "@일상독자",
        avatar: "일",
        avatarColor: "bg-green-500",
        text: "이번 앨범의 콘셉트와 비를 잘 잡아냈고 가히서가 싸이라고 아쉬운점다 세계관이 적극적",
        likes: 378,
        time: "2주 전",
    },
    {
        nickname: "@음악덕후",
        avatar: "덕",
        avatarColor: "bg-orange-400",
        text: "진짜 연출을 볼 때 있네이닉 쉬이만으로 빙의적 없은 수 있고 감성 없이 즐릴려 들어주는데요",
        likes: 467,
        time: "1주 전",
    },
    {
        nickname: "@hound_fan",
        avatar: "H",
        avatarColor: "bg-purple-400",
        text: "지인께서 티모팸 장동건으로 보냄고 이러더니 저도났습니다",
        likes: 234,
        time: "5일 전",
    },
    {
        nickname: "@파리에서",
        avatar: "파",
        avatarColor: "bg-indigo-400",
        text: "파리에서 왜 음악 전할지 모르겠어요 ㅋㅋㅋㅋ",
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
        text: "음악 없이 봤다가 다시 음악과 함께 보니까 완전 다름",
        likes: 445,
        time: "2주 전",
    },
    {
        nickname: "@킹슬레이어",
        avatar: "킹",
        avatarColor: "bg-emerald-400",
        text: "Kingslayer같은 니들로 전립 전히 + 떼기 + 눈맞이를",
        likes: 334,
        time: "4주 전",
    },
    {
        nickname: "@노래신청",
        avatar: "노",
        avatarColor: "bg-pink-400",
        text: "지금 다시 페이지 bgm으로 들어쓰며 몰입했다",
        likes: 289,
        time: "1주 전",
    },
    {
        nickname: "@작품이해",
        avatar: "작",
        avatarColor: "bg-violet-400",
        text: "이건 진짜 음악감독이 작품을 제대로 봤다는 증거",
        likes: 512,
        time: "3주 전",
    },
    {
        nickname: "@아기사자",
        avatar: "아",
        avatarColor: "bg-amber-400",
        text: "브실팬러가 미디어믹스의 완성이였다",
        likes: 378,
        time: "2주 전",
    },
    {
        nickname: "@연출팬",
        avatar: "연",
        avatarColor: "bg-teal-400",
        text: "그냥 진짜 음악 넣으니까 캐릭터 해석이 다르더라고요",
        likes: 445,
        time: "1주 전",
    },
    {
        nickname: "@소울뮤직",
        avatar: "소",
        avatarColor: "bg-slate-400",
        text: "아 근데 이번 거는 >> MASTERPIECE 프라 영국가있습니다",
        likes: 534,
        time: "4일 전",
    },
    {
        nickname: "@취향저격",
        avatar: "취",
        avatarColor: "bg-lime-400",
        text: "루트레이블 덕분에 웹툰 보는 게 더 즐거워졌어요",
        likes: 412,
        time: "2주 전",
    },
    {
        nickname: "@CleanChina",
        avatar: "C",
        avatarColor: "bg-fuchsia-400",
        text: "잇 아이... 눈물뭉을 감쌌었어요ㅜㅜ",
        likes: 367,
        time: "1주 전",
    },
    {
        nickname: "@개인취향",
        avatar: "개",
        avatarColor: "bg-sky-400",
        text: "개인취향으로 외신만큼 나도 wolf, hounds 트그죄정음",
        likes: 289,
        time: "3주 전",
    },
    {
        nickname: "@캐릭터팬",
        avatar: "캐",
        avatarColor: "bg-rose-300",
        text: "캐릭터 이해도가 음악에 녹아있음",
        likes: 445,
        time: "2주 전",
    },
    {
        nickname: "@음악완성",
        avatar: "완",
        avatarColor: "bg-blue-300",
        text: "음악이 웹툰의 감정을 완성시킴",
        likes: 534,
        time: "1주 전",
    },
    {
        nickname: "@Hope778",
        avatar: "H",
        avatarColor: "bg-green-400",
        text: "저.. 웰래키류에서... A.L 유물론이라.. 젊기 A.L 즐떠서는 전해이 시러 소지 늦고 있거봐요...",
        likes: 312,
        time: "4일 전",
    },
];

// 유튜브 스타일 댓글 카드 컴포넌트
const CommentCard = ({ comment, index }: { comment: typeof comments[0]; index: number }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: (index % 6) * 0.1, duration: 0.4 }}
            viewport={{ once: true }}
            className="w-full"
        >
            {/* 댓글 카드 - 유튜브 스타일 */}
            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100 h-full">
                <div className="flex gap-3">
                    {/* 아바타 */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full ${comment.avatarColor} flex items-center justify-center text-white font-bold text-sm`}>
                        {comment.avatar}
                    </div>

                    {/* 내용 */}
                    <div className="flex-1 min-w-0">
                        {/* 닉네임 & 시간 */}
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-gray-900 font-medium text-[13px] truncate">
                                {comment.nickname}
                            </span>
                            <span className="text-gray-400 text-xs flex-shrink-0">
                                {comment.time}
                            </span>
                        </div>

                        {/* 텍스트 */}
                        <p className="text-gray-800 text-[14px] leading-relaxed mb-3 line-clamp-3">
                            {comment.text}
                        </p>

                        {/* 좋아요 & 싫어요 & 답글 */}
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
    );
};

// 배경 댓글 위치 생성 (랜덤하게 화면에 뿌림)
const getBackgroundPositions = () => {
    const positions = [];
    const cols = 6;
    const rows = 6;

    for (let i = 0; i < 36; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        positions.push({
            left: `${(col / cols) * 100 + (Math.random() * 10 - 5)}%`,
            top: `${(row / rows) * 100 + (Math.random() * 10 - 5)}%`,
            rotation: Math.random() * 10 - 5,
        });
    }
    return positions;
};

const backgroundPositions = getBackgroundPositions();

export const ReaderReactions = () => {
    return (
        <section id="testimonials" className="py-24 px-6 bg-[#0a0a0a] overflow-hidden relative">
            {/* 배경 댓글들 - 36개 블러 처리 */}
            <div className="absolute inset-0 overflow-hidden">
                {comments.map((comment, idx) => (
                    <div
                        key={`bg-${idx}`}
                        className="absolute w-[280px] md:w-[320px]"
                        style={{
                            left: backgroundPositions[idx].left,
                            top: backgroundPositions[idx].top,
                            transform: `rotate(${backgroundPositions[idx].rotation}deg)`,
                            filter: 'blur(2px) brightness(0.2)',
                        }}
                    >
                        <div className="bg-white rounded-xl p-3 border border-gray-200">
                            <div className="flex gap-2">
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full ${comment.avatarColor} flex items-center justify-center text-white font-bold text-xs`}>
                                    {comment.avatar}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-gray-900 font-medium text-[11px] truncate">
                                            {comment.nickname}
                                        </span>
                                    </div>
                                    <p className="text-gray-800 text-[12px] leading-relaxed line-clamp-2">
                                        {comment.text}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
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

                {/* 중앙 댓글 카드 6개 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
                    {comments.slice(0, 6).map((comment, index) => (
                        <CommentCard key={index} comment={comment} index={index} />
                    ))}
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
                    <a
                        href="#contact"
                        className="inline-flex items-center gap-3 bg-white hover:bg-gray-100 text-black px-8 py-4 rounded-full font-bold text-lg transition-all group"
                    >
                        프로젝트 의뢰 문의
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </a>
                    <p className="mt-4 text-sm text-white/40">
                        레퍼런스 없이 시작하셔도 됩니다.
                    </p>
                </motion.div>
            </div>
        </section>
    );
};
