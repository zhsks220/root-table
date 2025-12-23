import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { invitationAPI } from '../services/api';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

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
      <div className="min-h-screen bg-[#fbfbfb] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className="text-gray-500 font-medium">초대 코드를 확인하고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="min-h-screen bg-[#fbfbfb] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8 max-w-sm w-full text-center border border-gray-100"
        >
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">링크가 유효하지 않습니다</h1>
          <p className="text-gray-500 text-sm mb-8">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-gray-900 hover:bg-black text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            로그인 화면으로
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfbfb] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8 max-w-sm w-full text-center border border-gray-100"
      >
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-2">초대가 확인되었습니다</h1>
        <p className="text-gray-500 text-sm mb-8">
          <span className="font-semibold text-gray-900">{trackCount}개의 음원</span>에 접근할 권한이 있습니다.<br />
          잠시 후 회원가입 페이지로 이동합니다.
        </p>

        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2 overflow-hidden">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 3, ease: "linear" }}
            className="h-full bg-emerald-500"
          />
        </div>
        <p className="text-xs text-gray-400">자동으로 이동하지 않으면 새로고침하세요</p>
      </motion.div>
    </div>
  );
}
