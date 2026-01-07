import { useState, useEffect, useCallback, useRef } from 'react';
import { webToonProjectAPI } from '../../services/api';
import { WebToonProject, WebToonScene, Track, WebToonMemoNote } from '../../types';
import { PageTransition } from '../PageTransition';
import { TrackSearchModal } from '../webtoon/TrackSearchModal';
import { DraggableMemoNote } from '../webtoon/DraggableMemoNote';
import { DraggableTrackMarker } from '../webtoon/DraggableTrackMarker';
import { cn } from '../../lib/utils';
import { useThemeStore } from '../../store/themeStore';
import { usePlayerStore } from '../../store/playerStore';
import {
  ArrowLeft, Plus, Upload, Trash2, Music, FileText,
  Loader2, Image as ImageIcon, Save, X, Smartphone, StickyNote
} from 'lucide-react';

interface TrackMarker {
  id: string;
  track: Track;
  position: { x: number; y: number };
}

export function WebToonProjectsView() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const { playTrack, pause, currentTrack } = usePlayerStore();

  // 프로젝트 목록
  const [projects, setProjects] = useState<WebToonProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // 현재 작업 중인 프로젝트
  const [currentProject, setCurrentProject] = useState<WebToonProject | null>(null);
  const [scenes, setScenes] = useState<WebToonScene[]>([]);
  const [selectedScene, setSelectedScene] = useState<WebToonScene | null>(null);
  const [loading, setLoading] = useState(false);

  // 프로젝트 생성 모달
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [creating, setCreating] = useState(false);

  // 장면 업로드
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // 메모 편집
  const [editingMemo, setEditingMemo] = useState('');
  const [savingMemo, setSavingMemo] = useState(false);

  // 음원 추가 모달
  const [showTrackModal, setShowTrackModal] = useState(false);

  // 메모 노트 관리
  const [memoNotes, setMemoNotes] = useState<WebToonMemoNote[]>([]);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // 음원 마커 관리
  const [trackMarkers, setTrackMarkers] = useState<TrackMarker[]>([]);
  const lastScrollTop = useRef<number>(0);
  const passedMarkers = useRef<Set<string>>(new Set());

  // 프로젝트 생성
  const handleCreateProject = async () => {
    if (!projectTitle.trim()) {
      alert('프로젝트 제목을 입력하세요.');
      return;
    }

    setCreating(true);
    try {
      const formData = new FormData();
      formData.append('title', projectTitle);
      if (projectDescription) formData.append('description', projectDescription);
      formData.append('status', 'draft');

      const res = await webToonProjectAPI.createProject(formData);
      setCurrentProject(res.data.project);
      setShowCreateModal(false);
      setProjectTitle('');
      setProjectDescription('');

      // 프로젝트 목록 새로고침
      await loadProjects();
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('프로젝트 생성에 실패했습니다.');
    } finally {
      setCreating(false);
    }
  };

  // 프로젝트 목록 로드
  const loadProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const res = await webToonProjectAPI.getProjects();
      setProjects(res.data.projects || []);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  // 컴포넌트 마운트 시 프로젝트 목록 로드
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // 프로젝트 데이터 로드
  const loadProject = useCallback(async () => {
    if (!currentProject) return;

    setLoading(true);
    try {
      const res = await webToonProjectAPI.getProject(currentProject.id);
      setCurrentProject(res.data.project);
      setScenes(res.data.project.scenes || []);
      if (res.data.project.scenes?.length > 0 && !selectedScene) {
        setSelectedScene(res.data.project.scenes[0]);
        setEditingMemo(res.data.project.scenes[0].memo || '');
      }
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      setLoading(false);
    }
  }, [currentProject, selectedScene]);

  useEffect(() => {
    if (currentProject) {
      loadProject();
    }
  }, [currentProject?.id]);

  // 장면 선택
  const handleSelectScene = (scene: WebToonScene) => {
    setSelectedScene(scene);
    setEditingMemo(scene.memo || '');
  };

  // 장면 업로드
  const handleUploadScene = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !currentProject) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('image', file);
        formData.append('display_order', String(scenes.length + i));

        await webToonProjectAPI.uploadScene(currentProject.id, formData);
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
    if (!confirm('이 장면을 삭제하시겠습니까?') || !currentProject) return;

    try {
      await webToonProjectAPI.deleteScene(currentProject.id, sceneId);
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

  // 메모 저장
  const handleSaveMemo = async () => {
    if (!selectedScene || !currentProject) return;

    setSavingMemo(true);
    try {
      await webToonProjectAPI.updateScene(currentProject.id, selectedScene.id, {
        memo: editingMemo,
      });

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

  // 음원 마커 추가
  const handleAddTrack = (track: Track) => {
    if (!previewContainerRef.current) return;

    const container = previewContainerRef.current;
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;

    // 현재 화면 중앙에 마커 배치
    const centerPosition = scrollTop + (containerHeight / 2);

    const newMarker: TrackMarker = {
      id: `track-${Date.now()}`,
      track,
      position: {
        x: 0, // 가로 전체를 차지하므로 X는 0
        y: centerPosition
      }
    };

    console.log('📍 Adding track marker at Y position:', centerPosition, '(scrollTop:', scrollTop, ')');
    setTrackMarkers(prev => [...prev, newMarker]);
  };

  // 음원 마커 위치 업데이트
  const handleUpdateTrackMarker = (markerId: string, position: { x: number; y: number }) => {
    setTrackMarkers(prev =>
      prev.map(marker => (marker.id === markerId ? { ...marker, position } : marker))
    );
    // TODO: 서버에 저장
  };

  // 음원 마커 삭제
  const handleDeleteTrackMarker = (markerId: string) => {
    setTrackMarkers(prev => prev.filter(marker => marker.id !== markerId));
    // TODO: 서버에서 삭제
  };

  // 메모 노트 추가
  const handleAddMemoNote = () => {
    if (!previewContainerRef.current) return;

    const containerRect = previewContainerRef.current.getBoundingClientRect();
    const scrollTop = previewContainerRef.current.scrollTop;

    const newNote: WebToonMemoNote = {
      id: `memo-${Date.now()}`,
      scene_id: '', // 임시, 나중에 위치 기반으로 scene 결정
      content: '',
      position_x: containerRect.width / 2 - 100,
      position_y: scrollTop + 100,
      width: 200,
      height: 100
    };

    setMemoNotes(prev => [...prev, newNote]);
  };

  // 메모 노트 업데이트
  const handleUpdateMemoNote = (updatedNote: WebToonMemoNote) => {
    setMemoNotes(prev =>
      prev.map(note => (note.id === updatedNote.id ? updatedNote : note))
    );
    // TODO: 서버에 저장
  };

  // 메모 노트 삭제
  const handleDeleteMemoNote = (noteId: string) => {
    setMemoNotes(prev => prev.filter(note => note.id !== noteId));
    // TODO: 서버에서 삭제
  };

  // 프로젝트 삭제
  const handleDeleteProject = async (projectId: string, projectTitle: string) => {
    if (!confirm(`"${projectTitle}" 프로젝트를 삭제하시겠습니까?\n\n모든 장면과 데이터가 영구적으로 삭제됩니다.`)) {
      return;
    }

    try {
      await webToonProjectAPI.deleteProject(projectId);
      alert('프로젝트가 삭제되었습니다.');

      // 프로젝트 목록 새로고침
      await loadProjects();

      // 현재 열려있는 프로젝트가 삭제된 경우
      if (currentProject?.id === projectId) {
        setCurrentProject(null);
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('프로젝트 삭제에 실패했습니다.');
    }
  };

  // 스크롤 기반 자동 재생 - 네이버 웹툰 방식
  useEffect(() => {
    if (!previewContainerRef.current || trackMarkers.length === 0) return;

    const container = previewContainerRef.current;

    // 초기 로드 시 현재 화면에 보이는 마커 체크
    const checkInitialMarkers = () => {
      const currentScrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const viewportBottom = currentScrollTop + containerHeight;

      const sortedMarkers = [...trackMarkers].sort((a, b) => a.position.y - b.position.y);

      // 현재 화면에 보이는 마커 중 가장 아래에 있는 것 찾기
      let lastVisibleMarker = null;
      for (const marker of sortedMarkers) {
        if (marker.position.y <= viewportBottom) {
          lastVisibleMarker = marker;
          passedMarkers.current.add(marker.id);
        } else {
          break;
        }
      }

      // 초기 로드 시 가장 아래 마커 재생
      if (lastVisibleMarker && currentTrack?.id !== lastVisibleMarker.track.id) {
        console.log('▶️ Initial auto-play:', lastVisibleMarker.track.title, 'at Y:', lastVisibleMarker.position.y);
        playTrack(lastVisibleMarker.track).catch(err => {
          console.error('Failed to play track:', err);
        });
      }

      lastScrollTop.current = currentScrollTop;
    };

    const handleScroll = () => {
      if (!previewContainerRef.current) return;

      const currentScrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const previousScrollTop = lastScrollTop.current;

      // 스크롤 방향 감지
      const isScrollingDown = currentScrollTop > previousScrollTop;

      // Y축 정렬된 마커 리스트
      const sortedMarkers = [...trackMarkers].sort((a, b) => a.position.y - b.position.y);

      // 각 마커를 확인하여 방금 지나쳤는지 체크
      sortedMarkers.forEach(marker => {
        const markerTop = marker.position.y;
        const viewportTop = currentScrollTop;
        const viewportBottom = currentScrollTop + containerHeight;

        // 네이버 웹툰 방식: 마커가 화면에 보이기 시작할 때 재생
        if (isScrollingDown) {
          // 아래로 스크롤: 마커가 화면 하단에 들어올 때
          const previousViewportBottom = previousScrollTop + containerHeight;

          if (previousViewportBottom < markerTop && viewportBottom >= markerTop) {
            // 이 마커가 화면에 막 들어옴
            if (!passedMarkers.current.has(marker.id)) {
              passedMarkers.current.add(marker.id);

              if (currentTrack?.id !== marker.track.id) {
                console.log('▶️ Auto-play triggered (scroll down):', marker.track.title, 'at marker Y:', markerTop, 'viewport bottom:', viewportBottom);
                playTrack(marker.track).catch(err => {
                  console.error('Failed to play track:', err);
                });
              }
            }
          }
        } else {
          // 위로 스크롤: 마커가 화면 상단에 들어올 때
          if (previousScrollTop > markerTop && viewportTop <= markerTop) {
            // 이 마커를 역방향으로 지나침
            if (passedMarkers.current.has(marker.id)) {
              passedMarkers.current.delete(marker.id);
            }

            // 위로 스크롤할 때 이전 마커 찾기
            const currentIndex = sortedMarkers.findIndex(m => m.id === marker.id);
            if (currentIndex > 0) {
              const previousMarker = sortedMarkers[currentIndex - 1];

              if (currentTrack?.id !== previousMarker.track.id) {
                console.log('▶️ Auto-play triggered (scroll up):', previousMarker.track.title, 'at marker Y:', previousMarker.position.y, 'viewport top:', viewportTop);
                playTrack(previousMarker.track).catch(err => {
                  console.error('Failed to play track:', err);
                });
                passedMarkers.current.add(previousMarker.id);
              }
            }
          }
        }
      });

      // 마지막 스크롤 위치 저장
      lastScrollTop.current = currentScrollTop;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    // 초기 마커 체크
    checkInitialMarkers();

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [trackMarkers, playTrack, currentTrack]);

  // 프로젝트가 선택되지 않은 경우 - 프로젝트 목록 화면
  if (!currentProject) {
    return (
      <PageTransition>
        <div className={cn('h-screen flex flex-col', isDark ? 'bg-black' : 'bg-gray-50')}>
          {/* 헤더 */}
          <header className={cn(
            'flex items-center justify-between px-6 py-4 border-b',
            isDark ? 'bg-black border-gray-800' : 'bg-white border-gray-200'
          )}>
            <div>
              <h1 className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>
                웹툰 프로젝트
              </h1>
              <p className={cn('text-sm mt-1', isDark ? 'text-gray-400' : 'text-gray-600')}>
                모바일 화면에서 웹툰 이미지와 음악을 함께 작업하세요
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                isDark
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white'
              )}
            >
              <Plus className="w-5 h-5" />
              <span>새 프로젝트 만들기</span>
            </button>
          </header>

          {/* 프로젝트 목록 */}
          <div className="flex-1 overflow-y-auto p-6">
            {loadingProjects ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className={cn('w-8 h-8 animate-spin', isDark ? 'text-gray-400' : 'text-gray-500')} />
              </div>
            ) : projects.length === 0 ? (
              <div className={cn(
                'text-center py-24 border-2 border-dashed rounded-2xl',
                isDark ? 'border-gray-800 text-gray-400' : 'border-gray-300 text-gray-500'
              )}>
                <Smartphone className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">프로젝트가 없습니다</p>
                <p className="text-sm">새 프로젝트를 만들어 시작하세요</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className={cn(
                      'relative group p-6 rounded-lg border-2 cursor-pointer transition-all hover:shadow-lg',
                      isDark
                        ? 'bg-gray-950 border-gray-800 hover:border-emerald-500'
                        : 'bg-white border-gray-200 hover:border-emerald-500'
                    )}
                    onClick={() => setCurrentProject(project)}
                  >
                    {/* 삭제 버튼 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project.id, project.title);
                      }}
                      className="absolute top-2 right-2 p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="flex items-start justify-between mb-3">
                      <h3 className={cn('text-lg font-bold truncate pr-8', isDark ? 'text-white' : 'text-gray-900')}>
                        {project.title}
                      </h3>
                      <span className={cn(
                        'px-2 py-1 rounded text-xs font-medium flex-shrink-0 ml-2',
                        project.status === 'published'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : project.status === 'archived'
                            ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      )}>
                        {project.status === 'published' ? '발행됨' : project.status === 'archived' ? '보관됨' : '작업중'}
                      </span>
                    </div>
                    {project.description && (
                      <p className={cn('text-sm mb-3 line-clamp-2', isDark ? 'text-gray-400' : 'text-gray-600')}>
                        {project.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs">
                      <span className={cn(isDark ? 'text-gray-500' : 'text-gray-500')}>
                        {project.scene_count || 0}개 장면
                      </span>
                      <span className={cn(isDark ? 'text-gray-500' : 'text-gray-500')}>
                        {new Date(project.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 프로젝트 생성 모달 */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className={cn(
                'w-full max-w-md rounded-lg shadow-xl',
                isDark ? 'bg-gray-950' : 'bg-white'
              )}>
                <div className={cn(
                  'flex items-center justify-between p-6 border-b',
                  isDark ? 'border-gray-800' : 'border-gray-200'
                )}>
                  <h2 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>
                    새 프로젝트
                  </h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className={cn('p-2 rounded-lg transition-colors', isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100')}
                  >
                    <X className={cn('w-5 h-5', isDark ? 'text-gray-400' : 'text-gray-500')} />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className={cn('block text-sm font-medium mb-2', isDark ? 'text-gray-300' : 'text-gray-700')}>
                      프로젝트 제목 *
                    </label>
                    <input
                      type="text"
                      value={projectTitle}
                      onChange={(e) => setProjectTitle(e.target.value)}
                      className={cn(
                        'w-full px-3 py-2 rounded-lg border',
                        isDark
                          ? 'bg-gray-900 border-gray-700 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      )}
                      placeholder="프로젝트 제목을 입력하세요"
                    />
                  </div>

                  <div>
                    <label className={cn('block text-sm font-medium mb-2', isDark ? 'text-gray-300' : 'text-gray-700')}>
                      설명
                    </label>
                    <textarea
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      rows={3}
                      className={cn(
                        'w-full px-3 py-2 rounded-lg border resize-none',
                        isDark
                          ? 'bg-gray-900 border-gray-700 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      )}
                      placeholder="프로젝트 설명을 입력하세요"
                    />
                  </div>
                </div>

                <div className={cn(
                  'flex justify-end gap-3 p-6 border-t',
                  isDark ? 'border-gray-800' : 'border-gray-200'
                )}>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    disabled={creating}
                    className={cn(
                      'px-4 py-2 rounded-lg transition-colors',
                      isDark
                        ? 'bg-gray-800 hover:bg-gray-700 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                    )}
                  >
                    취소
                  </button>
                  <button
                    onClick={handleCreateProject}
                    disabled={creating}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                      isDark
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-white',
                      creating && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>생성 중...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>만들기</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </PageTransition>
    );
  }

  // 프로젝트 작업 화면
  return (
    <PageTransition>
      <div className={cn('h-screen flex flex-col', isDark ? 'bg-black' : 'bg-gray-50')}>
        {/* 헤더 */}
        <header className={cn(
          'flex items-center justify-between px-6 py-4 border-b',
          isDark ? 'bg-black border-gray-800' : 'bg-white border-gray-200'
        )}>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentProject(null)}
              className={cn(
                'p-2 rounded-lg transition-colors',
                isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
              )}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>
                {currentProject.title}
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
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white'
            )}>
              <Upload className="w-5 h-5" />
              <span>이미지 업로드</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleUploadScene}
                disabled={uploading}
                className="hidden"
              />
            </label>
            <button
              onClick={() => handleDeleteProject(currentProject.id, currentProject.title)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>삭제</span>
            </button>
          </div>
        </header>

        {/* 업로드 진행 표시 */}
        {uploading && (
          <div className={cn('px-6 py-2', isDark ? 'bg-black' : 'bg-white')}>
            <div className="flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
              <div className="flex-1">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
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

        {/* 메인 작업 영역 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 왼쪽: 장면 리스트 */}
          <aside className={cn(
            'w-80 border-r overflow-y-auto',
            isDark ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-200'
          )}>
            <div className="p-4 space-y-2">
              {scenes.length === 0 ? (
                <div className={cn(
                  'text-center py-12 border-2 border-dashed rounded-lg',
                  isDark ? 'border-gray-800 text-gray-400' : 'border-gray-300 text-gray-500'
                )}>
                  <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">장면이 없습니다</p>
                  <p className="text-xs mt-1">이미지를 업로드하여 시작하세요</p>
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
                        ? 'border-emerald-500'
                        : isDark
                          ? 'border-gray-800 hover:border-gray-700'
                          : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className="absolute top-2 left-2 z-10">
                      <span className={cn(
                        'px-2 py-1 rounded-md text-xs font-bold',
                        selectedScene?.id === scene.id
                          ? 'bg-emerald-500 text-white'
                          : 'bg-black/50 text-white'
                      )}>
                        #{index + 1}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteScene(scene.id);
                      }}
                      className="absolute top-2 right-2 z-10 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <img
                      src={scene.image_url}
                      alt={`Scene ${index + 1}`}
                      className="w-full h-48 object-cover"
                    />

                    {scene.memo && (
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                        <p className="text-white text-xs line-clamp-2">{scene.memo}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </aside>

          {/* 중앙: 핸드폰 모양 프리뷰 */}
          <main className="flex-1 flex flex-col items-center justify-center p-8 gap-4">
            {/* 버튼들 */}
            {scenes.length > 0 && (
              <div className="flex gap-3">
                <button
                  onClick={handleAddMemoNote}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                    isDark
                      ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                      : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                  )}
                >
                  <StickyNote className="w-4 h-4" />
                  <span className="text-sm font-medium">메모 추가</span>
                </button>
                <button
                  onClick={() => setShowTrackModal(true)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                    isDark
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  )}
                >
                  <Music className="w-4 h-4" />
                  <span className="text-sm font-medium">음원 추가</span>
                </button>
              </div>
            )}

            <div
              className={cn(
                'relative rounded-3xl shadow-2xl overflow-hidden',
                isDark ? 'bg-gray-950' : 'bg-white'
              )}
              style={{ width: '390px', height: '844px' }}
            >
              {/* 핸드폰 노치 */}
              <div className={cn(
                'absolute top-0 left-1/2 -translate-x-1/2 w-40 h-6 rounded-b-2xl z-10',
                isDark ? 'bg-black' : 'bg-gray-100'
              )}>
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-gray-600 rounded-full" />
              </div>

              {/* 프리뷰 내용 - 웹툰 스크롤 방식 */}
              <div
                ref={previewContainerRef}
                className="w-full h-full overflow-y-auto pt-6 pb-4 relative"
              >
                {scenes.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                    <div className="text-center text-gray-400">
                      <Smartphone className="w-16 h-16 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">이미지를 업로드하세요</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-0 relative">
                      {scenes.map((scene, index) => (
                        <div
                          key={scene.id}
                          onClick={() => handleSelectScene(scene)}
                          className={cn(
                            'relative cursor-pointer transition-all',
                            selectedScene?.id === scene.id && 'ring-4 ring-emerald-500'
                          )}
                        >
                          <img
                            src={scene.image_url}
                            alt={`Scene ${index + 1}`}
                            className="w-full object-contain"
                          />
                          {selectedScene?.id === scene.id && (
                            <div className="absolute top-2 left-2 px-2 py-1 bg-emerald-500 text-white text-xs font-bold rounded">
                              #{index + 1}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* 드래그 가능한 메모 노트들 */}
                    {memoNotes.map(note => (
                      <DraggableMemoNote
                        key={note.id}
                        note={note}
                        onUpdate={handleUpdateMemoNote}
                        onDelete={handleDeleteMemoNote}
                        containerRef={previewContainerRef}
                      />
                    ))}

                    {/* 드래그 가능한 음원 마커들 */}
                    {trackMarkers.map(marker => (
                      <DraggableTrackMarker
                        key={marker.id}
                        track={marker.track}
                        position={marker.position}
                        onUpdate={(pos) => handleUpdateTrackMarker(marker.id, pos)}
                        onDelete={() => handleDeleteTrackMarker(marker.id)}
                        containerRef={previewContainerRef}
                      />
                    ))}
                  </>
                )}
              </div>

              {/* 핸드폰 하단 바 */}
              <div className={cn(
                'absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full',
                isDark ? 'bg-gray-600' : 'bg-gray-400'
              )} />
            </div>
          </main>
        </div>
      </div>

      {/* 음원 검색 모달 */}
      <TrackSearchModal
        isOpen={showTrackModal}
        onClose={() => setShowTrackModal(false)}
        onSelectTrack={handleAddTrack}
        excludeTrackIds={trackMarkers.map(m => m.track.id)}
      />
    </PageTransition>
  );
}
