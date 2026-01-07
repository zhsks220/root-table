import { useState, useRef, useEffect } from 'react';
import { GripVertical, X, Save } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useThemeStore } from '../../store/themeStore';
import { WebToonMemoNote } from '../../types';

interface DraggableMemoNoteProps {
  note: WebToonMemoNote;
  onUpdate: (note: WebToonMemoNote) => void;
  onDelete: (noteId: string) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

export function DraggableMemoNote({ note, onUpdate, onDelete, containerRef }: DraggableMemoNoteProps) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(note.content);
  const [position, setPosition] = useState({ x: note.position_x, y: note.position_y });
  const dragStartPos = useRef({ x: 0, y: 0 });
  const noteRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return; // 편집 중에는 드래그 불가

    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();

    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - containerRect.left - position.x,
      y: e.clientY - containerRect.top - position.y + containerRef.current.scrollTop
    };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const scrollTop = containerRef.current.scrollTop;

      // 상대적 위치 계산 수정
      let newX = e.clientX - containerRect.left - dragStartPos.current.x;
      let newY = e.clientY - containerRect.top + scrollTop - dragStartPos.current.y;

      // 컨테이너 경계 체크
      const noteWidth = noteRef.current?.offsetWidth || 200;

      newX = Math.max(0, Math.min(newX, containerRect.width - noteWidth));
      newY = Math.max(0, newY);

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // 위치 업데이트 저장
      onUpdate({
        ...note,
        position_x: position.x,
        position_y: position.y
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, position, note, onUpdate, containerRef]);

  const handleSave = () => {
    onUpdate({
      ...note,
      content,
      position_x: position.x,
      position_y: position.y
    });
    setIsEditing(false);
  };

  return (
    <div
      ref={noteRef}
      className={cn(
        'absolute z-20 min-w-[150px] max-w-[250px] rounded-lg shadow-lg border-2',
        isDark ? 'bg-yellow-200 border-yellow-400' : 'bg-yellow-100 border-yellow-300',
        isDragging && 'cursor-grabbing opacity-80'
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${note.width}px`,
        minHeight: `${note.height}px`
      }}
    >
      {/* 헤더 - 드래그 핸들 */}
      <div
        className={cn(
          'flex items-center justify-between px-2 py-1 border-b cursor-grab',
          isDark ? 'border-yellow-400' : 'border-yellow-300'
        )}
        onMouseDown={handleMouseDown}
      >
        <GripVertical className="w-4 h-4 text-yellow-700" />
        <button
          onClick={() => onDelete(note.id)}
          className="p-0.5 hover:bg-yellow-300 rounded transition-colors"
        >
          <X className="w-3 h-3 text-yellow-800" />
        </button>
      </div>

      {/* 내용 */}
      <div className="p-2">
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={cn(
                'w-full px-2 py-1 text-xs rounded border resize-none',
                'bg-white text-gray-900 border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500'
              )}
              rows={3}
              autoFocus
            />
            <button
              onClick={handleSave}
              className="w-full flex items-center justify-center gap-1 px-2 py-1 text-xs bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors"
            >
              <Save className="w-3 h-3" />
              <span>저장</span>
            </button>
          </div>
        ) : (
          <div
            onClick={() => setIsEditing(true)}
            className="text-xs text-gray-800 cursor-pointer hover:bg-yellow-50 p-1 rounded min-h-[40px]"
          >
            {content || '클릭하여 메모 작성...'}
          </div>
        )}
      </div>
    </div>
  );
}
