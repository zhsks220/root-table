import { useEffect, useRef, useCallback } from 'react';

interface PreloadOptions {
  threshold?: number; // 0-1, 기본값 0.7 (70%)
  preloadCount?: number; // 미리 로드할 이미지 수, 기본값 3
}

/**
 * 스크롤 기반 이미지 프리로더 훅
 * 현재 보이는 이미지의 threshold% 지점에 도달하면 다음 이미지들을 미리 로드
 */
export function useImagePreloader(
  containerRef: React.RefObject<HTMLElement>,
  imageUrls: string[],
  options: PreloadOptions = {}
) {
  const { threshold = 0.7, preloadCount = 3 } = options;
  const preloadedSet = useRef<Set<string>>(new Set());
  const currentIndexRef = useRef(0);

  // 이미지 프리로드 함수
  const preloadImage = useCallback((url: string) => {
    if (!url || preloadedSet.current.has(url)) return;

    const img = new Image();
    img.src = url;
    preloadedSet.current.add(url);
    console.log(`🖼️ 프리로드: ${url.slice(0, 50)}...`);
  }, []);

  // 다음 이미지들 프리로드
  const preloadNextImages = useCallback((currentIndex: number) => {
    for (let i = 1; i <= preloadCount; i++) {
      const nextIndex = currentIndex + i;
      if (nextIndex < imageUrls.length) {
        preloadImage(imageUrls[nextIndex]);
      }
    }
  }, [imageUrls, preloadCount, preloadImage]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || imageUrls.length === 0) return;

    // 처음 3개는 바로 프리로드
    imageUrls.slice(0, preloadCount).forEach(preloadImage);

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const scrollableHeight = scrollHeight - clientHeight;

      if (scrollableHeight <= 0) return;

      // 전체 스크롤 진행률
      const scrollProgress = scrollTop / scrollableHeight;

      // 현재 이미지 인덱스 계산 (장면 기준)
      const totalImages = imageUrls.length;
      const currentIndex = Math.floor(scrollProgress * totalImages);

      // 현재 이미지 내에서의 진행률
      const imageProgress = (scrollProgress * totalImages) - currentIndex;

      // threshold% 지점 도달 시 다음 이미지들 프리로드
      if (imageProgress >= threshold && currentIndex > currentIndexRef.current) {
        currentIndexRef.current = currentIndex;
        preloadNextImages(currentIndex);
      }
    };

    // 스크롤 이벤트에 throttle 적용
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener('scroll', throttledScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', throttledScroll);
    };
  }, [containerRef, imageUrls, threshold, preloadCount, preloadImage, preloadNextImages]);

  // 이미지 목록이 변경되면 캐시 초기화
  useEffect(() => {
    preloadedSet.current.clear();
    currentIndexRef.current = 0;
  }, [imageUrls]);

  return {
    preloadedCount: preloadedSet.current.size,
  };
}
