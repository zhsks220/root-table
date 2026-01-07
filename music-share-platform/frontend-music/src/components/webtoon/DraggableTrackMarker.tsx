import { useState, useRef, useEffect } from 'react';
import { GripVertical, X, Music, Play, Pause } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useThemeStore } from '../../store/themeStore';
import { usePlayerStore } from '../../store/playerStore';
import { Track } from '../../types';

interface DraggableTrackMarkerProps {
  track: Track;
  position: { x: number; y: number };
  onUpdate: (position: { x: number; y: number }) => void;
  onDelete: () => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

export function DraggableTrackMarker({ track, position, onUpdate, onDelete, containerRef }: DraggableTrackMarkerProps) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const { playTrack, togglePlay, currentTrack, isPlaying } = usePlayerStore();

  const [isDragging, setIsDragging] = useState(false);
  const [currentPos, setCurrentPos] = useState(position);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const markerRef = useRef<HTMLDivElement>(null);

  // position prop이 변경되면 currentPos 동기화
  useEffect(() => {
    setCurrentPos(position);
  }, [position]);

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

  useEffect(() => {
    if (!isDragging) return;

    let finalPos = currentPos;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const scrollTop = containerRef.current.scrollTop;

      // Y축만 계산 (X축은 항상 0)
      let newY = e.clientY - containerRect.top + scrollTop - dragStartPos.current.y;

      // 컨테이너 경계 체크 (Y축만)
      newY = Math.max(0, newY);

      finalPos = { x: 0, y: newY };
      setCurrentPos(finalPos);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      console.log('🎯 Marker dragged to final position:', finalPos.y);
      onUpdate(finalPos);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onUpdate, containerRef]);

  return (
    <div
      ref={markerRef}
      className={cn(
        'absolute z-20 rounded-lg shadow-lg border-2 cursor-grab',
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
    >
      {/* 한 줄로 표시 */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <GripVertical className="w-4 h-4 text-white flex-shrink-0" />

          {/* 재생/일시정지 버튼 */}
          <button
            onClick={handlePlayToggle}
            className="p-1 hover:bg-emerald-700 rounded transition-colors flex-shrink-0"
          >
            {isThisTrackPlaying ? (
              <Pause className="w-4 h-4 text-white fill-white" />
            ) : (
              <Play className="w-4 h-4 text-white fill-white" />
            )}
          </button>

          <Music className="w-4 h-4 text-white flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-bold truncate">{track.title}</p>
            <p className="text-emerald-100 text-xs truncate">{track.artist}</p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 hover:bg-emerald-700 rounded transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}
