import { useState, useEffect, useCallback, useRef } from 'react';
import { webToonProjectAPI } from '../../services/api';
import { WebToonProject, WebToonScene } from '../../types';
import { cn } from '../../lib/utils';
import { useThemeStore } from '../../store/themeStore';
import {
  ArrowLeft, Plus, Upload, Trash2, Music, FileText,
  Loader2, Image as ImageIcon, X, Save, Menu, StickyNote
} from 'lucide-react';

interface WebToonEditorProps {
  projectId: string;
  onClose?: () => void;
}

export function WebToonEditor({ projectId, onClose }: WebToonEditorProps) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const [project, setProject] = useState<WebToonProject | null>(null);
  const [scenes, setScenes] = useState<WebToonScene[]>([]);
  const [selectedScene, setSelectedScene] = useState<WebToonScene | null>(null);
  const [loading, setLoading] = useState(true);

  // 장면 업로드 상태
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // 장면 메모 편집
  const [editingMemo, setEditingMemo] = useState('');
  const [savingMemo, setSavingMemo] = useState(false);

  // 모바일 메뉴 상태
  const [menuOpen, setMenuOpen] = useState(false);

  // Long press 컨텍스트 메뉴
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 프로젝트 데이터 로드
  const loadProject = useCallback(async () => {
    setLoading(true);
    try {
      const res = await webToonProjectAPI.getProject(projectId);
      setProject(res.data.project);
      setScenes(res.data.project.scenes || []);
      if (res.data.project.scenes?.length > 0) {
        setSelectedScene(res.data.project.scenes[0]);
        setEditingMemo(res.data.project.scenes[0].memo || '');
      }
    } catch (error) {
      console.error('Failed to load project:', error);
      alert('프로젝트를 불러올 수 없습니다.');
      if (onClose) onClose();
    } finally {
      setLoading(false);
    }
  }, [projectId, onClose]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  // 선택된 장면 변경
  const handleSelectScene = (scene: WebToonScene) => {
    setSelectedScene(scene);
    setEditingMemo(scene.memo || '');
  };

  // 장면 이미지 업로드
  const handleUploadScene = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('image', file);
        formData.append('display_order', String(scenes.length + i));

        await webToonProjectAPI.uploadScene(projectId, formData);
        setUploadProgress(((i + 1) / files.length) * 100);
      }

      await loadProject();
      alert(`${files.length}개의 장면이 업로드되었습니다.`);
    } catch (error) {
      console.error('Failed to upload scenes:', error);
      alert('장면 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // 장면 삭제
  const handleDeleteScene = async (sceneId: string) => {
    if (!confirm('이 장면을 삭제하시겠습니까?')) return;

    try {
      await webToonProjectAPI.deleteScene(projectId, sceneId);
      await loadProject();
      if (selectedScene?.id === sceneId) {
        setSelectedScene(scenes[0] || null);
        setEditingMemo(scenes[0]?.memo || '');
      }
    } catch (error) {
      console.error('Failed to delete scene:', error);
      alert('장면 삭제에 실패했습니다.');
    }
  };

  // Long press 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    longPressTimer.current = setTimeout(() => {
      setContextMenu({ x: touch.clientX, y: touch.clientY });
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchMove = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // 컨텍스트 메뉴 닫기
  const closeContextMenu = () => setContextMenu(null);

  // 메모 저장
  const handleSaveMemo = async () => {
    if (!selectedScene) return;

    setSavingMemo(true);
    try {
      await webToonProjectAPI.updateScene(projectId, selectedScene.id, {
        memo: editingMemo,
      });

      // 로컬 상태 업데이트
      setScenes(prev =>
        prev.map(s => s.id === selectedScene.id ? { ...s, memo: editingMemo } : s)
      );
      setSelectedScene({ ...selectedScene, memo: editingMemo });
    } catch (error) {
      console.error('Failed to save memo:', error);
      alert('메모 저장에 실패했습니다.');
    } finally {
      setSavingMemo(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className={cn('w-8 h-8 animate-spin', isDark ? 'text-gray-400' : 'text-gray-500')} />
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className={cn('h-screen flex flex-col', isDark ? 'bg-gray-900' : 'bg-gray-50')}>
      {/* 헤더 - 모바일 */}
      <header className={cn(
        'md:hidden flex items-center justify-between px-4 py-3 border-b',
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      )}>
        {/* 왼쪽: 뒤로가기 */}
        <button
          onClick={() => onClose?.()}
          className={cn(
            'p-2 rounded-lg transition-colors',
            isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
          )}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* 중앙: 제목 */}
        <h1 className={cn('text-lg font-bold truncate max-w-[50%]', isDark ? 'text-white' : 'text-gray-900')}>
          {project.title}
        </h1>

        {/* 오른쪽: 메뉴 버튼 */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
            )}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* 드롭다운 메뉴 */}
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className={cn(
                'absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg border z-50',
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              )}>
                <label className={cn(
                  'flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors',
                  isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-700'
                )}>
                  <Upload className="w-5 h-5" />
                  <span>이미지 업로드</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => { handleUploadScene(e); setMenuOpen(false); }}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={() => { handleSaveMemo(); setMenuOpen(false); }}
                  disabled={!selectedScene || savingMemo}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 transition-colors',
                    isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-700',
                    (!selectedScene || savingMemo) && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <Save className="w-5 h-5" />
                  <span>저장</span>
                </button>
                <button
                  onClick={() => { if (selectedScene) handleDeleteScene(selectedScene.id); setMenuOpen(false); }}
                  disabled={!selectedScene}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 transition-colors text-red-500',
                    isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100',
                    !selectedScene && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <Trash2 className="w-5 h-5" />
                  <span>삭제</span>
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* 헤더 - 데스크톱 */}
      <header className={cn(
        'hidden md:flex items-center justify-between px-6 py-4 border-b',
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      )}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => onClose?.()}
            className={cn(
              'p-2 rounded-lg transition-colors',
              isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
            )}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>
              {project.title}
            </h1>
            <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
              {scenes.length}개의 장면
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors',
            uploading && 'opacity-50 pointer-events-none',
            isDark
              ? 'bg-purple-600 hover:bg-purple-700 text-white'
              : 'bg-purple-500 hover:bg-purple-600 text-white'
          )}>
            <Upload className="w-5 h-5" />
            <span>장면 업로드</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleUploadScene}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      </header>

      {/* 업로드 진행 표시 */}
      {uploading && (
        <div className={cn('px-6 py-2', isDark ? 'bg-gray-800' : 'bg-white')}>
          <div className="flex items-center gap-3">
            <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
            <div className="flex-1">
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
            <span className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
              {Math.round(uploadProgress)}%
            </span>
          </div>
        </div>
      )}

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 왼쪽 사이드바 - 장면 리스트 (데스크톱만) */}
        <aside className={cn(
          'hidden md:block w-80 border-r overflow-y-auto',
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        )}>
          <div className="p-4 space-y-2">
            {scenes.length === 0 ? (
              <div className={cn(
                'text-center py-12 border-2 border-dashed rounded-lg',
                isDark ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-500'
              )}>
                <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">장면이 없습니다</p>
                <p className="text-xs mt-1">장면 업로드 버튼을 눌러 시작하세요</p>
              </div>
            ) : (
              scenes.map((scene, index) => (
                <div
                  key={scene.id}
                  onClick={() => handleSelectScene(scene)}
                  className={cn(
                    'relative group rounded-lg overflow-hidden cursor-pointer transition-all',
                    'border-2',
                    selectedScene?.id === scene.id
                      ? 'border-purple-500'
                      : isDark
                        ? 'border-gray-700 hover:border-gray-600'
                        : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  {/* 순서 번호 */}
                  <div className="absolute top-2 left-2 z-10">
                    <span className={cn(
                      'px-2 py-1 rounded-md text-xs font-bold',
                      selectedScene?.id === scene.id
                        ? 'bg-purple-500 text-white'
                        : 'bg-black/50 text-white'
                    )}>
                      #{index + 1}
                    </span>
                  </div>

                  {/* 삭제 버튼 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteScene(scene.id);
                    }}
                    className="absolute top-2 right-2 z-10 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* 이미지 */}
                  <img
                    src={scene.image_url}
                    alt={`Scene ${index + 1}`}
                    className="w-full h-48 object-cover"
                  />

                  {/* 메모 미리보기 */}
                  {scene.memo && (
                    <div className={cn(
                      'absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent'
                    )}>
                      <p className="text-white text-xs line-clamp-2">{scene.memo}</p>
                    </div>
                  )}

                  {/* 트랙 수 표시 */}
                  {scene.tracks && scene.tracks.length > 0 && (
                    <div className="absolute bottom-2 right-2">
                      <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-md flex items-center gap-1">
                        <Music className="w-3 h-3" />
                        {scene.tracks.length}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </aside>

        {/* 중앙 - 모바일: 풀스크린 / 데스크톱: 프리뷰 */}
        <main className={cn(
          'flex-1 overflow-hidden',
          // 모바일: 풀스크린
          'md:flex md:items-center md:justify-center md:p-8',
          isDark ? 'bg-gray-900' : 'bg-gray-100'
        )}>
          {/* 모바일 풀스크린 이미지 */}
          <div
            className={cn(
              'md:hidden w-full h-full overflow-y-auto',
              isDark ? 'bg-black' : 'bg-white'
            )}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
          >
            {selectedScene ? (
              <img
                src={selectedScene.image_url}
                alt="Preview"
                className="w-full"
              />
            ) : scenes.length > 0 ? (
              <img
                src={scenes[0].image_url}
                alt="Preview"
                className="w-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <ImageIcon className="w-16 h-16 mx-auto mb-3 opacity-50" />
                  <p>이미지를 업로드하세요</p>
                </div>
              </div>
            )}
          </div>

          {/* 데스크톱 프리뷰 (375px) */}
          <div className={cn(
            'hidden md:block relative rounded-lg shadow-2xl overflow-hidden',
            'bg-white'
          )}
            style={{ width: '375px', height: '667px' }}
          >
            {selectedScene ? (
              <div className="w-full h-full overflow-y-auto">
                <img
                  src={selectedScene.image_url}
                  alt="Preview"
                  className="w-full object-contain"
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <div className="text-center text-gray-400">
                  <ImageIcon className="w-16 h-16 mx-auto mb-3 opacity-50" />
                  <p>장면을 선택하세요</p>
                </div>
              </div>
            )}

            {/* 프리뷰 오버레이 - 사이즈 표시 */}
            <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
              375 × 667
            </div>
          </div>
        </main>

        {/* Long Press 컨텍스트 메뉴 */}
        {contextMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={closeContextMenu} />
            <div
              className={cn(
                'fixed z-50 rounded-lg shadow-lg border overflow-hidden',
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              )}
              style={{ left: contextMenu.x - 75, top: contextMenu.y - 10 }}
            >
              <button
                onClick={() => { closeContextMenu(); /* TODO: 메모 추가 모달 */ }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 transition-colors',
                  isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-700'
                )}
              >
                <StickyNote className="w-5 h-5" />
                <span>메모 추가</span>
              </button>
              <button
                onClick={() => { closeContextMenu(); /* TODO: 음원 추가 모달 */ }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 transition-colors',
                  isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-700'
                )}
              >
                <Music className="w-5 h-5" />
                <span>음원 추가</span>
              </button>
            </div>
          </>
        )}

        {/* 오른쪽 사이드바 - 상세 정보 (데스크톱만) */}
        <aside className={cn(
          'hidden md:block w-96 border-l overflow-y-auto',
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        )}>
          {selectedScene ? (
            <div className="p-6 space-y-6">
              {/* 장면 정보 */}
              <div>
                <h3 className={cn('text-lg font-semibold mb-3', isDark ? 'text-white' : 'text-gray-900')}>
                  장면 #{scenes.findIndex(s => s.id === selectedScene.id) + 1}
                </h3>
                <div className={cn('text-sm space-y-1', isDark ? 'text-gray-400' : 'text-gray-600')}>
                  <p>순서: {selectedScene.display_order}</p>
                  <p>스크롤 트리거: {selectedScene.scroll_trigger_position}%</p>
                </div>
              </div>

              {/* 메모 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={cn('text-sm font-medium', isDark ? 'text-gray-300' : 'text-gray-700')}>
                    메모
                  </label>
                  <button
                    onClick={handleSaveMemo}
                    disabled={savingMemo || editingMemo === selectedScene.memo}
                    className={cn(
                      'flex items-center gap-1 px-3 py-1 rounded-md text-xs transition-colors',
                      editingMemo === selectedScene.memo || savingMemo
                        ? 'opacity-50 cursor-not-allowed'
                        : '',
                      isDark
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    )}
                  >
                    {savingMemo ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>저장 중...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3 h-3" />
                        <span>저장</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  value={editingMemo}
                  onChange={(e) => setEditingMemo(e.target.value)}
                  rows={5}
                  placeholder="장면에 대한 메모를 입력하세요..."
                  className={cn(
                    'w-full px-3 py-2 rounded-lg border resize-none text-sm',
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  )}
                />
              </div>

              {/* 음원 관리 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className={cn('text-sm font-medium', isDark ? 'text-gray-300' : 'text-gray-700')}>
                    음원 ({selectedScene.tracks?.length || 0})
                  </label>
                  <button
                    className={cn(
                      'flex items-center gap-1 px-3 py-1 rounded-md text-xs transition-colors',
                      isDark
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    )}
                  >
                    <Plus className="w-3 h-3" />
                    <span>음원 추가</span>
                  </button>
                </div>

                {selectedScene.tracks && selectedScene.tracks.length > 0 ? (
                  <div className="space-y-2">
                    {selectedScene.tracks.map((sceneTrack) => (
                      <div
                        key={sceneTrack.id}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg',
                          isDark ? 'bg-gray-700' : 'bg-gray-100'
                        )}
                      >
                        <Music className={cn('w-4 h-4', isDark ? 'text-gray-400' : 'text-gray-500')} />
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm font-medium truncate', isDark ? 'text-white' : 'text-gray-900')}>
                            {sceneTrack.track?.title || '제목 없음'}
                          </p>
                          <p className={cn('text-xs truncate', isDark ? 'text-gray-400' : 'text-gray-600')}>
                            {sceneTrack.track?.artist || '아티스트 없음'}
                          </p>
                        </div>
                        <button
                          className={cn(
                            'p-1.5 rounded-md transition-colors',
                            isDark
                              ? 'hover:bg-gray-600 text-gray-400'
                              : 'hover:bg-gray-200 text-gray-600'
                          )}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={cn(
                    'text-center py-8 border-2 border-dashed rounded-lg',
                    isDark ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-500'
                  )}>
                    <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">음원이 없습니다</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className={cn(
              'h-full flex items-center justify-center text-center p-6',
              isDark ? 'text-gray-400' : 'text-gray-500'
            )}>
              <div>
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">장면을 선택하면</p>
                <p className="text-sm">상세 정보가 표시됩니다</p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
