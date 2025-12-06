import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { trackAPI } from '../services/api';
import { Music, Download, Play, LogOut } from 'lucide-react';

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
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);

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
    try {
      const response = await trackAPI.getStreamUrl(track.id);
      const { streamUrl } = response.data;

      // 간단한 오디오 재생 (실제로는 더 복잡한 플레이어 구현 필요)
      const audio = new Audio(streamUrl);
      audio.play();
      setPlayingTrack(track.id);

      audio.onended = () => setPlayingTrack(null);
    } catch (error) {
      alert('재생할 수 없습니다.');
    }
  };

  const handleDownload = async (track: Track) => {
    try {
      const response = await trackAPI.getDownloadUrl(track.id);
      const { downloadUrl } = response.data;
      window.location.href = downloadUrl;
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
              <Music className="h-8 w-8 text-blue-600" />
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
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {track.title}
                  </h3>
                  <p className="text-gray-600">{track.artist}</p>
                  {track.album && (
                    <p className="text-sm text-gray-500 mt-1">{track.album}</p>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePlay(track)}
                    disabled={playingTrack === track.id}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-lg transition"
                  >
                    <Play className="h-4 w-4" />
                    <span>{playingTrack === track.id ? '재생 중...' : '재생'}</span>
                  </button>

                  {track.can_download && (
                    <button
                      onClick={() => handleDownload(track)}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
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
