import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectShareAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, CheckCircle2, ArrowRight, LogIn, Users } from 'lucide-react';

export default function ProjectSharePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [valid, setValid] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const [error, setError] = useState('');
  const [joinError, setJoinError] = useState('');

  // 공유 링크 유효성 확인
  useEffect(() => {
    if (!token) return;

    projectShareAPI
      .getShareInfo(token)
      .then((response) => {
        const { valid, projectTitle, error } = response.data;
        if (valid) {
          setValid(true);
          setProjectTitle(projectTitle);
        } else {
          setError(error || '유효하지 않은 링크입니다.');
        }
      })
      .catch(() => {
        setError('링크를 확인할 수 없습니다.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  // 로그인 후 자동 참여 처리
  useEffect(() => {
    if (isAuthenticated && valid && token && !joining) {
      handleJoin();
    }
  }, [isAuthenticated, valid, token]);

  const handleJoin = async () => {
    if (!token || joining) return;

    setJoining(true);
    setJoinError('');

    try {
      const response = await projectShareAPI.joinProject(token);
      const { success, projectId, redirectUrl, error } = response.data;

      if (success) {
        // 프로젝트 페이지로 이동
        navigate(redirectUrl || `/webtoon/${projectId}`);
      } else {
        setJoinError(error || '프로젝트에 참여할 수 없습니다.');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || '프로젝트 참여 중 오류가 발생했습니다.';
      setJoinError(errorMessage);
    } finally {
      setJoining(false);
    }
  };

  const handleLogin = () => {
    // 로그인 후 돌아올 수 있도록 현재 URL 저장
    sessionStorage.setItem('redirectAfterLogin', `/project/share/${token}`);
    navigate('/partner/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className="text-white/60 font-medium">링크를 확인하고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 max-w-sm w-full text-center border border-white/10"
        >
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">링크가 유효하지 않습니다</h1>
          <p className="text-white/60 text-sm mb-8">{error}</p>
          <button
            onClick={() => navigate('/partner/login')}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            로그인 화면으로
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    );
  }

  // 참여 중
  if (joining) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className="text-white/60 font-medium">프로젝트에 참여하고 있습니다...</p>
        </div>
      </div>
    );
  }

  // 참여 에러
  if (joinError) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 max-w-sm w-full text-center border border-white/10"
        >
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">참여할 수 없습니다</h1>
          <p className="text-white/60 text-sm mb-8">{joinError}</p>
          {isAuthenticated ? (
            <button
              onClick={() => navigate('/partner')}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              대시보드로 이동
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleLogin}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              파트너 로그인
              <LogIn className="w-4 h-4" />
            </button>
          )}
        </motion.div>
      </div>
    );
  }

  // 비로그인 상태: 로그인 유도
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 max-w-sm w-full text-center border border-white/10"
        >
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-8 h-8 text-emerald-500" />
          </div>

          <h1 className="text-xl font-bold text-white mb-2">프로젝트 초대</h1>
          <p className="text-white/60 text-sm mb-2">
            <span className="font-semibold text-emerald-400">"{projectTitle}"</span>
          </p>
          <p className="text-white/60 text-sm mb-8">
            프로젝트에 초대되었습니다.<br />
            파트너 계정으로 로그인하여 참여하세요.
          </p>

          <button
            onClick={handleLogin}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            로그인하여 참여하기
            <LogIn className="w-4 h-4" />
          </button>

          <p className="mt-6 text-xs text-white/40">
            * 파트너 계정이 필요합니다
          </p>
        </motion.div>
      </div>
    );
  }

  // 로그인 상태: 참여 성공 (자동 리다이렉트 대기)
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 max-w-sm w-full text-center border border-white/10"
      >
        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>

        <h1 className="text-xl font-bold text-white mb-2">참여 완료</h1>
        <p className="text-white/60 text-sm mb-8">
          <span className="font-semibold text-emerald-400">"{projectTitle}"</span><br />
          프로젝트에 참여했습니다. 잠시 후 이동합니다.
        </p>

        <div className="w-full bg-white/10 rounded-full h-1.5 mb-2 overflow-hidden">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, ease: "linear" }}
            className="h-full bg-emerald-500"
          />
        </div>
        <p className="text-xs text-white/40">자동으로 이동하지 않으면 새로고침하세요</p>
      </motion.div>
    </div>
  );
}
