import { useState, useEffect } from 'react';
import { Search, X, Loader2, Music, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useThemeStore } from '../../store/themeStore';
import { Track } from '../../types';
import { adminAPI } from '../../services/api';

interface TrackSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTrack: (track: Track) => void;
  excludeTrackIds?: string[];
}

export function TrackSearchModal({ isOpen, onClose, onSelectTrack, excludeTrackIds = [] }: TrackSearchModalProps) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  // 초기 음원 목록 로드
  useEffect(() => {
    if (isOpen && tracks.length === 0) {
      loadTracks();
    }
  }, [isOpen]);

  const loadTracks = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getTracks();
      setTracks(response.data.tracks || []);
    } catch (error) {
      console.error('Failed to load tracks:', error);
      setTracks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadTracks();
      return;
    }

    setSearching(true);
    try {
      const response = await adminAPI.getTracks({ q: searchQuery });
      setTracks(response.data.tracks || []);
    } catch (error) {
      console.error('Failed to search tracks:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const filteredTracks = tracks.filter(track => !excludeTrackIds.includes(track.id));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={cn(
        'w-full max-w-2xl rounded-lg shadow-xl flex flex-col',
        'max-h-[80vh]',
        isDark ? 'bg-gray-800' : 'bg-white'
      )}>
        {/* 헤더 */}
        <div className={cn(
          'flex items-center justify-between p-6 border-b',
          isDark ? 'border-gray-700' : 'border-gray-200'
        )}>
          <h2 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>
            음원 선택
          </h2>
          <button
            onClick={onClose}
            className={cn('p-2 rounded-lg transition-colors', isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100')}
          >
            <X className={cn('w-5 h-5', isDark ? 'text-gray-400' : 'text-gray-500')} />
          </button>
        </div>

        {/* 검색바 및 업로드 */}
        <div className="p-6 pb-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className={cn(
                'absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5',
                isDark ? 'text-gray-400' : 'text-gray-500'
              )} />
              <input
                type="text"
                placeholder="제목, 아티스트, 앨범으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className={cn(
                  'w-full pl-10 pr-4 py-2 rounded-lg border transition-colors',
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                )}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching}
              className={cn(
                'px-4 py-2 rounded-lg transition-colors',
                isDark
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white',
                searching && 'opacity-50 cursor-not-allowed'
              )}
            >
              검색
            </button>
          </div>
        </div>

        {/* 음원 목록 */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className={cn('w-8 h-8 animate-spin', isDark ? 'text-gray-400' : 'text-gray-500')} />
            </div>
          ) : filteredTracks.length === 0 ? (
            <div className={cn(
              'text-center py-12 border-2 border-dashed rounded-lg',
              isDark ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-500'
            )}>
              <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">
                {searchQuery ? '검색 결과가 없습니다' : '사용 가능한 음원이 없습니다'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTracks.map((track) => (
                <div
                  key={track.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer',
                    isDark
                      ? 'hover:bg-gray-700 border border-gray-700'
                      : 'hover:bg-gray-50 border border-gray-200'
                  )}
                  onClick={() => {
                    onSelectTrack(track);
                    onClose();
                  }}
                >
                  <Music className={cn('w-5 h-5 flex-shrink-0', isDark ? 'text-gray-400' : 'text-gray-500')} />
                  <div className="flex-1 min-w-0">
                    <p className={cn('font-medium truncate', isDark ? 'text-white' : 'text-gray-900')}>
                      {track.title}
                    </p>
                    <p className={cn('text-sm truncate', isDark ? 'text-gray-400' : 'text-gray-600')}>
                      {track.artist}
                      {track.album && ` · ${track.album}`}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTrack(track);
                      onClose();
                    }}
                    className={cn(
                      'p-2 rounded-lg transition-colors flex-shrink-0',
                      isDark
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    )}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
