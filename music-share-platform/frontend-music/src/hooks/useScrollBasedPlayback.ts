import { useEffect, useRef, useCallback, useMemo } from 'react';
import { Track } from '../types';

interface TrackMarker {
  id: string;
  track: Track;
  position: { x: number; y: number };
}

interface UseScrollBasedPlaybackOptions {
  enabled?: boolean;
  threshold?: number; // 0 = 마커가 보이기 시작할 때, 0.5 = 50% 보일 때
  onMarkerEnter?: (marker: TrackMarker, direction: 'down' | 'up') => void;
  onMarkerLeave?: (marker: TrackMarker, direction: 'down' | 'up') => void;
}

export function useScrollBasedPlayback(
  containerRef: React.RefObject<HTMLDivElement>,
  trackMarkers: TrackMarker[],
  currentTrackId: string | undefined,
  isPlaying: boolean,
  playTrack: (track: Track) => Promise<void>,
  options: UseScrollBasedPlaybackOptions = {},
  mobileContainerRef?: React.RefObject<HTMLDivElement>
) {
  const {
    enabled = true,
    threshold = 0,
  } = options;

  const observerRef = useRef<IntersectionObserver | null>(null);
  const mobileObserverRef = useRef<IntersectionObserver | null>(null);
  const markerElementsRef = useRef<Map<string, HTMLElement>>(new Map());
  const lastScrollTop = useRef<number>(0);
  const mobileLastScrollTop = useRef<number>(0);
  const passedMarkers = useRef<Set<string>>(new Set());
  const isInitialized = useRef(false);
  const mobileIsInitialized = useRef(false);

  // 마커를 Y 위치로 정렬 (캐싱)
  const sortedMarkers = useMemo(() =>
    [...trackMarkers].sort((a, b) => a.position.y - b.position.y),
    [trackMarkers]
  );

  // 스크롤 방향 감지
  const getScrollDirection = useCallback((isMobile = false): 'down' | 'up' => {
    const ref = isMobile ? mobileContainerRef : containerRef;
    const lastScroll = isMobile ? mobileLastScrollTop : lastScrollTop;

    if (!ref?.current) return 'down';
    const currentScrollTop = ref.current.scrollTop;
    const direction = currentScrollTop > lastScroll.current ? 'down' : 'up';
    lastScroll.current = currentScrollTop;
    return direction;
  }, [containerRef, mobileContainerRef]);

  // 마커 재생 처리
  const handleMarkerTrigger = useCallback(async (
    marker: TrackMarker,
    _direction: 'down' | 'up'
  ) => {
    // 같은 트랙이고 이미 재생 중이면 스킵
    // 일시정지 상태거나 다른 트랙이면 재생
    if (currentTrackId === marker.track.id && isPlaying) return;

    try {
      await playTrack(marker.track);
    } catch (error) {
      console.error('Failed to play track:', error);
    }
  }, [currentTrackId, isPlaying, playTrack]);

  // Intersection Observer 콜백
  const handleIntersection = useCallback((entries: IntersectionObserverEntry[], isMobile = false) => {
    const direction = getScrollDirection(isMobile);

    entries.forEach((entry) => {
      const markerId = entry.target.getAttribute('data-marker-id');
      if (!markerId) return;

      const marker = trackMarkers.find(m => m.id === markerId);
      if (!marker) return;

      if (entry.isIntersecting) {
        // 마커가 화면에 진입
        if (direction === 'down') {
          // 아래로 스크롤 시: 새 마커 진입하면 재생
          if (!passedMarkers.current.has(markerId)) {
            passedMarkers.current.add(markerId);
            handleMarkerTrigger(marker, direction);
          }
        } else {
          // 위로 스크롤 시: 이전 마커 찾아서 재생
          const currentIndex = sortedMarkers.findIndex(m => m.id === markerId);
          if (currentIndex > 0) {
            const previousMarker = sortedMarkers[currentIndex - 1];
            if (!passedMarkers.current.has(previousMarker.id)) {
              passedMarkers.current.add(previousMarker.id);
            }
            handleMarkerTrigger(previousMarker, direction);
          }
        }
      } else {
        // 마커가 화면에서 벗어남
        if (direction === 'up' && passedMarkers.current.has(markerId)) {
          passedMarkers.current.delete(markerId);
        }
      }
    });
  }, [trackMarkers, sortedMarkers, getScrollDirection, handleMarkerTrigger]);

  // 마커 엘리먼트 등록
  const registerMarkerElement = useCallback((markerId: string, element: HTMLElement | null) => {
    if (!element) {
      // element가 null이면 unregister
      const existingElement = markerElementsRef.current.get(markerId);
      if (existingElement) {
        observerRef.current?.unobserve(existingElement);
        mobileObserverRef.current?.unobserve(existingElement);
      }
      markerElementsRef.current.delete(markerId);
      return;
    }

    // data-marker-id 속성 설정
    element.setAttribute('data-marker-id', markerId);

    // 기존 element가 있으면 unobserve
    const existingElement = markerElementsRef.current.get(markerId);
    if (existingElement && existingElement !== element) {
      observerRef.current?.unobserve(existingElement);
      mobileObserverRef.current?.unobserve(existingElement);
    }

    // 데스크톱/모바일 observer에 등록
    observerRef.current?.observe(element);
    mobileObserverRef.current?.observe(element);
    markerElementsRef.current.set(markerId, element);
  }, []);

  // 초기화: 현재 보이는 마커 체크
  const initializeVisibleMarkers = useCallback(() => {
    if (!containerRef.current || sortedMarkers.length === 0) return;

    const container = containerRef.current;
    const viewportBottom = container.scrollTop + container.clientHeight;

    // 현재 화면에 보이는 마커들 중 가장 아래 것 찾기
    let lastVisibleMarker: TrackMarker | null = null;

    for (const marker of sortedMarkers) {
      if (marker.position.y <= viewportBottom) {
        passedMarkers.current.add(marker.id);
        lastVisibleMarker = marker;
      } else {
        break;
      }
    }

    // 초기 재생
    if (lastVisibleMarker && currentTrackId !== lastVisibleMarker.track.id) {
      playTrack(lastVisibleMarker.track).catch(console.error);
    }

    lastScrollTop.current = container.scrollTop;
    isInitialized.current = true;
  }, [containerRef, sortedMarkers, currentTrackId, playTrack]);

  // Observer 설정 (데스크톱)
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    // IntersectionObserver 생성
    observerRef.current = new IntersectionObserver((entries) => handleIntersection(entries, false), {
      root: containerRef.current,
      threshold: threshold,
      rootMargin: '0px',
    });

    // 기존 등록된 엘리먼트들 다시 observe
    markerElementsRef.current.forEach((element) => {
      observerRef.current?.observe(element);
    });

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [enabled, containerRef, threshold, handleIntersection]);

  // Observer 설정 (모바일)
  useEffect(() => {
    if (!enabled || !mobileContainerRef?.current) return;

    // 모바일 IntersectionObserver 생성
    mobileObserverRef.current = new IntersectionObserver((entries) => handleIntersection(entries, true), {
      root: mobileContainerRef.current,
      threshold: threshold,
      rootMargin: '0px',
    });

    // 기존 등록된 엘리먼트들 다시 observe
    markerElementsRef.current.forEach((element) => {
      mobileObserverRef.current?.observe(element);
    });

    return () => {
      mobileObserverRef.current?.disconnect();
      mobileObserverRef.current = null;
    };
  }, [enabled, mobileContainerRef, threshold, handleIntersection]);

  // 빠른 스크롤 감지를 위한 스크롤 이벤트 폴백
  useEffect(() => {
    if (!enabled || !containerRef.current || sortedMarkers.length === 0) return;

    const container = containerRef.current;
    let lastCheckTime = 0;
    const throttleMs = 50; // 50ms 간격으로 체크

    const handleScroll = () => {
      const now = Date.now();
      if (now - lastCheckTime < throttleMs) return;
      lastCheckTime = now;

      const scrollTop = container.scrollTop;
      const viewportTop = scrollTop;
      const viewportBottom = scrollTop + container.clientHeight;
      const viewportCenter = scrollTop + container.clientHeight / 2;

      // 현재 뷰포트 중앙에 가장 가까운 마커 찾기
      let closestMarker: TrackMarker | null = null;
      let closestDistance = Infinity;

      for (const marker of sortedMarkers) {
        // 마커가 뷰포트 안에 있는지 확인
        if (marker.position.y >= viewportTop && marker.position.y <= viewportBottom) {
          const distance = Math.abs(marker.position.y - viewportCenter);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestMarker = marker;
          }
        }
      }

      // 뷰포트 안에 마커가 있고, 아직 지나치지 않은 마커면 재생
      if (closestMarker && !passedMarkers.current.has(closestMarker.id)) {
        passedMarkers.current.add(closestMarker.id);
        handleMarkerTrigger(closestMarker, 'down');
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [enabled, containerRef, sortedMarkers, handleMarkerTrigger]);

  // 모바일용 스크롤 이벤트 폴백
  useEffect(() => {
    if (!enabled || !mobileContainerRef?.current || sortedMarkers.length === 0) return;

    const container = mobileContainerRef.current;
    let lastCheckTime = 0;
    const throttleMs = 50;

    const handleScroll = () => {
      const now = Date.now();
      if (now - lastCheckTime < throttleMs) return;
      lastCheckTime = now;

      const scrollTop = container.scrollTop;
      const viewportTop = scrollTop;
      const viewportBottom = scrollTop + container.clientHeight;
      const viewportCenter = scrollTop + container.clientHeight / 2;

      let closestMarker: TrackMarker | null = null;
      let closestDistance = Infinity;

      for (const marker of sortedMarkers) {
        if (marker.position.y >= viewportTop && marker.position.y <= viewportBottom) {
          const distance = Math.abs(marker.position.y - viewportCenter);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestMarker = marker;
          }
        }
      }

      if (closestMarker && !passedMarkers.current.has(closestMarker.id)) {
        passedMarkers.current.add(closestMarker.id);
        handleMarkerTrigger(closestMarker, 'down');
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    container.addEventListener('touchmove', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('touchmove', handleScroll);
    };
  }, [enabled, mobileContainerRef, sortedMarkers, handleMarkerTrigger]);

  // 마커가 변경되면 초기화
  useEffect(() => {
    if (!enabled || trackMarkers.length === 0) return;

    // 약간의 딜레이 후 초기화 (DOM 렌더링 대기)
    const timer = setTimeout(() => {
      if (!isInitialized.current) {
        initializeVisibleMarkers();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [enabled, trackMarkers, initializeVisibleMarkers]);

  // passedMarkers 리셋
  const resetPassedMarkers = useCallback(() => {
    passedMarkers.current.clear();
    isInitialized.current = false;
    mobileIsInitialized.current = false;
  }, []);

  return {
    registerMarkerElement,
    resetPassedMarkers,
    sortedMarkers,
  };
}
