import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '../../lib/utils';

export const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const lastScrollRef = useRef(0);
    const throttleMs = 50;

    const handleScroll = useCallback(() => {
        const now = Date.now();
        if (now - lastScrollRef.current < throttleMs) return;

        lastScrollRef.current = now;
        setIsScrolled(window.scrollY > 20);
    }, []);

    useEffect(() => {
        // 초기 상태 설정
        setIsScrolled(window.scrollY > 20);

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

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

            <div className="flex items-center gap-2 min-[360px]:gap-4 md:gap-12 text-[10px] min-[360px]:text-xs md:text-sm lg:text-base font-medium text-white/80 whitespace-nowrap ml-auto md:ml-0 md:absolute md:left-1/2 md:-translate-x-1/2">
                <a href="#" className="hover:text-white transition-colors">Label</a>
                <a href="#genre-bgm" className="hover:text-white transition-colors">Works</a>
                <a href="#testimonials" className="hover:text-white transition-colors">Voices</a>
                <a href="#process" className="hover:text-white transition-colors">Process</a>
                <a href="#contact" className="hover:text-white transition-colors">Contact</a>
            </div>

        </nav>
    );
};
