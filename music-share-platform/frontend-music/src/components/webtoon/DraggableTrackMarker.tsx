import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { GripVertical, X, Music, Play, Pause } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useThemeStore } from '../../store/themeStore';
import { usePlayerStore } from '../../store/playerStore';
import { Track } from '../../types';

interface DraggableTrackMarkerProps {
  markerId: string;
  track: Track;
  position: { x: number; y: number };
  onUpdate: (position: { x: number; y: number }) => void;
  onDelete: () => void;
  containerRef: React.RefObject<HTMLDivElement>;
  onRegister?: (markerId: string, element: HTMLElement | null) => void;
}

export const DraggableTrackMarker = forwardRef<HTMLDivElement, DraggableTrackMarkerProps>(
  function DraggableTrackMarker({ markerId, track, position, onUpdate, onDelete, containerRef, onRegister }, ref) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const { playTrack, togglePlay, currentTrack, isPlaying } = usePlayerStore();

  const [isDragging, setIsDragging] = useState(false);
  const [currentPos, setCurrentPos] = useState(position);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const markerRef = useRef<HTMLDivElement>(null);

  // forwardRef와 내부 ref 연결
  useImperativeHandle(ref, () => markerRef.current as HTMLDivElement);

  // position prop이 변경되면 currentPos 동기화
  useEffect(() => {
    setCurrentPos(position);
  }, [position]);

  // 마커 엘리먼트 등록 (Intersection Observer용)
  useEffect(() => {
    if (onRegister && markerRef.current) {
      onRegister(markerId, markerRef.current);
    }
    return () => {
      if (onRegister) {
        onRegister(markerId, null);
      }
    };
  }, [markerId, onRegister]);

  // 현재 이 트랙이 재생 중인지 확인
  const isCurrentTrack = currentTrack?.id === track.id;
  const isThisTrackPlaying = isCurrentTrack && isPlaying;

  const handlePlayToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // 드래그 방지

    if (isCurrentTrack) {
      // 같은 트랙이면 재생/일시정지 토글
      togglePlay();
    } else {
      // 다른 트랙이면 새로 재생
      playTrack(track).catch(err => {
        console.error('Failed to play track:', err);
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();

    setIsDragging(true);
    dragStartPos.current = {
      x: 0, // X축은 사용 안 함
      y: e.clientY - containerRect.top - currentPos.y + containerRef.current.scrollTop
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!containerRef.current) return;
    const touch = e.touches[0];
    const containerRect = containerRef.current.getBoundingClientRect();

    setIsDragging(true);
    dragStartPos.current = {
      x: 0,
      y: touch.clientY - containerRect.top - currentPos.y + containerRef.current.scrollTop
    };
  };

  useEffect(() => {
    if (!isDragging) return;

    let finalPos = currentPos;

    const handleMove = (clientY: number) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const scrollTop = containerRef.current.scrollTop;

      // Y축만 계산 (X축은 항상 0)
      let newY = clientY - containerRect.top + scrollTop - dragStartPos.current.y;

      // 컨테이너 경계 체크 (Y축만)
      newY = Math.max(0, newY);

      finalPos = { x: 0, y: newY };
      setCurrentPos(finalPos);
    };

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleMove(e.touches[0].clientY);
    };

    const handleEnd = () => {
      setIsDragging(false);
      onUpdate(finalPos);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, onUpdate, containerRef]);

  return (
    <div
      ref={markerRef}
      className={cn(
        'absolute z-20 rounded-lg shadow-lg border-2 cursor-grab touch-none',
        isDark ? 'bg-emerald-600 border-emerald-500' : 'bg-emerald-500 border-emerald-400',
        isDragging && 'cursor-grabbing opacity-80',
        isThisTrackPlaying && 'ring-2 ring-yellow-400'
      )}
      style={{
        left: '0px',
        right: '0px',
        top: `${currentPos.y}px`,
        width: '100%',
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* 한 줄로 표시 - 컴팩트 */}
      <div className="flex items-center justify-between px-2 py-1">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <GripVertical className="w-3 h-3 text-white flex-shrink-0" />

          {/* 재생/일시정지 버튼 */}
          <button
            onClick={handlePlayToggle}
            className="p-0.5 hover:bg-emerald-700 rounded transition-colors flex-shrink-0"
          >
            {isThisTrackPlaying ? (
              <Pause className="w-3 h-3 text-white fill-white" />
            ) : (
              <Play className="w-3 h-3 text-white fill-white" />
            )}
          </button>

          <Music className="w-3 h-3 text-white flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-white text-[10px] font-bold truncate leading-tight">{track.title}</p>
            <p className="text-emerald-100 text-[10px] truncate leading-tight">{track.artist}</p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-0.5 hover:bg-emerald-700 rounded transition-colors flex-shrink-0"
        >
          <X className="w-3 h-3 text-white" />
        </button>
      </div>
    </div>
  );
});
