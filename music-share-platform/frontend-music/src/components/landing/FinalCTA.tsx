import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Mail } from 'lucide-react';
import { useState } from 'react';

// 회사 이메일 주소
const COMPANY_EMAIL = 'route@routelabel.org';

// 메일 서비스 아이콘 컴포넌트
const GmailIcon = () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6">
        <path fill="#EA4335" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
    </svg>
);

const NaverIcon = () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6">
        <path fill="#03C75A" d="M16.273 12.845 7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845z"/>
    </svg>
);

const OutlookIcon = () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6">
        <path fill="#0078D4" d="M24 7.387v10.478c0 .23-.08.424-.238.576-.158.154-.352.232-.58.232h-8.26v-6.877l2.015 1.46c.09.064.196.096.318.096.121 0 .227-.032.318-.096l5.758-4.153A.643.643 0 0 1 24 7.387zm-.819-1.56c.161 0 .31.05.444.152L17.67 10.02l-2.748-1.988v-.205H24v.181a.643.643 0 0 0-.819-.181zM14.922 5.795v11.877H.818A.792.792 0 0 1 .24 17.44a.792.792 0 0 1-.24-.578V3.727c0-.23.08-.424.24-.576a.792.792 0 0 1 .578-.233h13.285c.226 0 .42.078.578.233.16.152.24.346.24.576v2.068zM9.63 9.183c0-.64-.148-1.224-.444-1.746a3.262 3.262 0 0 0-1.225-1.234c-.523-.3-1.107-.451-1.754-.451-.647 0-1.232.15-1.754.451-.523.3-.933.712-1.234 1.234-.3.522-.45 1.105-.45 1.746 0 .64.15 1.223.45 1.746.301.522.711.934 1.234 1.234.522.3 1.107.451 1.754.451.647 0 1.231-.15 1.754-.451a3.262 3.262 0 0 0 1.225-1.234c.296-.523.444-1.105.444-1.746zm-1.692 0c0 .488-.135.888-.406 1.198-.27.31-.615.465-1.032.465-.417 0-.762-.155-1.032-.465-.27-.31-.406-.71-.406-1.198 0-.488.135-.888.406-1.198.27-.31.615-.465 1.032-.465.417 0 .761.155 1.032.465.271.31.406.71.406 1.198z"/>
    </svg>
);

const DefaultMailIcon = () => (
    <Mail className="w-6 h-6 text-white/70" />
);

