import { useState, useEffect, memo } from 'react';

// 전역 이미지 캐시 (blob URL 저장)
const imageCache = new Map<string, string>();

interface CachedImageProps {
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
}

/**
 * 이미지를 blob으로 캐싱하는 컴포넌트
 * 한번 로드된 이미지는 메모리에 저장되어 즉시 표시됨
 */
export const CachedImage = memo(function CachedImage({
  src,
  alt,
  className,
  onLoad,
}: CachedImageProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) return;

    // 캐시에 있으면 즉시 사용
    const cached = imageCache.get(src);
    if (cached) {
      setBlobUrl(cached);
      setLoading(false);
      return;
    }

    // 캐시에 없으면 fetch로 가져와서 blob URL 생성
    let isMounted = true;

    fetch(src)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch image');
        return res.blob();
      })
      .then(blob => {
        if (!isMounted) return;

        const url = URL.createObjectURL(blob);
        imageCache.set(src, url);
        setBlobUrl(url);
        setLoading(false);
        onLoad?.();
      })
      .catch(() => {
        if (!isMounted) return;
        setError(true);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [src, onLoad]);

  if (error) {
    return (
      <div className={className + ' bg-gray-200 dark:bg-gray-800 flex items-center justify-center'}>
        <span className="text-gray-400 text-xs">이미지 로드 실패</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={className + ' bg-gray-200 dark:bg-gray-800 animate-pulse'} />
    );
  }

  return (
    <img
      src={blobUrl || src}
      alt={alt}
      className={className}
      loading="eager"
    />
  );
});

// 캐시 초기화 함수 (필요시 사용)
export function clearImageCache() {
  imageCache.forEach(url => URL.revokeObjectURL(url));
  imageCache.clear();
}
