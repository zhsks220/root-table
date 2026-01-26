import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { partnerAPI, LibraryTrack, LibrarySearchParams } from '../../services/partnerApi';
import { categoryAPI } from '../../services/api';
import { Category, MoodOption, LanguageOption } from '../../types';
import {
  Music, RefreshCw, Download, Search, X,
  ChevronLeft, ChevronRight, ChevronDown, Loader2, Play, Pause
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { usePlayerStore } from '../../store/playerStore';
import { useThemeStore } from '../../store/themeStore';

export function PartnerTracksView() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [tracks, setTracks] = useState<LibraryTrack[]>([]);
  const [loading, setLoading] = useState(false);

  const { currentTrack, isPlaying, isLoading: playerLoading, togglePlay, setLibraryMode } = usePlayerStore();

  useEffect(() => {
    setLibraryMode(true);
    return () => {
      setLibraryMode(false);
    };
  }, [setLibraryMode]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [moods, setMoods] = useState<MoodOption[]>([]);
  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const [searchParams, setSearchParams] = useState<LibrarySearchParams>({
    page: 1,
    limit: 20,
    sort: 'created_at',
    order: 'desc'
  });
  const [searchInput, setSearchInput] = useState('');
  const [showMoodFilter, setShowMoodFilter] = useState(false);
  const [showLanguageFilter, setShowLanguageFilter] = useState(false);
  const [showSortFilter, setShowSortFilter] = useState(false);

  const sortOptions = [
    { value: 'created_at-desc', label: '최신순' },
    { value: 'created_at-asc', label: '오래된순' },
    { value: 'title-asc', label: '제목 A-Z' },
    { value: 'title-desc', label: '제목 Z-A' },
    { value: 'artist-asc', label: '아티스트 A-Z' },
  ];

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

  const loadTracks = useCallback(async () => {
    setLoading(true);
    try {
      // Library API를 사용하되 assigned_only=true 파라미터 추가
      const res = await partnerAPI.getLibrary({ ...searchParams, assigned_only: true });
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

  const handleFilterChange = (key: keyof LibrarySearchParams, value: string | undefined) => {
    setSearchParams(prev => ({
      ...prev,
      [key]: value || undefined,
      page: 1
    }));
    setShowMoodFilter(false);
    setShowLanguageFilter(false);
  };

  const handleCategorySelect = (categoryId: string | undefined) => {
    setSearchParams(prev => ({
      ...prev,
      category: categoryId,
      page: 1
    }));
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearchParams({
      page: 1,
      limit: 20,
      sort: 'created_at',
      order: 'desc'
    });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setSearchParams(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleDownload = async (track: LibraryTrack) => {
    try {
      const response = await partnerAPI.downloadTrack(track.id);
      const blob = new Blob([response.data], { type: 'audio/mpeg' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${track.artist} - ${track.title}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('다운로드할 수 없습니다.');
    }
  };

  const handlePlay = async (track: LibraryTrack) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
      return;
    }

    const { audio, setLoading } = usePlayerStore.getState();

    if (!audio) {
      alert('오디오 플레이어가 초기화되지 않았습니다.');
      return;
    }

    setLoading(true);

    try {
      const response = await partnerAPI.getStreamUrl(track.id);
      const { streamUrl } = response.data;

      audio.src = streamUrl;
      audio.load();
      await audio.play();

      usePlayerStore.setState({
        currentTrack: { id: track.id, title: track.title, artist: track.artist, album: track.album || undefined, duration: track.duration || undefined },
        playlist: tracks.map(t => ({ id: t.id, title: t.title, artist: t.artist, album: t.album || undefined, duration: t.duration || undefined })),
        currentIndex: tracks.findIndex(t => t.id === track.id),
        isPlaying: true,
        isLoading: false,
        currentTime: 0
      });
    } catch (error) {
      console.error('재생 실패:', error);
      setLoading(false);
      alert('음원을 재생할 수 없습니다.');
    }
  };

  const formatDuration = (sec?: number | null) => sec ? `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}` : '-';
  const formatDate = (date: string) => new Date(date).toLocaleDateString('ko-KR');

  const activeFilterCount = [
    searchParams.category,
    searchParams.mood,
    searchParams.language,
    searchParams.q
  ].filter(Boolean).length;

  const selectedCategory = categories.find(cat => cat.id === searchParams.category) ||
    categories.flatMap(c => c.children || []).find(c => c.id === searchParams.category);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto pb-24"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h1 className={cn("text-xl sm:text-2xl font-bold tracking-tight", isDark ? "text-white" : "text-gray-900")}>내 트랙</h1>
          <p className={cn("text-sm sm:text-base mt-0.5 sm:mt-1", isDark ? "text-white/50" : "text-gray-500")}>
            {pagination.total > 0 ? `총 ${pagination.total}개의 트랙` : '정산 대상으로 연결된 트랙 목록입니다.'}
          </p>
        </div>
        <button
          onClick={loadTracks}
          className={cn("p-2 transition-colors rounded-full", isDark ? "text-white/50 hover:text-white hover:bg-white/10" : "text-gray-400 hover:text-gray-900 hover:bg-gray-100")}
        >
          <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
        </button>
      </div>

      {/* 검색 바 */}
      <div className={cn(
        "rounded-xl p-3 sm:p-4 mb-3 sm:mb-4",
        isDark ? "bg-white/5 border border-white/10" : "bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100"
      )}>
        <div className="flex gap-2 sm:gap-3">
          <div className="flex-1 relative">
            <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5", isDark ? "text-white/40" : "text-gray-400")} />
            <input
              type="text"
              placeholder="검색..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className={cn(
                "w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm sm:text-base rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all",
                isDark ? "bg-white/5 border border-white/10 text-white placeholder-white/40" : "bg-white border border-gray-200 text-gray-900"
              )}
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

      {/* 카테고리 칩 필터 */}
      <div className={cn(
        "rounded-xl p-3 sm:p-4 mb-3 sm:mb-4",
        isDark ? "bg-white/5 border border-white/10" : "bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100"
      )}>
        <div className="flex items-center gap-2 mb-2 sm:mb-3">
          <span className={cn("text-xs sm:text-sm font-medium", isDark ? "text-white/70" : "text-gray-700")}>카테고리</span>
          {selectedCategory && (
            <button
              onClick={() => handleCategorySelect(undefined)}
              className={cn("text-xs", isDark ? "text-white/40 hover:text-white/60" : "text-gray-400 hover:text-gray-600")}
            >
              초기화
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <button
            onClick={() => handleCategorySelect(undefined)}
            className={cn(
              "px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all",
              !searchParams.category
                ? "bg-emerald-500 text-white shadow-md"
                : isDark ? "bg-white/10 text-white/70 hover:bg-white/20" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            전체
          </button>

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
                    : isDark ? "bg-white/10 text-white/70 hover:bg-white/20" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
                ? isDark ? "bg-pink-500/20 border-pink-500/30 text-pink-400" : "bg-pink-50 border-pink-200 text-pink-700"
                : isDark ? "bg-white/5 border-white/10 text-white/70 hover:border-white/20" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
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
            <div className={cn(
              "absolute top-full left-0 mt-1 rounded-lg shadow-lg py-1 z-20 min-w-[120px]",
              isDark ? "bg-black border border-white/10" : "bg-white border border-gray-200"
            )}>
              {moods.map(mood => (
                <button
                  key={mood.value}
                  onClick={() => handleFilterChange('mood', mood.value)}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm transition-colors",
                    searchParams.mood === mood.value
                      ? isDark ? "bg-pink-500/20 text-pink-400" : "bg-pink-50 text-pink-600"
                      : isDark ? "text-white/70 hover:bg-white/5" : "hover:bg-gray-50"
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
                ? isDark ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "bg-emerald-50 border-blue-200 text-emerald-700"
                : isDark ? "bg-white/5 border-white/10 text-white/70 hover:border-white/20" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
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
            <div className={cn(
              "absolute top-full left-0 mt-1 rounded-lg shadow-lg py-1 z-20 min-w-[120px]",
              isDark ? "bg-black border border-white/10" : "bg-white border border-gray-200"
            )}>
              {languages.map(lang => (
                <button
                  key={lang.value}
                  onClick={() => handleFilterChange('language', lang.value)}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm transition-colors",
                    searchParams.language === lang.value
                      ? isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-50 text-emerald-600"
                      : isDark ? "text-white/70 hover:bg-white/5" : "hover:bg-gray-50"
                  )}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 정렬 */}
        <div className="relative">
          <button
            onClick={() => {
              setShowSortFilter(!showSortFilter);
              setShowMoodFilter(false);
              setShowLanguageFilter(false);
            }}
            className={cn(
              "px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all inline-flex items-center gap-1.5 sm:gap-2 border",
              isDark ? "bg-white/5 border-white/10 text-white/70 hover:border-white/20" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
            )}
          >
            <span>{sortOptions.find(s => s.value === `${searchParams.sort || 'created_at'}-${searchParams.order || 'desc'}`)?.label || '최신순'}</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {showSortFilter && (
            <div className={cn(
              "absolute top-full left-0 mt-1 rounded-lg shadow-lg py-1 z-20 min-w-[120px]",
              isDark ? "bg-black border border-white/10" : "bg-white border border-gray-200"
            )}>
              {sortOptions.map(option => {
                const [sort, order] = option.value.split('-');
                const isSelected = searchParams.sort === sort && searchParams.order === order;
                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSearchParams(prev => ({ ...prev, sort: sort as any, order: order as any }));
                      setShowSortFilter(false);
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm transition-colors",
                      isSelected
                        ? isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-50 text-emerald-600"
                        : isDark ? "text-white/70 hover:bg-white/5" : "hover:bg-gray-50"
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 필터 초기화 */}
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className={cn("px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm flex items-center gap-1", isDark ? "text-white/50 hover:text-white/70" : "text-gray-500 hover:text-gray-700")}
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
            <span className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1 text-sm rounded-full",
              isDark ? "bg-white/10 text-white/70" : "bg-gray-100 text-gray-700"
            )}>
              검색: "{searchParams.q}"
              <button onClick={() => { setSearchInput(''); handleFilterChange('q', undefined); }}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* 트랙 테이블 */}
      <div className={cn(
        "rounded-xl overflow-hidden",
        isDark ? "bg-white/5 border border-white/10" : "bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100"
      )}>
        {tracks.length === 0 && !loading ? (
          <div className="p-8 sm:p-16 text-center">
            <div className={cn("w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4", isDark ? "bg-white/5" : "bg-gray-50")}>
              <Music className={cn("w-6 h-6 sm:w-8 sm:h-8", isDark ? "text-white/30" : "text-gray-300")} />
            </div>
            <h3 className={cn("text-base sm:text-lg font-medium", isDark ? "text-white" : "text-gray-900")}>
              {activeFilterCount > 0 ? '검색 결과가 없습니다' : '연결된 트랙이 없습니다'}
            </h3>
            <p className={cn("text-sm mt-1", isDark ? "text-white/50" : "text-gray-500")}>
              {activeFilterCount > 0 ? '다른 검색어나 필터를 시도해보세요.' : '정산 대상으로 연결된 트랙이 없습니다.'}
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
                  "rounded-lg p-3 border transition-all",
                  currentTrack?.id === track.id
                    ? isDark ? "border-emerald-500/30 bg-emerald-500/10 ring-1 ring-emerald-500/20" : "border-emerald-300 bg-emerald-50/50 ring-1 ring-emerald-200"
                    : isDark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100"
                )}>
                  <div className="flex items-start gap-3">
                    <div className={cn("w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0", isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-600")}>
                      <Music className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn("font-medium truncate text-sm", isDark ? "text-white" : "text-gray-900")}>{track.title}</span>
                        {track.is_explicit && (
                          <span className="px-1 py-0.5 bg-gray-800 text-white text-[9px] font-bold rounded flex-shrink-0">
                            E
                          </span>
                        )}
                      </div>
                      <p className={cn("text-xs truncate", isDark ? "text-white/50" : "text-gray-500")}>{track.artist}</p>
                      {track.album && (
                        <p className={cn("text-xs truncate", isDark ? "text-white/40" : "text-gray-400")}>{track.album}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handlePlay(track)}
                        disabled={playerLoading && currentTrack?.id === track.id}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          currentTrack?.id === track.id && isPlaying
                            ? isDark ? "text-emerald-400 bg-emerald-500/20" : "text-emerald-600 bg-emerald-50"
                            : isDark ? "text-white/40 hover:text-emerald-400 hover:bg-white/5" : "text-gray-400 hover:text-emerald-500 hover:bg-white"
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
                        onClick={() => handleDownload(track)}
                        className={cn("p-2 rounded-lg transition-colors", isDark ? "text-white/40 hover:text-emerald-400 hover:bg-white/5" : "text-gray-400 hover:text-emerald-500 hover:bg-white")}
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className={cn("mt-2 pt-2 border-t flex flex-wrap items-center gap-1.5 text-xs", isDark ? "border-white/10" : "border-gray-200")}>
                    {track.categories?.slice(0, 2).map((cat, idx) => (
                      <span
                        key={cat.id}
                        className={cn(
                          "px-2 py-0.5 rounded-full",
                          idx === 0 || cat.is_primary
                            ? isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-700"
                            : isDark ? "bg-white/10 text-white/60" : "bg-gray-100 text-gray-600"
                        )}
                      >
                        {cat.name}
                      </span>
                    ))}
                    {track.mood && (
                      <span className={cn("px-2 py-0.5 rounded-full", isDark ? "bg-pink-500/20 text-pink-400" : "bg-pink-50 text-pink-600")}>
                        {moods.find(m => m.value === track.mood)?.label || track.mood}
                      </span>
                    )}
                    <span className={cn("ml-auto", isDark ? "text-white/40" : "text-gray-400")}>
                      {formatDuration(track.duration)} · {formatDate(track.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* 데스크탑: 테이블 뷰 */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className={cn("border-b", isDark ? "bg-white/5 text-white/50 border-white/10" : "bg-gray-50/50 text-gray-500 border-gray-100")}>
                  <tr>
                    <th className="px-6 py-4 font-medium">제목</th>
                    <th className="px-6 py-4 font-medium">아티스트</th>
                    <th className="px-6 py-4 font-medium">카테고리</th>
                    <th className="px-6 py-4 font-medium">분위기</th>
                    <th className="px-6 py-4 font-medium whitespace-nowrap">재생 시간</th>
                    <th className="px-6 py-4 font-medium whitespace-nowrap">날짜</th>
                    <th className="px-6 py-4 font-medium w-24"></th>
                  </tr>
                </thead>
                <tbody className={cn("divide-y", isDark ? "divide-white/10" : "divide-gray-100")}>
                  {tracks.map((track) => (
                    <tr key={track.id} className={cn(
                      "group transition-colors",
                      currentTrack?.id === track.id
                        ? isDark ? "bg-emerald-500/10 hover:bg-emerald-500/15" : "bg-emerald-50/70 hover:bg-emerald-50"
                        : isDark ? "hover:bg-white/5" : "hover:bg-gray-50/50"
                    )}>
                      <td className={cn("px-6 py-4 font-medium", isDark ? "text-white" : "text-gray-900")}>
                        <div className="flex items-center gap-3">
                          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-600")}>
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
                              <p className={cn("text-xs truncate", isDark ? "text-white/40" : "text-gray-400")}>{track.album}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className={cn("px-6 py-4", isDark ? "text-white/70" : "text-gray-600")}>{track.artist}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {track.categories?.slice(0, 2).map((cat, idx) => (
                            <span
                              key={cat.id}
                              className={cn(
                                "px-2 py-0.5 text-xs rounded-full",
                                idx === 0 || cat.is_primary
                                  ? isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-700"
                                  : isDark ? "bg-white/10 text-white/60" : "bg-gray-100 text-gray-600"
                              )}
                            >
                              {cat.name}
                            </span>
                          ))}
                          {track.categories && track.categories.length > 2 && (
                            <span className={cn("px-2 py-0.5 text-xs rounded-full", isDark ? "bg-white/10 text-white/50" : "bg-gray-100 text-gray-500")}>
                              +{track.categories.length - 2}
                            </span>
                          )}
                          {(!track.categories || track.categories.length === 0) && (
                            <span className={cn("text-xs", isDark ? "text-white/40" : "text-gray-400")}>-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {track.mood ? (
                          <span className={cn("px-2 py-0.5 text-xs rounded-full", isDark ? "bg-pink-500/20 text-pink-400" : "bg-pink-50 text-pink-600")}>
                            {moods.find(m => m.value === track.mood)?.label || track.mood}
                          </span>
                        ) : (
                          <span className={cn(isDark ? "text-white/40" : "text-gray-400")}>-</span>
                        )}
                      </td>
                      <td className={cn("px-6 py-4 whitespace-nowrap", isDark ? "text-white/70" : "text-gray-600")}>{formatDuration(track.duration)}</td>
                      <td className={cn("px-6 py-4 whitespace-nowrap", isDark ? "text-white/70" : "text-gray-600")}>{formatDate(track.created_at)}</td>
                      <td className="px-6 py-4">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-1">
                          <button
                            onClick={() => handlePlay(track)}
                            disabled={playerLoading && currentTrack?.id === track.id}
                            className={cn(
                              "p-1.5 rounded transition-colors",
                              currentTrack?.id === track.id && isPlaying
                                ? isDark ? "text-emerald-400 bg-emerald-500/20" : "text-emerald-600 bg-emerald-100"
                                : isDark ? "text-white/40 hover:text-emerald-400 hover:bg-white/5" : "text-gray-400 hover:text-emerald-500 hover:bg-emerald-50"
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
                            onClick={() => handleDownload(track)}
                            className={cn("p-1.5 rounded transition-colors", isDark ? "text-white/40 hover:text-emerald-400 hover:bg-white/5" : "text-gray-400 hover:text-emerald-500 hover:bg-emerald-50")}
                            title="다운로드"
                          >
                            <Download className="w-4 h-4" />
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
              <div className={cn("px-3 sm:px-6 py-3 sm:py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3", isDark ? "border-white/10" : "border-gray-100")}>
                <p className={cn("text-xs sm:text-sm order-2 sm:order-1", isDark ? "text-white/50" : "text-gray-500")}>
                  {pagination.total}개 중 {((pagination.page - 1) * pagination.limit) + 1}-
                  {Math.min(pagination.page * pagination.limit, pagination.total)}개 표시
                </p>
                <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className={cn("p-1.5 sm:p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors", isDark ? "border border-white/10 hover:bg-white/5 text-white/70" : "border border-gray-200 hover:bg-gray-50")}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
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
                            : isDark ? "text-white/70 hover:bg-white/10" : "text-gray-600 hover:bg-gray-100"
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className={cn("p-1.5 sm:p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors", isDark ? "border border-white/10 hover:bg-white/5 text-white/70" : "border border-gray-200 hover:bg-gray-50")}
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
      {(showMoodFilter || showLanguageFilter || showSortFilter) && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => {
            setShowMoodFilter(false);
            setShowLanguageFilter(false);
            setShowSortFilter(false);
          }}
        />
      )}
    </motion.div>
  );
}
