import { useState, useEffect, useRef, useCallback } from 'react';

// 모바일 감지 훅 (1033px 미만 = Tailwind md 브레이크포인트와 동일) - debounce 적용
export const useIsMobile = () => {
    const MD_BREAKPOINT = 1033;
    const [isMobile, setIsMobile] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth < MD_BREAKPOINT : false
    );
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const checkMobile = useCallback(() => {
        // debounce 150ms
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            setIsMobile(window.innerWidth < MD_BREAKPOINT);
        }, 150);
    }, []);

    useEffect(() => {
        // 초기값 설정
        setIsMobile(window.innerWidth < MD_BREAKPOINT);

        window.addEventListener('resize', checkMobile, { passive: true });
        return () => {
            window.removeEventListener('resize', checkMobile);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [checkMobile]);

    return isMobile;
};

// 반응형 카드 사이즈 계산 훅 - debounce 적용
export const useCardSize = () => {
    const getCardSize = (width: number) => {
        if (width < 640) {
            return { width: 240, margin: 8, offset: 128 }; // 모바일
        } else if (width < 1033) {
            return { width: 360, margin: 16, offset: 196 }; // 태블릿 (md 브레이크포인트 미만)
        } else {
            return { width: 520, margin: 20, offset: 280 }; // PC
        }
    };

    const [cardSize, setCardSize] = useState(() =>
        typeof window !== 'undefined'
            ? getCardSize(window.innerWidth)
            : { width: 520, margin: 20, offset: 280 }
    );
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const updateSize = useCallback(() => {
        // debounce 150ms
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            setCardSize(getCardSize(window.innerWidth));
        }, 150);
    }, []);

    useEffect(() => {
        // 초기값 설정
        setCardSize(getCardSize(window.innerWidth));

        window.addEventListener('resize', updateSize, { passive: true });
        return () => {
            window.removeEventListener('resize', updateSize);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [updateSize]);

    return cardSize;
};
