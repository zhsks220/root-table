import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { useState } from 'react';

// 회사 이메일 주소
const COMPANY_EMAIL = 'route@routelabel.org';

export const FinalCTA = () => {
    const [formData, setFormData] = useState({
        name: '',
        organization: '',
        email: '',
        workLink: '',
        message: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // 이메일 본문 구성
        const subject = `[웹툰 음악 문의] ${formData.name}${formData.organization ? ` (${formData.organization})` : ''}`;
        const body = `
안녕하세요, 웹툰 음악 제작 문의드립니다.

■ 이름: ${formData.name}
■ 소속: ${formData.organization || '(미입력)'}
■ 이메일: ${formData.email}
■ 작품 링크: ${formData.workLink}

■ 추가 메시지:
${formData.message || '(없음)'}
        `.trim();

        // mailto 링크로 이메일 앱 열기
        const mailtoLink = `mailto:${COMPANY_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoLink;
    };

    return (
        <section id="contact" className="py-24 mt-16 px-6 bg-gradient-to-b from-black to-[#0a0a0a] relative overflow-hidden">
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

                    <h3 className="text-2xl md:text-4xl font-black leading-tight">
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
                    className="space-y-4 bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-white/80 mb-2">
                                이름 <span className="text-emerald-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="홍길동"
                                className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-500/50 focus:bg-black/70 transition-all"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="organization" className="block text-sm font-medium text-white/80 mb-2">
                                소속 (선택)
                            </label>
                            <input
                                type="text"
                                id="organization"
                                name="organization"
                                value={formData.organization}
                                onChange={handleChange}
                                placeholder="회사명 또는 작가명"
                                className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-500/50 focus:bg-black/70 transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                            이메일 <span className="text-emerald-500">*</span>
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="example@email.com"
                            className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-500/50 focus:bg-black/70 transition-all"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="workLink" className="block text-sm font-medium text-white/80 mb-2">
                            작품 링크 <span className="text-emerald-500">*</span>
                        </label>
                        <input
                            type="url"
                            id="workLink"
                            name="workLink"
                            value={formData.workLink}
                            onChange={handleChange}
                            placeholder="https://webtoon.com/..."
                            className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-500/50 focus:bg-black/70 transition-all"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="message" className="block text-sm font-medium text-white/80 mb-2">
                            추가 메시지 (선택)
                        </label>
                        <textarea
                            id="message"
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            placeholder="원하시는 음악 스타일이나 참고할 레퍼런스가 있다면 알려주세요."
                            rows={4}
                            className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-500/50 focus:bg-black/70 transition-all resize-none"
                        />
                    </div>

                    <motion.button
                        type="submit"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-8 py-4 rounded-xl text-lg transition-colors flex items-center justify-center gap-2"
                    >
                        문의하기
                        <Send className="w-5 h-5" />
                    </motion.button>

                    <p className="text-white/50 text-sm text-center">
                        레퍼런스 없이 시작해도 괜찮습니다. 작품 링크만 보내주세요.
                    </p>
                </motion.form>
            </div>
        </section>
    );
};
