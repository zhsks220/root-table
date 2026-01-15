import { useState, useEffect, useRef, useCallback } from "react";

export const useMousePosition = (enabled: boolean = true) => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const lastUpdateRef = useRef(0);
    const throttleMs = 32; // ~30fps (성능 최적화)

    const handleMouseMove = useCallback((e: MouseEvent) => {
        const now = Date.now();
        if (now - lastUpdateRef.current < throttleMs) return;

        lastUpdateRef.current = now;
        setPosition({ x: e.clientX, y: e.clientY });
    }, []);

    useEffect(() => {
        // enabled가 false면 리스너 등록하지 않음
        if (!enabled) return;

        window.addEventListener("mousemove", handleMouseMove, { passive: true });
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [enabled, handleMouseMove]);

    return position;
};
