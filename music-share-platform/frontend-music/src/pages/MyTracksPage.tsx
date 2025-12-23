import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { usePlayerStore } from '../store/playerStore';
import { trackAPI } from '../services/api';
import { Music, Download, Play, Pause, LogOut } from 'lucide-react';

interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  can_download: boolean;
}

export default function MyTracksPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  // 글로벌 플레이어 상태
  const { currentTrack, isPlaying, isLoading, playTrack, togglePlay } = usePlayerStore();

  useEffect(() => {
    loadTracks();
  }, []);

  const loadTracks = async () => {
    try {
      const response = await trackAPI.getMyTracks();
      setTracks(response.data.tracks);
    } catch (error) {
      console.error('Failed to load tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = async (track: Track) => {
    // 현재 재생 중인 트랙이면 토글
    if (currentTrack?.id === track.id) {
      togglePlay();
      return;
    }

    // 새 트랙 재생 (전체 트랙 리스트를 플레이리스트로 전달)
    try {
      await playTrack(track, tracks);
    } catch (error) {
      console.error('재생 실패:', error);
      alert('음원을 재생할 수 없습니다.');
    }
  };

  const handleDownload = async (track: Track) => {
    try {
      // MP3로 변환된 파일 직접 다운로드
      const response = await trackAPI.downloadTrack(track.id);

      // Blob에서 다운로드 링크 생성
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Music className="h-8 w-8 text-emerald-600" />
              <h1 className="text-2xl font-bold text-gray-900">내 음원</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <LogOut className="h-4 w-4" />
                <span>로그아웃</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {tracks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Music className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              할당된 음원이 없습니다
            </h3>
            <p className="text-gray-500">
              관리자가 음원을 할당하면 여기에 표시됩니다.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tracks.map((track) => (
              <div
                key={track.id}
                className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all p-6 ${
                  currentTrack?.id === track.id
                    ? 'ring-2 ring-emerald-500 shadow-emerald-100'
                    : ''
                }`}
              >
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {track.title}
                    </h3>
                    {currentTrack?.id === track.id && (
                      <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {isPlaying ? (
                          <>
                            <span className="flex gap-0.5">
                              <span className="w-1 h-3 bg-emerald-500 rounded-full animate-pulse" />
                              <span className="w-1 h-3 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                              <span className="w-1 h-3 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                            </span>
                            재생 중
                          </>
                        ) : '일시정지'}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600">{track.artist}</p>
                  {track.album && (
                    <p className="text-sm text-gray-500 mt-1">{track.album}</p>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePlay(track)}
                    disabled={isLoading && currentTrack?.id === track.id}
                    className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 text-white rounded-lg transition ${
                      currentTrack?.id === track.id && isPlaying
                        ? 'bg-orange-600 hover:bg-orange-700'
                        : 'bg-green-600 hover:bg-green-700'
                    } disabled:opacity-50`}
                  >
                    {currentTrack?.id === track.id && isPlaying ? (
                      <>
                        <Pause className="h-4 w-4" />
                        <span>일시정지</span>
                      </>
                    ) : currentTrack?.id === track.id && isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        <span>로딩 중...</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        <span>재생</span>
                      </>
                    )}
                  </button>

                  {track.can_download && (
                    <button
                      onClick={() => handleDownload(track)}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
