import { motion } from 'framer-motion';
import { ArrowRight, ThumbsUp, ThumbsDown } from 'lucide-react';

// 유튜브 댓글 스타일 데이터
const comments = [
    {
        nickname: "@webtoon_lover724",
        avatar: "W",
        avatarColor: "bg-purple-500",
        text: "루트레이블의 음악은 배경음이 아니라 캐릭터 해석을 완성시키는 연출이었다.",
        likes: 847,
        time: "3일 전",
        rotation: -2,
        position: { top: '5%', left: '5%' },
    },
    {
        nickname: "@midnight_reader",
        avatar: "M",
        avatarColor: "bg-blue-500",
        text: "캐릭터를 떠올리면 음악이 함께 떠오를 정도로 테마가 각인되어 있었다.",
        likes: 623,
        time: "1주 전",
        rotation: 1.5,
        position: { top: '8%', right: '3%' },
    },
    {
        nickname: "@감성충전소",
        avatar: "감",
        avatarColor: "bg-rose-500",
        text: "아쉬운 장면에서도 음악이 감정을 설득하며 연출의 완성도를 끌어올렸다.",
        likes: 512,
        time: "2주 전",
        rotation: -1,
        position: { top: '38%', left: '2%' },
    },
    {
        nickname: "@정주행마스터",
        avatar: "정",
        avatarColor: "bg-emerald-500",
        text: "작품 이해도가 높아 장면의 의도와 감정을 정확히 짚어냈다.",
        likes: 389,
        time: "3주 전",
        rotation: 2,
        position: { top: '42%', right: '5%' },
    },
    {
        nickname: "@webtoon_critic",
        avatar: "C",
        avatarColor: "bg-orange-500",
        text: "다른 웹툰 음악과 비교해도 캐릭터 중심 설계라는 차이가 분명했다.",
        likes: 456,
        time: "1개월 전",
        rotation: -1.5,
        position: { bottom: '18%', left: '8%' },
    },
    {
        nickname: "@밤샘독서",
        avatar: "밤",
        avatarColor: "bg-indigo-500",
        text: "장면 전환마다 음악이 정확히 맞물려 연출 컨트롤이 정교했다.",
        likes: 278,
        time: "1개월 전",
        rotation: 1,
        position: { bottom: '15%', right: '2%' },
    },
];

// 유튜브 스타일 댓글 카드 컴포넌트
const CommentCard = ({ comment, index }: { comment: typeof comments[0]; index: number }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            viewport={{ once: true }}
            className="absolute w-[320px] md:w-[380px]"
            style={{
                ...comment.position,
                transform: `rotate(${comment.rotation}deg)`,
            }}
        >
            {/* 댓글 카드 - 유튜브 스타일 */}
            <div className="bg-white rounded-xl shadow-2xl p-4 border border-gray-100">
                <div className="flex gap-3">
                    {/* 아바타 */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full ${comment.avatarColor} flex items-center justify-center text-white font-bold text-sm`}>
                        {comment.avatar}
                    </div>

                    {/* 내용 */}
                    <div className="flex-1 min-w-0">
                        {/* 닉네임 & 시간 */}
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-gray-900 font-medium text-[13px]">
                                {comment.nickname}
                            </span>
                            <span className="text-gray-400 text-xs">
                                {comment.time}
                            </span>
                        </div>

                        {/* 텍스트 */}
                        <p className="text-gray-800 text-[14px] leading-relaxed mb-3">
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

export const ReaderReactions = () => {
    return (
        <section id="testimonials" className="py-24 px-6 bg-[#0a0a0a] overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-8"
                >
                    <h2 className="text-3xl md:text-5xl font-black mb-6">
                        독자는, <span className="text-emerald-500">차이</span>를 먼저 느낍니다
                    </h2>
                </motion.div>

                {/* 댓글 스크린샷 콜라주 영역 */}
                <div className="relative h-[700px] md:h-[600px] mb-16">
                    {comments.map((comment, idx) => (
                        <CommentCard key={idx} comment={comment} index={idx} />
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
