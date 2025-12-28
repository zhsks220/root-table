import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';

export const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuthStore();

    const handleStart = () => {
        if (isAuthenticated) {
            // 로그인 상태면 역할에 따라 적절한 페이지로 이동
            if (user?.role === 'admin') {
                navigate('/admin');
            } else if (user?.role === 'partner') {
                navigate('/partner/dashboard');
            } else {
                navigate('/my-tracks');
            }
        } else {
            // 로그인 안 되어 있으면 로그인 페이지로
            navigate('/login');
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4 flex justify-between items-center",
                isScrolled ? "bg-black/60 backdrop-blur-md border-b border-white/10 py-3" : "bg-transparent"
            )}
        >
            <a href="#" className="flex items-center">
                <img
                    src="/images/typelogo_W.png"
                    alt="ROUTELABEL"
                    className="h-16 md:h-20 object-contain"
                />
            </a>

            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
                <a href="#process" className="hover:text-white transition-colors">제작 프로세스</a>
                <a href="#testimonials" className="hover:text-white transition-colors">독자 반응</a>
                <a href="#contact" className="hover:text-white transition-colors">상담 신청</a>
            </div>

            <button
                onClick={handleStart}
                className="bg-white hover:bg-gray-100 text-black px-4 py-2 rounded-full text-sm font-bold transition-all"
            >
                {isAuthenticated ? '워크스페이스' : '시작하기'}
            </button>
        </nav>
    );
};
