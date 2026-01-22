import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '../../lib/utils';
import { WebToonMemoNote } from '../../types';

// 텍스트 색상 옵션
type TextColor = 'black' | 'red';

interface DraggableMemoNoteProps {
  note: WebToonMemoNote;
  onUpdate: (note: WebToonMemoNote) => void;
  onDelete: (noteId: string) => void;
  containerRef: React.RefObject<HTMLDivElement>;
  onDragStateChange?: (isDragging: boolean, noteId: string) => void; // 드래그 상태 알림 (휴지통 표시용)
  isOverTrash?: boolean; // 휴지통 위에 있는지 여부
}

export function DraggableMemoNote({
  note,
  onUpdate,
  onDelete,
  containerRef,
  onDragStateChange,
  isOverTrash = false
}: DraggableMemoNoteProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(!note.content); // 새 메모는 바로 편집 모드
  const [content, setContent] = useState(note.content);
  const [position, setPosition] = useState({ x: note.position_x, y: note.position_y });
  const [textColor, setTextColor] = useState<TextColor>((note as any).textColor || 'black');

  const dragStartPos = useRef({ x: 0, y: 0 });
  const noteRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasMoved = useRef(false);
  const mouseDownTime = useRef(0); // 클릭 vs 드래그 구분용

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
  const textColorRef = useRef(textColor);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    noteRef2.current = note;
  }, [note]);

  useEffect(() => {
    textColorRef.current = textColor;
  }, [textColor]);

  // onDragStateChange를 ref로 유지 (클로저 문제 방지)
  const onDragStateChangeRef = useRef(onDragStateChange);
  useEffect(() => {
    onDragStateChangeRef.current = onDragStateChange;
  }, [onDragStateChange]);

  // 드래그 시작 함수
  const startDragging = useCallback(() => {
    setIsDragging(true);
    onDragStateChangeRef.current?.(true, note.id);
  }, [note.id]);

  // 드래그 종료 함수
  const stopDragging = useCallback(() => {
    setIsDragging(false);
    onDragStateChangeRef.current?.(false, note.id);
  }, [note.id]);

  // 저장 함수
  const saveNote = useCallback(() => {
    onUpdate({
      ...noteRef2.current,
      content: contentRef.current,
      position_x: positionRef.current.x,
      position_y: positionRef.current.y,
      textColor: textColorRef.current
    } as WebToonMemoNote & { textColor: TextColor });
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


  // 이동 중
  const handlePressMove = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return;

    hasMoved.current = true;

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

    startDragging();
  };

  // 우클릭 방지 (더 이상 컨텍스트 메뉴 사용 안함)
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  // 터치 시작 - native 이벤트 리스너로 등록 (passive: false로 preventDefault 가능하게)
  useEffect(() => {
    const element = noteRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (isEditing) return;

      e.preventDefault(); // 스크롤 방지 (passive: false이므로 가능)
      e.stopPropagation();

      const touch = e.touches[0];
      mouseDownTime.current = Date.now();
      hasMoved.current = false;

      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();

      dragStartPos.current = {
        x: touch.clientX - containerRect.left - positionRef.current.x,
        y: touch.clientY - containerRect.top - positionRef.current.y + containerRef.current.scrollTop
      };

      startDragging();
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
    };
  }, [isEditing, containerRef, startDragging]);

  // 터치 종료
  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();

    if (isEditing) return;

    // 드래그 중이었으면
    if (isDragging) {
      stopDragging();

      // 휴지통 위에서 놓으면 삭제
      if (isOverTrash) {
        onDelete(note.id);
        return;
      }

      // 이동하지 않았으면 클릭으로 간주 → 편집 모드
      const clickDuration = Date.now() - mouseDownTime.current;
      if (!hasMoved.current && clickDuration < 200) {
        setIsEditing(true);
      } else {
        saveNote();
      }
    }
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
      stopDragging();

      // 휴지통 위에서 놓으면 삭제
      if (isOverTrash) {
        onDelete(note.id);
        return;
      }

      // PC: 이동하지 않았으면 클릭으로 간주 → 편집 모드
      const clickDuration = Date.now() - mouseDownTime.current;
      if (!hasMoved.current && clickDuration < 200) {
        setIsEditing(true);
      } else {
        // 이동했으면 저장
        saveNote();
      }
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
  }, [isDragging, handlePressMove, saveNote, stopDragging, isOverTrash, onDelete, note.id]);

  // 텍스트 색상 토글
  const toggleTextColor = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newColor = textColor === 'black' ? 'red' : 'black';
    setTextColor(newColor);
  };

  // 텍스트 색상에 따른 클래스
  const getTextColorClass = () => {
    return textColor === 'red' ? 'text-red-600' : 'text-gray-800';
  };

  return (
    <div
      ref={noteRef}
      className={cn(
        'absolute z-[5] rounded-lg shadow-lg',
        // 반투명 기름종이 스타일
        'bg-amber-50/50 backdrop-blur-sm border border-amber-200/40',
        isDragging && 'cursor-grabbing scale-105 shadow-xl z-[50]',
        isOverTrash && isDragging && 'opacity-50 border-red-500 border-2',
        // 드래그 중에는 transition 비활성화 (성능)
        !isDragging && 'transition-transform duration-100'
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        minWidth: '120px',
        maxWidth: '280px',
        touchAction: isDragging ? 'none' : 'auto',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none'
      }}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      onTouchEnd={handleTouchEnd}
    >
      {/* 색상 선택 버튼 (편집 모드일 때만 표시) */}
      {isEditing && (
        <div className="absolute -top-8 left-0 flex gap-1">
          <button
            onClick={toggleTextColor}
            className={cn(
              'w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all',
              textColor === 'black'
                ? 'bg-gray-800 border-gray-600 text-white'
                : 'bg-red-500 border-red-400 text-white'
            )}
            title={textColor === 'black' ? '빨간색으로 변경' : '검정색으로 변경'}
          >
            A
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
              'w-full min-h-[60px] px-2 py-1.5 text-base rounded border-none resize-none',
              'bg-transparent placeholder-gray-400',
              'focus:outline-none focus:ring-0',
              getTextColorClass()
            )}
            style={{ minWidth: '100px', fontSize: '16px' }}
            rows={3}
          />
        ) : (
          <div
            className={cn(
              'text-sm min-h-[40px] whitespace-pre-wrap break-words',
              !content && 'text-gray-400 italic',
              content && getTextColorClass()
            )}
          >
            {content || '탭하여 작성...'}
          </div>
        )}
      </div>
    </div>
  );
}
