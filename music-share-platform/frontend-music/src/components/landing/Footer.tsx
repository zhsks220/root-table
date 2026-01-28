import { Link } from 'react-router-dom';

export const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-black border-t border-white/10 py-12 px-4 min-[360px]:px-6">
            <div className="max-w-6xl mx-auto">
                {/* 상단 영역 */}
                <div className="flex flex-col md:flex-row justify-between gap-8 mb-10">
                    {/* 로고 및 회사 정보 */}
                    <div className="space-y-4">
                        <img
                            src="/images/typelogo_W.png"
                            alt="ROUTELABEL"
                            className="h-12 object-contain"
                        />
                        <div className="text-white/40 text-xs min-[360px]:text-sm space-y-1">
                            <p>상호명: 주식회사 루트레이블</p>
                            <p>대표: 최선</p>
                            <p>사업자등록번호: 846-81-08268</p>
                            <p>주소: 서울특별시 서대문구 연세로5나길 16, 지하 1층</p>
                            <p>이메일: route@routelabel.org</p>
                        </div>
                    </div>

                    {/* 링크 영역 */}
                    <div className="flex gap-8 min-[360px]:gap-12">
                        <div className="space-y-3">
                            <h4 className="text-white font-medium text-sm">서비스</h4>
                            <ul className="space-y-2 text-white/40 text-sm">
                                <li>
                                    <a href="#process" className="hover:text-white/70 transition-colors">
                                        제작 프로세스
                                    </a>
                                </li>
                                <li>
                                    <a href="#genre-bgm" className="hover:text-white/70 transition-colors">
                                        장르별 BGM
                                    </a>
                                </li>
                                <li>
                                    <a href="#contact" className="hover:text-white/70 transition-colors">
                                        문의하기
                                    </a>
                                </li>
                            </ul>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-white font-medium text-sm">약관 및 정책</h4>
                            <ul className="space-y-2 text-white/40 text-sm">
                                <li>
                                    <Link to="/terms" className="hover:text-white/70 transition-colors">
                                        이용약관
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/privacy" className="hover:text-white/70 transition-colors">
                                        개인정보처리방침
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* 하단 영역 */}
                <div className="border-t border-white/10 pt-6 flex flex-col items-center gap-4">
                    <p className="text-white/30 text-xs">
                        &copy; {currentYear} ROUTELABEL. All rights reserved.
                    </p>
                    <Link
                        to="/partner/login"
                        className="text-white/20 text-xs hover:text-white/40 transition-colors"
                    >
                        파트너 로그인
                    </Link>
                </div>
            </div>
        </footer>
    );
};