// 메일 서비스 옵션
const mailServices = [
    {
        id: 'gmail',
        name: 'Gmail',
        icon: GmailIcon,
        getUrl: (to: string, subject: string, body: string) =>
            `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    },
    {
        id: 'naver',
        name: '네이버 메일',
        icon: NaverIcon,
        getUrl: (to: string, subject: string, body: string) =>
            `https://mail.naver.com/write?to=${encodeURIComponent(to)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    },
    {
        id: 'outlook',
        name: 'Outlook',
        icon: OutlookIcon,
        getUrl: (to: string, subject: string, body: string) =>
            `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(to)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    },
    {
        id: 'default',
        name: '기본 메일 앱',
        icon: DefaultMailIcon,
        getUrl: (to: string, subject: string, body: string) =>
            `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    },
];

export const FinalCTA = () => {
    const [formData, setFormData] = useState({
        name: '',
        organization: '',
        email: '',
        workLink: '',
        genre: '',
        serialStatus: '' as '' | 'ongoing' | 'upcoming',
        workTitle: '',
        message: '',
    });
    const [showMailOptions, setShowMailOptions] = useState(false);
    const [emailContent, setEmailContent] = useState({ subject: '', body: '' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // 연재 상태 텍스트 변환
        const serialStatusText = formData.serialStatus === 'ongoing' ? '연재 중' : '연재 예정';

        // 이메일 내용 구성
        const subject = `[웹툰 음악 문의] ${formData.name}${formData.organization ? ` (${formData.organization})` : ''}`;
        const body = `안녕하세요, 웹툰 음악 제작 문의드립니다.

■ 이름: ${formData.name}
■ 소속: ${formData.organization || '(미입력)'}
■ 이메일: ${formData.email}
■ 작품 링크: ${formData.workLink || '(미입력)'}
■ 장르: ${formData.genre}
■ 연재 상태: ${serialStatusText}
■ 작품명: ${formData.workTitle || '(미입력)'}

■ 추가 문의사항:
${formData.message || '(없음)'}`;

        setEmailContent({ subject, body });
        setShowMailOptions(true);
    };

    const handleMailServiceSelect = (service: typeof mailServices[0]) => {
        const url = service.getUrl(COMPANY_EMAIL, emailContent.subject, emailContent.body);
        window.open(url, '_blank');
        setShowMailOptions(false);
    };

    return (
        <>
            <section id="contact" className="pt-24 pb-12 mt-16 px-4 min-[360px]:px-6 bg-gradient-to-b from-black to-[#0a0a0a] relative overflow-hidden -scroll-mt-14">
                {/* Background Logo Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                    <img
                        src="/images/wordmark_B.png"
                        alt=""
                        className="w-[500px] h-[500px] md:w-[700px] md:h-[700px] object-contain invert"
                    />
                </div>

                <div className="max-w-2xl mx-auto relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <p className="text-lg md:text-xl text-white/70 mb-6 max-w-xl mx-auto leading-relaxed">
                            우리는 콘티를 읽고, 작품을 보며 <br />
                            웹툰과 딱 맞는 곡을 설계합니다.
                        </p>

                        <h3 className="text-xl min-[360px]:text-2xl md:text-4xl font-black leading-tight">
                            <span className="whitespace-nowrap">지금, <span className="text-emerald-500">작품</span>에 대해서</span> <br />
                            이야기해 주세요.
                        </h3>
                    </motion.div>

                    <motion.form
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        onSubmit={handleSubmit}
                        className="space-y-2 md:space-y-3 bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-4 md:p-8"
                    >
                        {/* 1행: 이름 + 소속 */}
                        <div className="grid grid-cols-2 gap-2 md:gap-3">
                            <div>
                                <label htmlFor="name" className="block text-xs md:text-sm font-medium text-white/80 mb-1">
                                    이름 <span className="text-emerald-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="홍길동"
                                    className="w-full bg-black/50 border border-white/20 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-2.5 text-sm md:text-base text-white placeholder-white/40 focus:outline-none focus:border-emerald-500/50 focus:bg-black/70 transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="organization" className="block text-xs md:text-sm font-medium text-white/80 mb-1">
                                    소속
                                </label>
                                <input
                                    type="text"
                                    id="organization"
                                    name="organization"
                                    value={formData.organization}
                                    onChange={handleChange}
                                    placeholder="회사/작가명"
                                    className="w-full bg-black/50 border border-white/20 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-2.5 text-sm md:text-base text-white placeholder-white/40 focus:outline-none focus:border-emerald-500/50 focus:bg-black/70 transition-all"
                                />
                            </div>
                        </div>

                        {/* 2행: 이메일 */}
                        <div>
                            <label htmlFor="email" className="block text-xs md:text-sm font-medium text-white/80 mb-1">
                                이메일 <span className="text-emerald-500">*</span>
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="email@example.com"
                                className="w-full bg-black/50 border border-white/20 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-2.5 text-sm md:text-base text-white placeholder-white/40 focus:outline-none focus:border-emerald-500/50 focus:bg-black/70 transition-all"
                                required
                            />
                        </div>

                        {/* 3행: 작품 링크 */}
                        <div>
                            <label htmlFor="workLink" className="block text-xs md:text-sm font-medium text-white/80 mb-1">
                                작품 링크
                            </label>
                            <input
                                type="url"
                                id="workLink"
                                name="workLink"
                                value={formData.workLink}
                                onChange={handleChange}
                                placeholder="webtoon.com/..."
                                className="w-full bg-black/50 border border-white/20 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-2.5 text-sm md:text-base text-white placeholder-white/40 focus:outline-none focus:border-emerald-500/50 focus:bg-black/70 transition-all"
                            />
                        </div>

                        {/* 3행: 작품명 + 장르 + 연재 상태 */}
                        <div className="grid grid-cols-1 min-[360px]:grid-cols-3 gap-2 md:gap-3">
                            <div>
                                <label htmlFor="workTitle" className="block text-xs md:text-sm font-medium text-white/80 mb-1">
                                    작품명
                                </label>
                                <input
                                    type="text"
                                    id="workTitle"
                                    name="workTitle"
                                    value={formData.workTitle}
                                    onChange={handleChange}
                                    placeholder="작품 제목"
                                    className="w-full bg-black/50 border border-white/20 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-2.5 text-sm md:text-base text-white placeholder-white/40 focus:outline-none focus:border-emerald-500/50 focus:bg-black/70 transition-all"
                                />
                            </div>
                            <div>
                                <label htmlFor="genre" className="block text-xs md:text-sm font-medium text-white/80 mb-1">
                                    장르 <span className="text-emerald-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="genre"
                                    name="genre"
                                    value={formData.genre}
                                    onChange={handleChange}
                                    placeholder="로맨스 등"
                                    className="w-full bg-black/50 border border-white/20 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-2.5 text-sm md:text-base text-white placeholder-white/40 focus:outline-none focus:border-emerald-500/50 focus:bg-black/70 transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="serialStatus" className="block text-xs md:text-sm font-medium text-white/80 mb-1">
                                    연재 유/무 <span className="text-emerald-500">*</span>
                                </label>
                                <select
                                    id="serialStatus"
                                    name="serialStatus"
                                    value={formData.serialStatus}
                                    onChange={handleChange}
                                    className="w-full bg-black/50 border border-white/20 rounded-lg md:rounded-xl px-2 md:px-4 py-2 md:py-2.5 text-sm md:text-base text-white focus:outline-none focus:border-emerald-500/50 focus:bg-black/70 transition-all appearance-none cursor-pointer"
                                    required
                                >
                                    <option value="" disabled className="bg-zinc-900">선택</option>
                                    <option value="ongoing" className="bg-zinc-900">연재 중</option>
                                    <option value="upcoming" className="bg-zinc-900">연재 예정</option>
                                </select>
                            </div>
                        </div>

                        {/* 4행: 추가 문의사항 */}
                        <div>
                            <label htmlFor="message" className="block text-xs md:text-sm font-medium text-white/80 mb-1">
                                추가 문의사항
                            </label>
                            <textarea
                                id="message"
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                placeholder="원하시는 음악 스타일이나 참고 레퍼런스"
                                rows={2}
                                className="w-full bg-black/50 border border-white/20 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-2.5 text-sm md:text-base text-white placeholder-white/40 focus:outline-none focus:border-emerald-500/50 focus:bg-black/70 transition-all resize-none"
                            />
                        </div>

                        <motion.button
                            type="submit"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-6 md:px-8 py-3 md:py-3.5 rounded-lg md:rounded-xl text-base md:text-lg transition-colors flex items-center justify-center gap-2"
                        >
                            문의하기
                            <Send className="w-4 h-4 md:w-5 md:h-5" />
                        </motion.button>

                        <p className="text-white/50 text-[10px] md:text-xs text-center">
                            부담없이 문의주셔도 괜찮습니다.
                        </p>
                    </motion.form>

                    <p className="text-center text-emerald-500 text-xl mt-12 tracking-widest font-bold leading-relaxed">
                        route@routelabel.org
                    </p>
                </div>
            </section>

            {/* 메일 서비스 선택 모달 */}
            <AnimatePresence>
                {showMailOptions && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowMailOptions(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <Mail className="w-6 h-6 text-emerald-500" />
                                    <h4 className="text-xl font-bold text-white">메일 서비스 선택</h4>
                                </div>
                                <button
                                    onClick={() => setShowMailOptions(false)}
                                    className="text-white/50 hover:text-white transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <p className="text-white/60 text-sm mb-4">
                                어떤 메일로 보내시겠어요?
                            </p>

                            <div className="space-y-2">
                                {mailServices.map((service) => {
                                    const IconComponent = service.icon;
                                    return (
                                        <button
                                            key={service.id}
                                            onClick={() => handleMailServiceSelect(service)}
                                            className="w-full flex items-center gap-4 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/30 rounded-xl transition-all text-left"
                                        >
                                            <IconComponent />
                                            <span className="text-white font-medium">{service.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
