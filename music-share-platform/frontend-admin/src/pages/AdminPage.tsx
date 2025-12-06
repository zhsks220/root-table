import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { adminAPI } from '../services/api';
import { Upload, Link as LinkIcon, Home } from 'lucide-react';

export default function AdminPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    album: '',
  });
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert('파일을 선택해주세요.');
      return;
    }

    const data = new FormData();
    data.append('file', file);
    data.append('title', formData.title);
    data.append('artist', formData.artist);
    if (formData.album) {
      data.append('album', formData.album);
    }

    setUploading(true);
    setUploadSuccess(false);

    try {
      await adminAPI.uploadTrack(data);
      setUploadSuccess(true);
      setFile(null);
      setFormData({ title: '', artist: '', album: '' });
      alert('음원이 업로드되었습니다!');
    } catch (error: any) {
      alert('업로드 실패: ' + (error.response?.data?.error || error.message));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.name}</span>
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Home className="h-4 w-4" />
                <span>내 음원</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* 음원 업로드 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Upload className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">음원 업로드</h2>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  음원 파일 (MP3, WAV, FLAC)
                </label>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
                {file && (
                  <p className="text-sm text-gray-600 mt-2">
                    선택된 파일: {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  곡 제목
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Beautiful Song"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  아티스트
                </label>
                <input
                  type="text"
                  required
                  value={formData.artist}
                  onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Artist Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  앨범 (선택)
                </label>
                <input
                  type="text"
                  value={formData.album}
                  onChange={(e) => setFormData({ ...formData, album: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Album Name"
                />
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-lg transition"
              >
                {uploading ? '업로드 중...' : '업로드'}
              </button>

              {uploadSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                  ✅ 업로드 성공!
                </div>
              )}
            </form>
          </div>

          {/* 초대 생성 (간단 버전) */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-2 mb-6">
              <LinkIcon className="h-6 w-6 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900">초대 관리</h2>
            </div>

            <div className="text-center py-12">
              <LinkIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                초대 생성 기능은 곧 추가됩니다.
              </p>
              <p className="text-sm text-gray-500">
                현재는 API를 통해 초대를 생성할 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        {/* 안내 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">💡 다음 단계</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>1. 음원을 업로드하세요</li>
            <li>2. API로 초대 링크를 생성하세요 (POST /api/admin/invitations)</li>
            <li>3. 생성된 링크를 사용자에게 전달하세요</li>
            <li>4. 사용자가 링크로 가입하면 자동으로 음원이 할당됩니다</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
