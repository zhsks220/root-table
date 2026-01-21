import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Trash2 } from 'lucide-react';
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
  const [isEditing, setIsEditing] = useState(!note.content); // 새 메모는 바로 편집 모드
  const [showDeleteButton, setShowDeleteButton] = useState(false); // 모바일용
  const [showContextMenu, setShowContextMenu] = useState(false); // PC용 우클릭 메뉴
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [content, setContent] = useState(note.content);
  const [position, setPosition] = useState({ x: note.position_x, y: note.position_y });

  const dragStartPos = useRef({ x: 0, y: 0 });
  const noteRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);
  const hasMoved = useRef(false);
  const mouseDownTime = useRef(0); // PC에서 클릭 vs 드래그 구분용

  // 외부에서 note가 변경되면 동기화
  useEffect(() => {
    setContent(note.content);
  }, [note.content]);

  useEffect(() => {
    setPosition({ x: note.position_x, y: note.position_y });
  }, [note.position_x, note.position_y]);

  // ref로 최신 값 유지 (클로저 문제 방지)
  const contentRef = useRef(content);
  const positionRef = useRef(position);
  const noteRef2 = useRef(note);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    noteRef2.current = note;
  }, [note]);

  // 저장 함수
  const saveNote = useCallback(() => {
    onUpdate({
      ...noteRef2.current,
      content: contentRef.current,
      position_x: positionRef.current.x,
      position_y: positionRef.current.y
    });
  }, [onUpdate]);

  // 외부 클릭 감지하여 저장
  useEffect(() => {
    if (!isEditing) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (noteRef.current && !noteRef.current.contains(e.target as Node)) {
        saveNote();
        setIsEditing(false);
      }
    };

    // 약간의 딜레이 후 리스너 추가 (현재 탭 이벤트 무시)
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside, { passive: true });
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isEditing, saveNote]);

  // 편집 모드 진입 시 textarea 포커스
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [isEditing]);

  // 롱프레스 타이머 정리
  const clearLongPressTimer = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // 터치/마우스 시작
  const handlePressStart = useCallback((clientX: number, clientY: number) => {
    if (isEditing) return;

    isLongPress.current = false;
    hasMoved.current = false;

    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;

      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();

      dragStartPos.current = {
        x: clientX - containerRect.left - positionRef.current.x,
        y: clientY - containerRect.top - positionRef.current.y + containerRef.current.scrollTop
      };

      setIsDragging(true);
    }, 300);
  }, [isEditing, containerRef]);

  // 이동 중
  const handlePressMove = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return;

    hasMoved.current = true;
    setShowDeleteButton(false);

    const containerRect = containerRef.current.getBoundingClientRect();
    const scrollTop = containerRef.current.scrollTop;

    let newX = clientX - containerRect.left - dragStartPos.current.x;
    let newY = clientY - containerRect.top + scrollTop - dragStartPos.current.y;

    const noteWidth = noteRef.current?.offsetWidth || 200;
    newX = Math.max(0, Math.min(newX, containerRect.width - noteWidth));
    newY = Math.max(0, newY);

    setPosition({ x: newX, y: newY });
  }, [containerRef]);

  // ===== PC 전용: 마우스 이벤트 =====
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return;
    if (e.button !== 0) return; // 좌클릭만

    e.preventDefault();
    e.stopPropagation();

    // PC에서는 바로 드래그 시작 (롱프레스 없이)
    mouseDownTime.current = Date.now();
    hasMoved.current = false;

    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();

    dragStartPos.current = {
      x: e.clientX - containerRect.left - positionRef.current.x,
      y: e.clientY - containerRect.top - positionRef.current.y + containerRef.current.scrollTop
    };

    setIsDragging(true);
    setShowContextMenu(false);
  };

  // PC: 우클릭 컨텍스트 메뉴
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isEditing) return;

    // 메모 기준 상대 위치
    const rect = noteRef.current?.getBoundingClientRect();
    if (rect) {
      setContextMenuPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
    setShowContextMenu(true);
    setShowDeleteButton(false);
  };

  // 터치 시작
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isEditing) return;
    e.stopPropagation();
    const touch = e.touches[0];
    handlePressStart(touch.clientX, touch.clientY);
  };

  // 터치 종료
  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    clearLongPressTimer();

    if (isEditing) return;

    // 드래그 중이었으면
    if (isDragging) {
      setIsDragging(false);
      saveNote();

      // 롱프레스 후 이동하지 않았으면 삭제 버튼 표시
      if (!hasMoved.current) {
        setShowDeleteButton(true);
      }
      isLongPress.current = false;
      return;
    }

    // 짧은 탭이면 편집 모드
    if (!isLongPress.current && !hasMoved.current) {
      setIsEditing(true);
      setShowDeleteButton(false);
    }

    isLongPress.current = false;
  };

  // 드래그 중 전역 이벤트 리스너
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      handlePressMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.cancelable) {
        e.preventDefault();
      }
      const touch = e.touches[0];
      handlePressMove(touch.clientX, touch.clientY);
    };

    const handleMouseUp = () => {
      clearLongPressTimer();
      setIsDragging(false);

      // PC: 이동하지 않았으면 클릭으로 간주 → 편집 모드
      const clickDuration = Date.now() - mouseDownTime.current;
      if (!hasMoved.current && clickDuration < 200) {
        setIsEditing(true);
      } else {
        // 이동했으면 저장
        saveNote();
      }

      isLongPress.current = false;
    };

    // 터치는 handleTouchEnd에서 처리하므로 여기서는 마우스만
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isDragging, handlePressMove, saveNote, clearLongPressTimer]);

  // 삭제 버튼 클릭
  const handleDelete = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete(note.id);
  };

  // 삭제 버튼 외부 클릭 시 숨김 (모바일)
  useEffect(() => {
    if (!showDeleteButton) return;

    const hideDeleteButton = (e: MouseEvent | TouchEvent) => {
      if (noteRef.current && !noteRef.current.contains(e.target as Node)) {
        setShowDeleteButton(false);
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', hideDeleteButton);
      document.addEventListener('touchstart', hideDeleteButton, { passive: true });
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', hideDeleteButton);
      document.removeEventListener('touchstart', hideDeleteButton);
    };
  }, [showDeleteButton]);

  // 컨텍스트 메뉴 외부 클릭 시 숨김 (PC)
  useEffect(() => {
    if (!showContextMenu) return;

    const hideContextMenu = () => {
      setShowContextMenu(false);
    };

    // 약간의 딜레이 후 리스너 추가
    const timer = setTimeout(() => {
      document.addEventListener('click', hideContextMenu);
      document.addEventListener('contextmenu', hideContextMenu);
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', hideContextMenu);
      document.removeEventListener('contextmenu', hideContextMenu);
    };
  }, [showContextMenu]);

  return (
    <div
      ref={noteRef}
      className={cn(
        'absolute z-[5] rounded-lg shadow-lg',
        isDark ? 'bg-yellow-200' : 'bg-yellow-100',
        isDragging && 'cursor-grabbing opacity-70 scale-105',
        'transition-transform duration-100'
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        minWidth: '120px',
        maxWidth: '280px',
        touchAction: isDragging ? 'none' : 'auto'
      }}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 모바일: 삭제 버튼 (롱프레스 후 표시) */}
      {showDeleteButton && (
        <button
          onClick={handleDelete}
          onTouchEnd={handleDelete}
          className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg z-30 transition-colors"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      )}

      {/* PC: 우클릭 컨텍스트 메뉴 */}
      {showContextMenu && (
        <div
          className="absolute z-40 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 min-w-[120px]"
          style={{
            left: `${contextMenuPos.x}px`,
            top: `${contextMenuPos.y}px`
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setShowContextMenu(false);
              onDelete(note.id);
            }}
            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            삭제
          </button>
        </div>
      )}

      {/* 내용 */}
      <div className="p-3">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="메모 작성..."
            className={cn(
              'w-full min-h-[60px] px-2 py-1.5 text-sm rounded border-none resize-none',
              'bg-transparent text-gray-800 placeholder-gray-500',
              'focus:outline-none focus:ring-0'
            )}
            style={{ minWidth: '100px' }}
            rows={3}
          />
        ) : (
          <div
            className={cn(
              'text-sm text-gray-800 min-h-[40px] whitespace-pre-wrap break-words',
              !content && 'text-gray-500 italic'
            )}
          >
            {content || '탭하여 작성...'}
          </div>
        )}
      </div>
    </div>
  );
}
