import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { contactAPI, ContactFormData } from '../../services/contactApi';

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

export const Contact = () => {
    const [formData, setFormData] = useState<ContactFormData>({
        name: '',
        organization: '',
        email: '',
        workLink: '',
        message: ''
    });
    const [status, setStatus] = useState<FormStatus>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');
        setErrorMessage('');

        try {
            await contactAPI.submit(formData);
            setStatus('success');
            // 폼 초기화
            setFormData({
                name: '',
                organization: '',
                email: '',
                workLink: '',
                message: ''
            });
        } catch (error: any) {
            setStatus('error');
            setErrorMessage(
                error.response?.data?.error || '문의 전송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
            );
        }
    };

    const resetForm = () => {
        setStatus('idle');
        setErrorMessage('');
    };

    return (
        <section id="contact" className="py-32 px-6 bg-[#0a0a0a] relative overflow-hidden">
            {/* Decorative background element */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-50" />

            <div className="max-w-4xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="bg-black border border-white/5 rounded-[40px] p-8 md:p-16 shadow-2xl shadow-emerald-500/5"
                >
                    <div className="text-center mb-12">
                        <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">
                            프로젝트 <span className="text-emerald-500">의뢰 문의</span>
                        </h2>
                        <p className="text-white/50 text-lg">
                            작품 링크만 보내주셔도 충분합니다.
                        </p>
                    </div>

                    {/* 성공 메시지 */}
                    {status === 'success' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-2xl mx-auto text-center py-12"
                        >
                            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
                            <h3 className="text-2xl font-bold text-white mb-4">
                                문의가 접수되었습니다!
                            </h3>
                            <p className="text-white/60 mb-8">
                                빠른 시일 내에 입력하신 이메일로 연락드리겠습니다.<br />
                                감사합니다.
                            </p>
                            <button
                                onClick={resetForm}
                                className="text-emerald-400 hover:text-emerald-300 transition-colors underline"
                            >
                                추가 문의하기
                            </button>
                        </motion.div>
                    )}

                    {/* 폼 */}
                    {status !== 'success' && (
                        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
                            {/* 에러 메시지 */}
                            {status === 'error' && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl"
                                >
                                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                    <p className="text-red-400 text-sm">{errorMessage}</p>
                                </motion.div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/30 uppercase tracking-widest pl-2">
                                        이름 / 필명 *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        disabled={status === 'submitting'}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-emerald-500/50 transition-all text-white disabled:opacity-50"
                                        placeholder="홍길동"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/30 uppercase tracking-widest pl-2">
                                        소속 (선택)
                                    </label>
                                    <input
                                        type="text"
                                        name="organization"
                                        value={formData.organization}
                                        onChange={handleChange}
                                        disabled={status === 'submitting'}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-emerald-500/50 transition-all text-white disabled:opacity-50"
                                        placeholder="회사/스튜디오명"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/30 uppercase tracking-widest pl-2">
                                    이메일 *
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    disabled={status === 'submitting'}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-emerald-500/50 transition-all text-white disabled:opacity-50"
                                    placeholder="email@example.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/30 uppercase tracking-widest pl-2">
                                    작품 링크 *
                                </label>
                                <input
                                    type="url"
                                    name="workLink"
                                    value={formData.workLink}
                                    onChange={handleChange}
                                    required
                                    disabled={status === 'submitting'}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-emerald-500/50 transition-all text-white disabled:opacity-50"
                                    placeholder="https://comic.naver.com/..."
                                />
                                <p className="text-xs text-white/30 pl-2">
                                    네이버웹툰, 카카오페이지 등 작품 페이지 URL
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/30 uppercase tracking-widest pl-2">
                                    문의 내용 (선택)
                                </label>
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    rows={4}
                                    disabled={status === 'submitting'}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-emerald-500/50 transition-all text-white resize-none disabled:opacity-50"
                                    placeholder="원하시는 음악 방향이나 궁금한 점을 자유롭게 작성해주세요"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={status === 'submitting'}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white py-5 rounded-2xl font-bold text-xl transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-3"
                            >
                                {status === 'submitting' ? (
                                    <>
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        전송 중...
                                    </>
                                ) : (
                                    '의뢰 문의하기'
                                )}
                            </button>
                        </form>
                    )}

                    {/* 직접 문의 */}
                    <div className="mt-10 pt-8 border-t border-white/5 text-center">
                        <p className="text-white/30 text-sm mb-4">또는 직접 문의하기</p>
                        <a
                            href="mailto:route@routelabel.org"
                            className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                            <Mail className="w-5 h-5" />
                            route@routelabel.org
                        </a>
                    </div>
                </motion.div>

                <footer className="mt-20 text-center text-white/20 text-xs font-mono tracking-widest uppercase">
                    © 2025 ROUTELABEL. All rights reserved.
                </footer>
            </div>
        </section>
    );
};
