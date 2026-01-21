import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { monitoringAPI, ErrorLog } from '../../services/monitoringApi';
import { AlertTriangle, ChevronDown, ChevronUp, Clock, CheckCircle } from 'lucide-react';

export default function ErrorsTab() {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await monitoringAPI.getErrors({ limit, offset });
        setErrors(response.data.errors);
        setTotal(response.data.total);
        setError(null);
      } catch (err) {
        setError('에러 로그를 불러오는 데 실패했습니다');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [offset]);

  const getStatusColor = (code: number) => {
    if (code >= 500) return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (code >= 400) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  if (loading && errors.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-gray-700/50 border-t-red-500 animate-spin" />
            <AlertTriangle className="w-6 h-6 text-red-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <span className="text-gray-400 text-sm">에러 로그 로딩 중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-red-400 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 요약 */}
      <div className="rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-3 rounded-xl',
              total > 0 ? 'bg-red-500/20' : 'bg-emerald-500/20'
            )}>
              {total > 0 ? (
                <AlertTriangle className="w-6 h-6 text-red-400" />
              ) : (
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              )}
            </div>
            <div>
              <p className="text-gray-400 text-sm">총 에러</p>
              <p className={cn(
                'text-3xl font-bold',
                total > 0 ? 'text-red-400' : 'text-emerald-400'
              )}>
                {total}
              </p>
            </div>
          </div>
          {total === 0 && (
            <span className="text-emerald-400 text-sm">모든 시스템 정상</span>
          )}
        </div>
      </div>

      {/* 에러 목록 */}
      <div className="space-y-3">
        {errors.length === 0 ? (
          <div className="rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 p-8 text-center">
            <CheckCircle className="w-16 h-16 text-emerald-400/50 mx-auto mb-4" />
            <p className="text-gray-400">기록된 에러가 없습니다</p>
            <p className="text-gray-500 text-sm mt-1">시스템이 정상적으로 동작 중입니다</p>
          </div>
        ) : (
          errors.map((err) => (
            <div
              key={err.id}
              className="rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 overflow-hidden"
            >
              {/* 에러 헤더 */}
              <button
                onClick={() => setExpandedId(expandedId === err.id ? null : err.id)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-700/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn(
                      'px-2 py-1 rounded-lg text-xs font-bold border',
                      getStatusColor(err.status_code)
                    )}>
                      {err.status_code}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-lg bg-gray-700 text-gray-300 font-mono">
                      {err.method}
                    </span>
                    <span className="text-xs text-gray-500">{formatTime(err.created_at)}</span>
                  </div>
                  <p className="text-white font-medium truncate mb-1">
                    {err.message || '알 수 없는 에러'}
                  </p>
                  <p className="text-gray-500 text-sm truncate font-mono">
                    {err.endpoint}
                  </p>
                </div>
                {expandedId === err.id ? (
                  <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0 ml-3" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 ml-3" />
                )}
              </button>

              {/* 에러 상세 (확장) */}
              {expandedId === err.id && (
                <div className="p-4 border-t border-gray-700/50 bg-gray-900/50 space-y-4">
                  <div>
                    <p className="text-gray-500 text-xs font-medium mb-1">에러 타입</p>
                    <p className="text-white">{err.error_type || '알 수 없음'}</p>
                  </div>

                  <div>
                    <p className="text-gray-500 text-xs font-medium mb-1">메시지</p>
                    <p className="text-white">{err.message}</p>
                  </div>

                  {err.stack && (
                    <div>
                      <p className="text-gray-500 text-xs font-medium mb-1">스택 트레이스</p>
                      <pre className="text-xs p-3 rounded-xl bg-gray-800 text-gray-300 overflow-x-auto font-mono">
                        {err.stack}
                      </pre>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-xl bg-gray-800/50">
                      <p className="text-gray-500 text-xs">사용자 ID</p>
                      <p className="text-gray-300 font-mono text-sm">{err.user_id || 'N/A'}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-800/50">
                      <p className="text-gray-500 text-xs">IP 주소</p>
                      <p className="text-gray-300 font-mono text-sm">{err.ip_address || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-gray-500 pt-2">
                    <Clock className="w-3 h-3" />
                    {new Date(err.created_at).toLocaleString('ko-KR')}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 페이지네이션 */}
      {total > limit && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all',
              offset === 0
                ? 'opacity-50 cursor-not-allowed bg-gray-800/50 text-gray-500'
                : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700/50'
            )}
          >
            이전
          </button>
          <span className="text-gray-500 text-sm">
            {offset + 1} - {Math.min(offset + limit, total)} / {total}
          </span>
          <button
            onClick={() => setOffset(offset + limit)}
            disabled={offset + limit >= total}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all',
              offset + limit >= total
                ? 'opacity-50 cursor-not-allowed bg-gray-800/50 text-gray-500'
                : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700/50'
            )}
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
