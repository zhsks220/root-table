import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, Music, Plus, Upload, FileAudio } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useThemeStore } from '../../store/themeStore';
import { Track } from '../../types';
import { adminAPI, webToonProjectAPI } from '../../services/api';

interface TrackSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTrack: (track: Track) => void;
  excludeTrackIds?: string[];
  projectId?: string; // 프로젝트 전용 음원 업로드용
}

type TabType = 'library' | 'upload';

export function TrackSearchModal({ isOpen, onClose, onSelectTrack, excludeTrackIds = [], projectId }: TrackSearchModalProps) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<TabType>('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  // 업로드 관련 상태
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadArtist, setUploadArtist] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 초기 음원 목록 로드
  useEffect(() => {
    if (isOpen && activeTab === 'library' && tracks.length === 0) {
      loadTracks();
    }
  }, [isOpen, activeTab]);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      // 파일명에서 제목 추출 (확장자 제거)
      const fileName = file.name.replace(/\.[^/.]+$/, '');
      setUploadTitle(fileName);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle.trim() || !projectId) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('title', uploadTitle.trim());
      if (uploadArtist.trim()) {
        formData.append('artist', uploadArtist.trim());
      }

      const response = await webToonProjectAPI.uploadProjectTrack(projectId, formData);
      const newTrack = response.data.track;

      // 업로드 후 바로 선택
      onSelectTrack({
        id: newTrack.id,
        title: newTrack.title,
        artist: newTrack.artist || '',
        duration: newTrack.duration ?? undefined,
        file_key: newTrack.file_key,
        stream_url: newTrack.stream_url,
        created_at: newTrack.created_at || new Date().toISOString(),
        is_project_track: true,
      } as Track);

      // 상태 초기화
      setUploadFile(null);
      setUploadTitle('');
      setUploadArtist('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onClose();
    } catch (error) {
      console.error('Failed to upload track:', error);
      alert('음원 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith('audio/') || file.name.toLowerCase().endsWith('.mp3'))) {
      setUploadFile(file);
      const fileName = file.name.replace(/\.[^/.]+$/, '');
      setUploadTitle(fileName);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
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
            음원 추가
          </h2>
          <button
            onClick={onClose}
            className={cn('p-2 rounded-lg transition-colors', isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100')}
          >
            <X className={cn('w-5 h-5', isDark ? 'text-gray-400' : 'text-gray-500')} />
          </button>
        </div>

        {/* 탭 */}
        {projectId && (
          <div className={cn('flex border-b', isDark ? 'border-gray-700' : 'border-gray-200')}>
            <button
              onClick={() => setActiveTab('library')}
              className={cn(
                'flex-1 py-3 px-4 text-sm font-medium transition-colors',
                activeTab === 'library'
                  ? isDark
                    ? 'text-emerald-400 border-b-2 border-emerald-400'
                    : 'text-emerald-600 border-b-2 border-emerald-600'
                  : isDark
                    ? 'text-gray-400 hover:text-gray-300'
                    : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <div className="flex items-center justify-center gap-2">
                <Music className="w-4 h-4" />
                라이브러리
              </div>
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={cn(
                'flex-1 py-3 px-4 text-sm font-medium transition-colors',
                activeTab === 'upload'
                  ? isDark
                    ? 'text-emerald-400 border-b-2 border-emerald-400'
                    : 'text-emerald-600 border-b-2 border-emerald-600'
                  : isDark
                    ? 'text-gray-400 hover:text-gray-300'
                    : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <div className="flex items-center justify-center gap-2">
                <Upload className="w-4 h-4" />
                직접 업로드
              </div>
            </button>
          </div>
        )}

        {/* 라이브러리 탭 */}
        {activeTab === 'library' && (
          <>
            {/* 검색바 */}
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
          </>
        )}

        {/* 직접 업로드 탭 */}
        {activeTab === 'upload' && projectId && (
          <div className="flex-1 overflow-y-auto p-6">
            {/* 업로드 영역 */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                uploadFile
                  ? isDark
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-emerald-500 bg-emerald-50'
                  : isDark
                    ? 'border-gray-600 hover:border-gray-500'
                    : 'border-gray-300 hover:border-gray-400'
              )}
            >
              {uploadFile ? (
                <div className="space-y-2">
                  <FileAudio className={cn('w-12 h-12 mx-auto', isDark ? 'text-emerald-400' : 'text-emerald-600')} />
                  <p className={cn('font-medium', isDark ? 'text-white' : 'text-gray-900')}>
                    {uploadFile.name}
                  </p>
                  <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>
                    {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    onClick={() => {
                      setUploadFile(null);
                      setUploadTitle('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className={cn(
                      'text-sm underline',
                      isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                    )}
                  >
                    다른 파일 선택
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className={cn('w-12 h-12 mx-auto', isDark ? 'text-gray-500' : 'text-gray-400')} />
                  <div>
                    <p className={cn('font-medium', isDark ? 'text-white' : 'text-gray-900')}>
                      음원 파일을 드래그하거나
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        'text-sm underline',
                        isDark ? 'text-emerald-400' : 'text-emerald-600'
                      )}
                    >
                      파일 선택
                    </button>
                  </div>
                  <p className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>
                    MP3, WAV, FLAC, AAC (최대 50MB)
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.flac,.aac,.ogg"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* 메타데이터 입력 */}
            {uploadFile && (
              <div className="space-y-4 mt-6">
                <div>
                  <label className={cn('block text-sm font-medium mb-1', isDark ? 'text-gray-300' : 'text-gray-700')}>
                    제목 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="음원 제목"
                    className={cn(
                      'w-full px-4 py-2 rounded-lg border transition-colors',
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    )}
                  />
                </div>
                <div>
                  <label className={cn('block text-sm font-medium mb-1', isDark ? 'text-gray-300' : 'text-gray-700')}>
                    아티스트 (선택)
                  </label>
                  <input
                    type="text"
                    value={uploadArtist}
                    onChange={(e) => setUploadArtist(e.target.value)}
                    placeholder="아티스트명"
                    className={cn(
                      'w-full px-4 py-2 rounded-lg border transition-colors',
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    )}
                  />
                </div>
                <button
                  onClick={handleUpload}
                  disabled={uploading || !uploadTitle.trim()}
                  className={cn(
                    'w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2',
                    isDark
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white',
                    (uploading || !uploadTitle.trim()) && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      업로드 중...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      업로드 및 추가
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
