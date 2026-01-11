import { useState, useEffect } from 'react';

// 모바일 감지 훅 (768px 미만)
export const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return isMobile;
};

// 반응형 카드 사이즈 계산 훅
export const useCardSize = () => {
    const [cardSize, setCardSize] = useState({ width: 520, margin: 20, offset: 280 });

    useEffect(() => {
        const updateSize = () => {
            const w = window.innerWidth;
            if (w < 640) {
                // 모바일
                setCardSize({ width: 280, margin: 10, offset: 150 });
            } else if (w < 768) {
                // 태블릿
                setCardSize({ width: 420, margin: 20, offset: 210 });
            } else {
                // PC
                setCardSize({ width: 520, margin: 20, offset: 280 });
            }
        };

        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    return cardSize;
};
