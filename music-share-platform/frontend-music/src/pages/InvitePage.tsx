import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { invitationAPI } from '../services/api';

export default function InvitePage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [error, setError] = useState('');
  const [trackCount, setTrackCount] = useState(0);

  useEffect(() => {
    if (!code) return;

    invitationAPI
      .verify(code)
      .then((response) => {
        const { valid, trackCount, error } = response.data;
        if (valid) {
          setValid(true);
          setTrackCount(trackCount);
          // 3초 후 회원가입 페이지로 이동
          setTimeout(() => {
            navigate(`/register/${code}`);
          }, 3000);
        } else {
          setError(error || '유효하지 않은 초대 링크입니다.');
        }
      })
      .catch(() => {
        setError('초대 코드를 확인할 수 없습니다.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [code, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">초대 코드 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">초대 링크 오류</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg"
          >
            로그인 페이지로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">초대가 확인되었습니다!</h1>
        <p className="text-gray-600 mb-2">{trackCount}개의 음원에 접근할 수 있습니다.</p>
        <p className="text-sm text-gray-500 mb-6">잠시 후 회원가입 페이지로 이동합니다...</p>
        <div className="animate-pulse">
          <div className="h-2 bg-blue-600 rounded"></div>
        </div>
      </div>
    </div>
  );
}
