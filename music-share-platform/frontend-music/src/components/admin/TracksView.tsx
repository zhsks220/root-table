import { useState, useEffect, useCallback } from 'react';
import { adminAPI, categoryAPI, TrackUpdateData } from '../../services/api';
import { Track, Category, TrackSearchParams, MoodOption, LanguageOption, Pagination } from '../../types';
import { PageTransition } from '../PageTransition';
import {
  Music, Trash2, RefreshCw, Download, Search, X, Edit3,
  ChevronLeft, ChevronRight, ChevronDown, Save, Loader2, Play, Pause
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { usePlayerStore } from '../../store/playerStore';

export function TracksView() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);

  // 글로벌 플레이어 상태
  const { currentTrack, isPlaying, isLoading: playerLoading, togglePlay } = usePlayerStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [moods, setMoods] = useState<MoodOption[]>([]);
  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // 검색 및 필터 상태
  const [searchParams, setSearchParams] = useState<TrackSearchParams>({
    page: 1,
    limit: 20,
    sort: 'created_at',
    order: 'desc'
  });
  const [searchInput, setSearchInput] = useState('');
  const [showMoodFilter, setShowMoodFilter] = useState(false);
  const [showLanguageFilter, setShowLanguageFilter] = useState(false);

  // 수정 모달 상태
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [editForm, setEditForm] = useState<TrackUpdateData>({});
  const [saving, setSaving] = useState(false);

  // 옵션 데이터 로드
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [catRes, moodRes, langRes] = await Promise.all([
          categoryAPI.getCategories(),
          categoryAPI.getMoods(),
          categoryAPI.getLanguages()
        ]);
        setCategories(catRes.data.categories);
        setMoods(moodRes.data.moods);
        setLanguages(langRes.data.languages);
      } catch (error) {
        console.error('Failed to load options:', error);
      }
    };
    loadOptions();
  }, []);

  // 트랙 로드
  const loadTracks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getTracks(searchParams);
      setTracks(res.data.tracks || []);
      setPagination(res.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (error) {
      console.error('Failed to load tracks:', error);
      setTracks([]);
      setPagination({ page: 1, limit: 20, total: 0, totalPages: 0 });
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    loadTracks();
  }, [loadTracks]);

  // 검색 실행
  const handleSearch = () => {
    setSearchParams(prev => ({
      ...prev,
      q: searchInput || undefined,
      page: 1
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 필터 변경
  const handleFilterChange = (key: keyof TrackSearchParams, value: string | undefined) => {
    setSearchParams(prev => ({
      ...prev,
      [key]: value || undefined,
      page: 1
    }));
    setShowMoodFilter(false);
    setShowLanguageFilter(false);
  };

  // 카테고리 선택 - 클릭하면 바로 선택
  const handleCategorySelect = (categoryId: string | undefined) => {
    setSearchParams(prev => ({
      ...prev,
      category: categoryId,
      page: 1
    }));
  };

  // 필터 초기화
  const clearFilters = () => {
    setSearchInput('');
    setSearchParams({
      page: 1,
      limit: 20,
      sort: 'created_at',
      order: 'desc'
    });
  };

  // 페이지 변경
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setSearchParams(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleDeleteTrack = async (trackId: string) => {
    if (!confirm('이 트랙을 삭제하시겠습니까?')) return;
    try {
      await adminAPI.deleteTrack(trackId);
      loadTracks();
    } catch (error) {
      alert('삭제에 실패했습니다');
    }
  };

  const handleDownload = async (track: Track) => {
    try {
      // 관리자는 adminAPI 사용 (user_tracks 체크 없이 모든 트랙 다운로드 가능)
      const response = await adminAPI.getDownloadUrl(track.id);
      const { downloadUrl } = response.data;
      window.location.href = downloadUrl;
    } catch (error) {
      alert('다운로드할 수 없습니다. 파일이 업로드되지 않았을 수 있습니다.');
    }
  };

  // 재생 핸들러 (관리자용 - adminAPI 사용)
  const handlePlay = async (track: Track) => {
    // 현재 재생 중인 트랙이면 토글
    if (currentTrack?.id === track.id) {
      togglePlay();
      return;
    }

    // 관리자는 adminAPI 사용 (user_tracks 체크 없이 모든 트랙 재생 가능)
    const { audio, setLoading } = usePlayerStore.getState();

    if (!audio) {
      alert('오디오 플레이어가 초기화되지 않았습니다.');
      return;
    }

    setLoading(true);

    try {
      console.log('🔊 [Admin] Fetching stream URL for track:', track.id);
      const response = await adminAPI.getStreamUrl(track.id);
      const { streamUrl } = response.data;
      console.log('✅ [Admin] Stream URL received');

      // 오디오 재생
      audio.src = streamUrl;
      audio.load();
      await audio.play();

      // 상태 업데이트
      usePlayerStore.setState({
        currentTrack: { id: track.id, title: track.title, artist: track.artist, album: track.album || undefined, duration: track.duration },
        playlist: tracks.map(t => ({ id: t.id, title: t.title, artist: t.artist, album: t.album || undefined, duration: t.duration })),
        currentIndex: tracks.findIndex(t => t.id === track.id),
        isPlaying: true,
        isLoading: false,
        currentTime: 0
      });
    } catch (error) {
      console.error('❌ [Admin] 재생 실패:', error);
      setLoading(false);
      alert('음원을 재생할 수 없습니다. 파일이 업로드되지 않았을 수 있습니다.');
    }
  };

  // 수정 모달 열기
  const openEditModal = (track: Track) => {
    setEditingTrack(track);
    setEditForm({
      title: track.title,
      artist: track.artist,
      album: track.album || '',
      mood: track.mood || null,
      language: track.language || null,
      bpm: track.bpm || null,
      release_year: track.release_year || null,
      is_explicit: track.is_explicit || false,
      description: track.description || null,
      tags: track.tags || [],
      categories: track.categories?.map(c => ({ id: c.id, is_primary: c.is_primary })) || []
    });
  };

  // 수정 저장
  const handleSaveEdit = async () => {
    if (!editingTrack) return;
    setSaving(true);
    try {
      await adminAPI.updateTrack(editingTrack.id, editForm);
      setEditingTrack(null);
      loadTracks();
    } catch (error) {
      alert('저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  // 카테고리 토글
  const toggleCategory = (categoryId: string, isPrimary = false) => {
    const current = editForm.categories || [];
    const exists = current.find(c => c.id === categoryId);

    if (exists) {
      setEditForm(prev => ({
        ...prev,
        categories: current.filter(c => c.id !== categoryId)
      }));
    } else {
      setEditForm(prev => ({
        ...prev,
        categories: [...current, { id: categoryId, is_primary: isPrimary }]
      }));
    }
  };

  const formatDuration = (sec?: number) => sec ? `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}` : '-';
  const formatDate = (date: string) => new Date(date).toLocaleDateString('ko-KR');

  // 활성 필터 개수
  const activeFilterCount = [
    searchParams.category,
    searchParams.mood,
    searchParams.language,
    searchParams.q
  ].filter(Boolean).length;

  // 선택된 카테고리 찾기
  const findSelectedCategory = () => {
    for (const cat of categories) {
      if (cat.id === searchParams.category) return cat;
      if (cat.children) {
        const sub = cat.children.find(c => c.id === searchParams.category);
        if (sub) return sub;
      }
    }
    return null;
  };

  const selectedCategory = findSelectedCategory();

  // 모든 카테고리 플랫 리스트 (수정 모달용)
  const allCategories = categories.flatMap(cat => [
    cat,
    ...(cat.children || [])
  ]);

  return (
    <PageTransition className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">음악 라이브러리</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-0.5 sm:mt-1">
            {pagination.total > 0 ? `총 ${pagination.total}개의 트랙` : '음악 트랙을 관리하세요.'}
          </p>
        </div>
        <button
          onClick={loadTracks}
          className="p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100"
        >
          <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
        </button>
      </div>

      {/* 검색 바 */}
      <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 p-3 sm:p-4 mb-3 sm:mb-4">
        <div className="flex gap-2 sm:gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="검색..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-3 sm:px-5 py-2 sm:py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium text-sm sm:text-base"
          >
            검색
          </button>
        </div>
      </div>

      {/* 카테고리 칩 필터 - 클릭하면 바로 선택 */}
      <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 p-3 sm:p-4 mb-3 sm:mb-4">
        <div className="flex items-center gap-2 mb-2 sm:mb-3">
          <span className="text-xs sm:text-sm font-medium text-gray-700">카테고리</span>
          {selectedCategory && (
            <button
              onClick={() => handleCategorySelect(undefined)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              초기화
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {/* 전체 칩 */}
          <button
            onClick={() => handleCategorySelect(undefined)}
            className={cn(
              "px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all",
              !searchParams.category
                ? "bg-emerald-500 text-white shadow-md"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            전체
          </button>

          {/* 카테고리 칩들 - 클릭하면 바로 선택 */}
          {categories.map(cat => {
            const isSelected = searchParams.category === cat.id ||
              cat.children?.some(c => c.id === searchParams.category);

            return (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className={cn(
                  "px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all inline-flex items-center gap-1",
                  isSelected
                    ? "bg-emerald-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                <span className="hidden sm:inline">{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 분위기 & 언어 필터 */}
      <div className="flex flex-wrap gap-2 sm:gap-3 mb-3 sm:mb-4">
        {/* 분위기 필터 */}
        <div className="relative">
          <button
            onClick={() => {
              setShowMoodFilter(!showMoodFilter);
              setShowLanguageFilter(false);
            }}
            className={cn(
              "px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all inline-flex items-center gap-1.5 sm:gap-2 border",
              searchParams.mood
                ? "bg-pink-50 border-pink-200 text-pink-700"
                : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
            )}
          >
            <span className="hidden sm:inline">💫</span>
            <span>{searchParams.mood ? moods.find(m => m.value === searchParams.mood)?.label : '분위기'}</span>
            {searchParams.mood ? (
              <X
                className="w-3 h-3"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFilterChange('mood', undefined);
                }}
              />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>

          {showMoodFilter && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[120px]">
              {moods.map(mood => (
                <button
                  key={mood.value}
                  onClick={() => handleFilterChange('mood', mood.value)}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors",
                    searchParams.mood === mood.value && "bg-pink-50 text-pink-600"
                  )}
                >
                  {mood.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 언어 필터 */}
        <div className="relative">
          <button
            onClick={() => {
              setShowLanguageFilter(!showLanguageFilter);
              setShowMoodFilter(false);
            }}
            className={cn(
              "px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all inline-flex items-center gap-1.5 sm:gap-2 border",
              searchParams.language
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
            )}
          >
            <span className="hidden sm:inline">🌐</span>
            <span>{searchParams.language ? languages.find(l => l.value === searchParams.language)?.label : '언어'}</span>
            {searchParams.language ? (
              <X
                className="w-3 h-3"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFilterChange('language', undefined);
                }}
              />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>

          {showLanguageFilter && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[120px]">
              {languages.map(lang => (
                <button
                  key={lang.value}
                  onClick={() => handleFilterChange('language', lang.value)}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors",
                    searchParams.language === lang.value && "bg-emerald-50 text-emerald-600"
                  )}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 정렬 */}
        <select
          value={`${searchParams.sort || 'created_at'}-${searchParams.order || 'desc'}`}
          onChange={(e) => {
            const [sort, order] = e.target.value.split('-');
            setSearchParams(prev => ({ ...prev, sort: sort as any, order: order as any }));
          }}
          className="px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        >
          <option value="created_at-desc">최신순</option>
          <option value="created_at-asc">오래된순</option>
          <option value="title-asc">제목 A-Z</option>
          <option value="title-desc">제목 Z-A</option>
          <option value="artist-asc">아티스트 A-Z</option>
        </select>

        {/* 필터 초기화 */}
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <X className="w-3 h-3 sm:w-4 sm:h-4" />
            초기화
          </button>
        )}
      </div>

      {/* 활성 필터 태그 */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {searchParams.q && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
              검색: "{searchParams.q}"
              <button onClick={() => { setSearchInput(''); handleFilterChange('q', undefined); }}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* 트랙 테이블 */}
      <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
        {tracks.length === 0 && !loading ? (
          <div className="p-8 sm:p-16 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Music className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900">
              {activeFilterCount > 0 ? '검색 결과가 없습니다' : '트랙이 없습니다'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {activeFilterCount > 0 ? '다른 검색어나 필터를 시도해보세요.' : '음악을 업로드하여 시작하세요.'}
            </p>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="mt-4 text-emerald-500 hover:text-emerald-600 font-medium text-sm"
              >
                필터 초기화
              </button>
            )}
          </div>
        ) : (
          <>
            {/* 모바일: 카드 뷰 */}
            <div className="md:hidden p-3 space-y-3">
              {tracks.map((track) => (
                <div key={track.id} className={cn(
                  "bg-gray-50 rounded-lg p-3 border transition-all",
                  currentTrack?.id === track.id
                    ? "border-emerald-300 bg-emerald-50/50 ring-1 ring-emerald-200"
                    : "border-gray-100"
                )}>
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center text-emerald-600 flex-shrink-0">
                      <Music className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 truncate text-sm">{track.title}</span>
                        {track.is_explicit && (
                          <span className="px-1 py-0.5 bg-gray-800 text-white text-[9px] font-bold rounded flex-shrink-0">
                            E
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{track.artist}</p>
                      {track.album && (
                        <p className="text-xs text-gray-400 truncate">{track.album}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handlePlay(track)}
                        disabled={playerLoading && currentTrack?.id === track.id}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          currentTrack?.id === track.id && isPlaying
                            ? "text-emerald-600 bg-emerald-50"
                            : "text-gray-400 hover:text-emerald-500 hover:bg-white"
                        )}
                      >
                        {currentTrack?.id === track.id && playerLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : currentTrack?.id === track.id && isPlaying ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => openEditModal(track)}
                        className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-white rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(track)}
                        className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-white rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTrack(track.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-gray-200 flex flex-wrap items-center gap-1.5 text-xs">
                    {track.categories?.slice(0, 2).map((cat, idx) => (
                      <span
                        key={cat.id}
                        className={cn(
                          "px-2 py-0.5 rounded-full",
                          idx === 0 || cat.is_primary
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-100 text-gray-600"
                        )}
                      >
                        {cat.name}
                      </span>
                    ))}
                    {track.mood && (
                      <span className="px-2 py-0.5 bg-pink-50 text-pink-600 rounded-full">
                        {moods.find(m => m.value === track.mood)?.label || track.mood}
                      </span>
                    )}
                    <span className="text-gray-400 ml-auto">
                      {formatDuration(track.duration)} · {formatDate(track.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* 데스크탑: 테이블 뷰 */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50/50 text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-medium">제목</th>
                    <th className="px-6 py-4 font-medium">아티스트</th>
                    <th className="px-6 py-4 font-medium">카테고리</th>
                    <th className="px-6 py-4 font-medium">분위기</th>
                    <th className="px-6 py-4 font-medium">재생 시간</th>
                    <th className="px-6 py-4 font-medium">날짜</th>
                    <th className="px-6 py-4 font-medium w-24"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tracks.map((track) => (
                    <tr key={track.id} className={cn(
                      "group transition-colors",
                      currentTrack?.id === track.id
                        ? "bg-emerald-50/70 hover:bg-emerald-50"
                        : "hover:bg-gray-50/50"
                    )}>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center text-emerald-600 flex-shrink-0">
                            <Music className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate">{track.title}</span>
                              {track.is_explicit && (
                                <span className="px-1.5 py-0.5 bg-gray-800 text-white text-[10px] font-bold rounded">
                                  E
                                </span>
                              )}
                            </div>
                            {track.album && (
                              <p className="text-xs text-gray-400 truncate">{track.album}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{track.artist}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {track.categories?.slice(0, 2).map((cat, idx) => (
                            <span
                              key={cat.id}
                              className={cn(
                                "px-2 py-0.5 text-xs rounded-full",
                                idx === 0 || cat.is_primary
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-gray-100 text-gray-600"
                              )}
                            >
                              {cat.name}
                            </span>
                          ))}
                          {track.categories && track.categories.length > 2 && (
                            <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded-full">
                              +{track.categories.length - 2}
                            </span>
                          )}
                          {(!track.categories || track.categories.length === 0) && (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {track.mood ? (
                          <span className="px-2 py-0.5 text-xs bg-pink-50 text-pink-600 rounded-full">
                            {moods.find(m => m.value === track.mood)?.label || track.mood}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{formatDuration(track.duration)}</td>
                      <td className="px-6 py-4 text-gray-600">{formatDate(track.created_at)}</td>
                      <td className="px-6 py-4">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-1">
                          <button
                            onClick={() => handlePlay(track)}
                            disabled={playerLoading && currentTrack?.id === track.id}
                            className={cn(
                              "p-1.5 rounded transition-colors",
                              currentTrack?.id === track.id && isPlaying
                                ? "text-emerald-600 bg-emerald-100"
                                : "text-gray-400 hover:text-emerald-500 hover:bg-emerald-50"
                            )}
                            title={currentTrack?.id === track.id && isPlaying ? "일시정지" : "재생"}
                          >
                            {currentTrack?.id === track.id && playerLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : currentTrack?.id === track.id && isPlaying ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => openEditModal(track)}
                            className="p-1.5 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded transition-colors"
                            title="수정"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownload(track)}
                            className="p-1.5 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded transition-colors"
                            title="다운로드"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTrack(track.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
            {pagination.totalPages > 1 && (
              <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs sm:text-sm text-gray-500 order-2 sm:order-1">
                  {pagination.total}개 중 {((pagination.page - 1) * pagination.limit) + 1}-
                  {Math.min(pagination.page * pagination.limit, pagination.total)}개 표시
                </p>
                <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="p-1.5 sm:p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {/* 모바일: 3개만, 데스크탑: 5개 */}
                  {Array.from({ length: Math.min(window.innerWidth < 640 ? 3 : 5, pagination.totalPages) }, (_, i) => {
                    const maxButtons = window.innerWidth < 640 ? 3 : 5;
                    let pageNum;
                    if (pagination.totalPages <= maxButtons) {
                      pageNum = i + 1;
                    } else if (pagination.page <= Math.ceil(maxButtons / 2)) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - Math.floor(maxButtons / 2)) {
                      pageNum = pagination.totalPages - maxButtons + 1 + i;
                    } else {
                      pageNum = pagination.page - Math.floor(maxButtons / 2) + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={cn(
                          "w-8 h-8 sm:w-10 sm:h-10 rounded-lg text-sm sm:text-base font-medium transition-colors",
                          pagination.page === pageNum
                            ? "bg-emerald-500 text-white"
                            : "text-gray-600 hover:bg-gray-100"
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="p-1.5 sm:p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 드롭다운 외부 클릭 시 닫기 */}
      {(showMoodFilter || showLanguageFilter) && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => {
            setShowMoodFilter(false);
            setShowLanguageFilter(false);
          }}
        />
      )}

      {/* 수정 모달 */}
      {editingTrack && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditingTrack(null)} />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto sm:m-4">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">트랙 정보 수정</h2>
              <button
                onClick={() => setEditingTrack(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* 기본 정보 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                  <input
                    type="text"
                    value={editForm.title || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">아티스트</label>
                  <input
                    type="text"
                    value={editForm.artist || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, artist: e.target.value }))}
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">앨범</label>
                  <input
                    type="text"
                    value={editForm.album || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, album: e.target.value }))}
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">발매 연도</label>
                  <input
                    type="number"
                    value={editForm.release_year || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, release_year: e.target.value ? parseInt(e.target.value) : null }))}
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm sm:text-base"
                    placeholder="2024"
                  />
                </div>
              </div>

              {/* 분위기 & 언어 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">분위기</label>
                  <select
                    value={editForm.mood || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, mood: e.target.value || null }))}
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm sm:text-base"
                  >
                    <option value="">선택 안함</option>
                    {moods.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">언어</label>
                  <select
                    value={editForm.language || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, language: e.target.value || null }))}
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm sm:text-base"
                  >
                    <option value="">선택 안함</option>
                    {languages.map(l => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* BPM & 성인콘텐츠 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">BPM</label>
                  <input
                    type="number"
                    value={editForm.bpm || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, bpm: e.target.value ? parseInt(e.target.value) : null }))}
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm sm:text-base"
                    placeholder="120"
                  />
                </div>
                <div className="flex items-center sm:pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.is_explicit || false}
                      onChange={(e) => setEditForm(prev => ({ ...prev, is_explicit: e.target.checked }))}
                      className="w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700">성인 콘텐츠 (Explicit)</span>
                  </label>
                </div>
              </div>

              {/* 카테고리 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                <div className="flex flex-wrap gap-1.5 sm:gap-2 p-2.5 sm:p-3 border border-gray-200 rounded-lg max-h-32 sm:max-h-40 overflow-y-auto">
                  {allCategories.map(cat => {
                    const isSelected = editForm.categories?.some(c => c.id === cat.id);
                    const isChild = !!cat.parent_id;

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        className={cn(
                          "px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all",
                          isSelected
                            ? "bg-emerald-500 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                          isChild && "ml-1 sm:ml-2"
                        )}
                      >
                        <span className="hidden sm:inline">{cat.icon && <span className="mr-1">{cat.icon}</span>}</span>
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-400 mt-1">클릭하여 카테고리를 추가/제거하세요</p>
              </div>

              {/* 설명 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <textarea
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value || null }))}
                  className="w-full px-3 py-2.5 sm:py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm sm:text-base"
                  rows={3}
                  placeholder="트랙에 대한 설명을 입력하세요..."
                />
              </div>

              {/* 태그 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">태그</label>
                <input
                  type="text"
                  value={editForm.tags?.join(', ') || ''}
                  onChange={(e) => setEditForm(prev => ({
                    ...prev,
                    tags: e.target.value ? e.target.value.split(',').map(t => t.trim()).filter(Boolean) : []
                  }))}
                  className="w-full px-3 py-2.5 sm:py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm sm:text-base"
                  placeholder="쉼표로 구분 (예: 신나는, 여름, 드라이브)"
                />
              </div>
            </div>

            {/* 저장 버튼 */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 sm:px-6 py-3 sm:py-4 flex justify-end gap-2 sm:gap-3">
              <button
                onClick={() => setEditingTrack(null)}
                className="px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="px-4 sm:px-6 py-2 sm:py-2.5 bg-emerald-500 text-white text-sm sm:text-base rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">저장 중...</span>
                    <span className="sm:hidden">저장...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    저장
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
