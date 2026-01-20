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
import { useScrollBasedPlayback } from '../../hooks/useScrollBasedPlayback';
import {
  ArrowLeft, Plus, Upload, Trash2, Music,
  Loader2, Image as ImageIcon, X, Smartphone, StickyNote,
  Save, Volume2, VolumeX, Play, Pause, Menu,
  Eye, EyeOff
} from 'lucide-react';

interface TrackMarker {
  id: string;
  track: Track;
  position: { x: number; y: number };
}

export function WebToonProjectsView() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const { playTrack, preloadTrack, currentTrack, stop, volume, isMuted, setVolume, toggleMute, isPlaying, togglePlay } = usePlayerStore();

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

  // 저장 상태
  const [saving, setSaving] = useState(false);

  // 모바일 메뉴 상태
  const [menuOpen, setMenuOpen] = useState(false);

  // 모바일 헤더 표시 상태 (스크롤 방향에 따라)
  const [mobileHeaderVisible, setMobileHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Long press 컨텍스트 메뉴
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 음원 추가 모달
  const [showTrackModal, setShowTrackModal] = useState(false);

  // 메모 노트 관리
  const [memoNotes, setMemoNotes] = useState<WebToonMemoNote[]>([]);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const mobileContainerRef = useRef<HTMLDivElement>(null);

  // 음원 마커 관리
  const [trackMarkers, setTrackMarkers] = useState<TrackMarker[]>([]);
  const [hideMarkers, setHideMarkers] = useState(false);

  // 사이드바 이미지 blob 캐시
  const [cachedImages, setCachedImages] = useState<Record<string, string>>({});
  const cacheLoadedRef = useRef(false);

  // Intersection Observer 기반 스크롤 재생 훅
  const { registerMarkerElement, resetPassedMarkers, addToPassedMarkers } = useScrollBasedPlayback(
    previewContainerRef,
    trackMarkers,
    currentTrack?.id,
    isPlaying,
    playTrack,
    { enabled: trackMarkers.length > 0 },
    mobileContainerRef,
    preloadTrack
  );

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
      // 프로젝트 기본 정보 로드
      const res = await webToonProjectAPI.getProject(currentProject.id);
      setCurrentProject(res.data.project);
      setScenes(res.data.project.scenes || []);
      if (res.data.project.scenes?.length > 0 && !selectedScene) {
        setSelectedScene(res.data.project.scenes[0]);
      }

      // 마커/메모 데이터 로드
      try {
        const dataRes = await webToonProjectAPI.loadProjectData(currentProject.id);
        if (dataRes.data.trackMarkers) {
          setTrackMarkers(dataRes.data.trackMarkers);
        }
        if (dataRes.data.memoNotes) {
          setMemoNotes(dataRes.data.memoNotes);
        }
      } catch (dataError) {
        // 데이터가 없을 수 있으므로 에러 무시
        console.log('No saved project data found');
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

  // 사이드바 썸네일 blob 캐싱 (프로젝트 로드 시 한번만)
  useEffect(() => {
    if (scenes.length === 0 || cacheLoadedRef.current) return;

    const cacheImages = async () => {
      const cache: Record<string, string> = {};

      // 썸네일 이미지 병렬로 fetch -> blob 변환
      await Promise.all(
        scenes.map(async (scene) => {
          // 썸네일이 있으면 썸네일 사용, 없으면 원본 사용
          const imageUrl = scene.thumbnail_url || scene.image_url;
          if (!imageUrl) return;
          try {
            const res = await fetch(imageUrl);
            const blob = await res.blob();
            cache[scene.id] = URL.createObjectURL(blob);
          } catch (e) {
            // 실패 시 URL 직접 사용
            cache[scene.id] = imageUrl;
          }
        })
      );

      setCachedImages(cache);
      cacheLoadedRef.current = true;
    };

    cacheImages();
  }, [scenes]);

  // 프로젝트 변경 시 캐시 리셋
  useEffect(() => {
    if (!currentProject) {
      // 기존 blob URL 해제
      Object.values(cachedImages).forEach(url => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
      setCachedImages({});
      cacheLoadedRef.current = false;
    }
  }, [currentProject?.id]);

  // 장면 선택
  const handleSelectScene = (scene: WebToonScene) => {
    setSelectedScene(scene);
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
      }
    } catch (error) {
      console.error('Failed to delete scene:', error);
      alert('장면 삭제에 실패했습니다.');
    }
  };


  // 음원 마커 추가를 위한 터치 위치 저장
  const [pendingTrackPosition, setPendingTrackPosition] = useState<{ x: number; y: number } | null>(null);

  // 음원 마커 추가
  const handleAddTrack = (track: Track) => {
    // 모바일: 저장된 터치 위치 사용
    if (pendingTrackPosition && mobileContainerRef.current) {
      const containerRect = mobileContainerRef.current.getBoundingClientRect();
      const scrollTop = mobileContainerRef.current.scrollTop;

      const newMarker: TrackMarker = {
        id: `track-${Date.now()}`,
        track,
        position: {
          x: 0,
          y: pendingTrackPosition.y - containerRect.top + scrollTop
        }
      };

      setTrackMarkers(prev => [...prev, newMarker]);
      setPendingTrackPosition(null);
      return;
    }

    // 데스크톱: 기존 방식
    if (!previewContainerRef.current) return;

    const container = previewContainerRef.current;
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;

    const centerPosition = scrollTop + (containerHeight / 2);

    const newMarker: TrackMarker = {
      id: `track-${Date.now()}`,
      track,
      position: {
        x: 0,
        y: centerPosition
      }
    };

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
  const handleDeleteTrackMarker = async (markerId: string) => {
    const markerToDelete = trackMarkers.find(m => m.id === markerId);
    if (!markerToDelete) return;

    // 삭제할 마커를 passedMarkers에 추가 (스크롤 이벤트로 인한 재생 방지)
    addToPassedMarkers(markerId);

    // 삭제하는 마커의 트랙이 현재 재생 중이면 정지
    if (currentTrack?.id === markerToDelete.track.id) {
      stop();
    }

    // 프로젝트 전용 음원인 경우 Storage에서도 삭제
    if (currentProject && markerToDelete.track.is_project_track) {
      try {
        await webToonProjectAPI.deleteProjectTrack(currentProject.id, markerToDelete.track.id);
      } catch (error) {
        console.error('Failed to delete project track:', error);
      }
    }

    setTrackMarkers(prev => prev.filter(marker => marker.id !== markerId));
  };

  // 메모 노트 추가 (컨텍스트 메뉴 위치 기반)
  const handleAddMemoNote = (touchPosition?: { x: number; y: number }) => {
    // 모바일: 터치 위치 기반
    if (touchPosition && mobileContainerRef.current) {
      const containerRect = mobileContainerRef.current.getBoundingClientRect();
      const scrollTop = mobileContainerRef.current.scrollTop;

      const newNote: WebToonMemoNote = {
        id: `memo-${Date.now()}`,
        scene_id: '',
        content: '',
        position_x: touchPosition.x - containerRect.left - 100,
        position_y: touchPosition.y - containerRect.top + scrollTop - 50,
        width: 200,
        height: 100
      };

      setMemoNotes(prev => [...prev, newNote]);
      return;
    }

    // 데스크톱: 기존 방식
    if (!previewContainerRef.current) return;

    const containerRect = previewContainerRef.current.getBoundingClientRect();
    const scrollTop = previewContainerRef.current.scrollTop;

    const newNote: WebToonMemoNote = {
      id: `memo-${Date.now()}`,
      scene_id: '',
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

  // 프로젝트 데이터 저장 (마커, 메모)
  const handleSaveProject = async () => {
    if (!currentProject) return;
    setSaving(true);
    try {
      await webToonProjectAPI.saveProjectData(currentProject.id, {
        trackMarkers: trackMarkers.map(m => ({
          id: m.id,
          trackId: m.track.id,
          positionY: m.position.y,
        })),
        memoNotes: memoNotes.map(n => ({
          id: n.id,
          content: n.content,
          positionX: n.position_x,
          positionY: n.position_y,
          width: n.width,
          height: n.height,
        })),
      });
      alert('저장되었습니다.');
    } catch (error) {
      console.error('Failed to save project data:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
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

  // 모바일 스크롤 시 헤더 숨김/표시
  const handleMobileScroll = useCallback(() => {
    if (!mobileContainerRef.current) return;

    const currentScrollY = mobileContainerRef.current.scrollTop;
    const delta = currentScrollY - lastScrollY.current;

    // 스크롤 양이 5px 이상일 때만 반응 (너무 민감하지 않게)
    if (Math.abs(delta) > 5) {
      if (delta > 0) {
        // 아래로 스크롤 - 헤더 숨김
        setMobileHeaderVisible(false);
      } else {
        // 위로 스크롤 - 헤더 표시
        setMobileHeaderVisible(true);
      }
      lastScrollY.current = currentScrollY;
    }

    // 최상단이면 헤더 표시
    if (currentScrollY <= 0) {
      setMobileHeaderVisible(true);
    }
  }, []);

  // 모바일 스크롤 이벤트 리스너 등록
  useEffect(() => {
    const container = mobileContainerRef.current;
    if (!container || !currentProject) return;

    container.addEventListener('scroll', handleMobileScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleMobileScroll);
  }, [currentProject, handleMobileScroll]);

  const closeContextMenu = () => setContextMenu(null);

  // 프로젝트 변경 시 마커 상태 리셋 및 음악 정지
  useEffect(() => {
    resetPassedMarkers();
    // 프로젝트를 나가면 (null이 되면) 음악 정지
    if (!currentProject) {
      stop();
    }
  }, [currentProject?.id, resetPassedMarkers, stop]);

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
            {loadingProjects || loading ? (
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

  // 프로젝트 작업 화면 (전체 화면 덮기)
  return (
    <PageTransition>
      <div className={cn('fixed inset-0 z-50 flex flex-col', isDark ? 'bg-black' : 'bg-gray-50')}>
        {/* 헤더 - 모바일 (스크롤 시 숨김) */}
        <header className={cn(
          'md:hidden flex items-center justify-between px-4 py-3 border-b transition-transform duration-300 absolute top-0 left-0 right-0 z-10',
          isDark ? 'bg-black border-gray-800' : 'bg-white border-gray-200',
          mobileHeaderVisible ? 'translate-y-0' : '-translate-y-full'
        )}>
          {/* 왼쪽: 뒤로가기 */}
          <button
            onClick={() => setCurrentProject(null)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
            )}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* 중앙: 제목 */}
          <h1 className={cn('text-lg font-bold truncate max-w-[50%]', isDark ? 'text-white' : 'text-gray-900')}>
            {currentProject.title}
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
                    onClick={() => { setHideMarkers(!hideMarkers); setMenuOpen(false); }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 transition-colors',
                      isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-700'
                    )}
                  >
                    {hideMarkers ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    <span>{hideMarkers ? '마커 표시' : '마커 숨김'}</span>
                  </button>
                  <button
                    onClick={() => { handleSaveProject(); setMenuOpen(false); }}
                    disabled={saving}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 transition-colors',
                      isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-700',
                      saving && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <Save className="w-5 h-5" />
                    <span>저장</span>
                  </button>
                  <button
                    onClick={() => { handleDeleteProject(currentProject.id, currentProject.title); setMenuOpen(false); }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 transition-colors text-red-500',
                      isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
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
              onClick={handleSaveProject}
              disabled={saving}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                saving && 'opacity-50 cursor-not-allowed',
                isDark
                  ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600'
                  : 'bg-white hover:bg-gray-100 text-gray-800 border border-gray-300'
              )}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{saving ? '저장 중...' : '저장'}</span>
            </button>
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
          {/* 왼쪽: 장면 리스트 (데스크톱만) */}
          <aside
            className={cn(
              'hidden md:block w-80 border-r overflow-y-auto',
              isDark ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-200'
            )}
            style={{
              maxHeight: 'calc(100vh - 80px)',
              contentVisibility: 'visible',
              containIntrinsicSize: 'auto',
            }}
          >
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
                      src={cachedImages[scene.id] || scene.image_url}
                      alt={`Scene ${index + 1}`}
                      className="w-full h-48 object-cover"
                      style={{ transform: 'translateZ(0)', willChange: 'transform' }}
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

          {/* 중앙: 모바일 풀스크린 / 데스크톱 핸드폰 프리뷰 */}
          <main className={cn(
            'flex-1 overflow-hidden',
            'md:flex md:flex-col md:items-center md:justify-center md:p-8 md:gap-4'
          )}>
            {/* 모바일 풀스크린 이미지 */}
            <div
              ref={mobileContainerRef}
              className={cn(
                'md:hidden w-full h-full overflow-y-auto relative pt-14',
                isDark ? 'bg-black' : 'bg-white'
              )}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchMove}
            >
              {scenes.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <ImageIcon className="w-16 h-16 mx-auto mb-3 opacity-50" />
                    <p>이미지를 업로드하세요</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-0">
                    {scenes.map((scene, index) => (
                      <div
                        key={scene.id}
                        style={{
                          contentVisibility: 'auto',
                          containIntrinsicSize: 'auto 500px',
                          contain: 'layout paint',
                          willChange: 'transform',
                        }}
                      >
                        <img
                          src={scene.image_url}
                          alt={`Scene ${index + 1}`}
                          className="w-full select-none"
                          loading="lazy"
                          decoding="async"
                          draggable={false}
                          onDragStart={(e) => e.preventDefault()}
                        />
                      </div>
                    ))}
                  </div>

                  {/* 모바일 메모 노트들 */}
                  {memoNotes.map(note => (
                    <DraggableMemoNote
                      key={note.id}
                      note={note}
                      onUpdate={handleUpdateMemoNote}
                      onDelete={handleDeleteMemoNote}
                      containerRef={mobileContainerRef}
                    />
                  ))}

                  {/* 모바일 음원 마커들 */}
                  {!hideMarkers && trackMarkers.map(marker => (
                    <DraggableTrackMarker
                      key={marker.id}
                      markerId={marker.id}
                      track={marker.track}
                      position={marker.position}
                      onUpdate={(pos) => handleUpdateTrackMarker(marker.id, pos)}
                      onDelete={() => handleDeleteTrackMarker(marker.id)}
                      containerRef={mobileContainerRef}
                      onRegister={registerMarkerElement}
                    />
                  ))}
                </>
              )}
            </div>

            {/* Long Press 컨텍스트 메뉴 */}
            {contextMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={closeContextMenu} />
                <div
                  className={cn(
                    'fixed z-50 rounded-lg shadow-lg border overflow-hidden select-none',
                    isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  )}
                  style={{ left: contextMenu.x - 75, top: contextMenu.y - 10 }}
                >
                  <button
                    onClick={() => { handleAddMemoNote(contextMenu); closeContextMenu(); }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 transition-colors select-none',
                      isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-700'
                    )}
                  >
                    <StickyNote className="w-5 h-5" />
                    <span>메모 추가</span>
                  </button>
                  <button
                    onClick={() => { setPendingTrackPosition(contextMenu); setShowTrackModal(true); closeContextMenu(); }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 transition-colors select-none',
                      isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-700'
                    )}
                  >
                    <Music className="w-5 h-5" />
                    <span>음원 추가</span>
                  </button>
                </div>
              </>
            )}

            {/* 데스크톱: 버튼들 */}
            {scenes.length > 0 && (
              <div className="hidden md:flex gap-3">
                <button
                  onClick={() => handleAddMemoNote()}
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

            {/* 데스크톱: 핸드폰 모양 프리뷰 */}
            <div
              className={cn(
                'hidden md:block relative rounded-3xl shadow-2xl overflow-hidden',
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
                          style={{
                            contentVisibility: 'auto',
                            containIntrinsicSize: 'auto 500px',
                            contain: 'layout paint',
                            willChange: 'transform',
                          }}
                        >
                          <img
                            src={scene.image_url}
                            alt={`Scene ${index + 1}`}
                            className="w-full object-contain select-none"
                            loading="lazy"
                            decoding="async"
                            draggable={false}
                            onDragStart={(e) => e.preventDefault()}
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
                    {!hideMarkers && trackMarkers.map(marker => (
                      <DraggableTrackMarker
                        key={marker.id}
                        markerId={marker.id}
                        track={marker.track}
                        position={marker.position}
                        onUpdate={(pos) => handleUpdateTrackMarker(marker.id, pos)}
                        onDelete={() => handleDeleteTrackMarker(marker.id)}
                        containerRef={previewContainerRef}
                        onRegister={registerMarkerElement}
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

          {/* 오른쪽: 재생 및 볼륨 컨트롤 (데스크톱만) */}
          <aside className={cn(
            'hidden md:flex w-20 flex-col items-center justify-center gap-4 border-l',
            isDark ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-200'
          )}>
            {/* 재생/일시정지 버튼 */}
            <button
              onClick={togglePlay}
              disabled={!currentTrack}
              className={cn(
                'p-3 rounded-full transition-colors',
                currentTrack
                  ? isDark
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : isDark
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              )}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>

            {/* 음소거 버튼 */}
            <button
              onClick={toggleMute}
              className={cn(
                'p-2 rounded-lg transition-colors',
                isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
              )}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>

            {/* 마커 숨김 버튼 */}
            <button
              onClick={() => setHideMarkers(!hideMarkers)}
              className={cn(
                'p-2 rounded-lg transition-colors',
                isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
              )}
              title={hideMarkers ? '마커 표시' : '마커 숨김'}
            >
              {hideMarkers ? (
                <Eye className="w-5 h-5" />
              ) : (
                <EyeOff className="w-5 h-5" />
              )}
            </button>

            <div className="relative h-32 flex items-center justify-center">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className={cn(
                  'w-32 h-2 rounded-lg appearance-none cursor-pointer',
                  'origin-center -rotate-90',
                  isDark ? 'bg-gray-700' : 'bg-gray-300',
                  '[&::-webkit-slider-thumb]:appearance-none',
                  '[&::-webkit-slider-thumb]:w-4',
                  '[&::-webkit-slider-thumb]:h-4',
                  '[&::-webkit-slider-thumb]:rounded-full',
                  '[&::-webkit-slider-thumb]:bg-emerald-500',
                  '[&::-webkit-slider-thumb]:cursor-pointer'
                )}
              />
            </div>

            <span className={cn(
              'text-xs font-medium',
              isDark ? 'text-gray-400' : 'text-gray-600'
            )}>
              {Math.round((isMuted ? 0 : volume) * 100)}%
            </span>
          </aside>
        </div>

        {/* 모바일 하단 재생바 */}
        <div className={cn(
          'md:hidden flex items-center gap-3 px-4 py-3 border-t',
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        )}>
          {currentTrack ? (
            <>
              {/* 트랙 정보 */}
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium truncate', isDark ? 'text-white' : 'text-gray-900')}>
                  {currentTrack.title}
                </p>
                <p className={cn('text-xs truncate', isDark ? 'text-gray-400' : 'text-gray-500')}>
                  {currentTrack.artist}
                </p>
              </div>

              {/* 재생/일시정지 버튼 */}
              <button
                onClick={togglePlay}
                className={cn(
                  'p-3 rounded-full transition-colors',
                  isDark
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                )}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </button>
            </>
          ) : (
            <p className={cn('text-sm', isDark ? 'text-gray-500' : 'text-gray-400')}>
              음원 마커를 추가하세요
            </p>
          )}
        </div>
      </div>

      {/* 음원 검색 모달 */}
      <TrackSearchModal
        isOpen={showTrackModal}
        onClose={() => setShowTrackModal(false)}
        onSelectTrack={handleAddTrack}
        excludeTrackIds={trackMarkers.map(m => m.track.id)}
        projectId={currentProject?.id}
      />
    </PageTransition>
  );
}
