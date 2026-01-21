import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { monitoringAPI, ApiStats } from '../../services/monitoringApi';
import { BarChart3, Clock, Activity, Zap, TrendingUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

type Period = '1h' | '24h' | '7d';

export default function ApiStatsTab() {
  const [data, setData] = useState<ApiStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('24h');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await monitoringAPI.getApiStats({ period });
        setData(response.data);
        setError(null);
      } catch (err) {
        setError('API 통계를 불러오는 데 실패했습니다');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-gray-700/50 border-t-emerald-500 animate-spin" />
            <BarChart3 className="w-6 h-6 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <span className="text-gray-400 text-sm">통계 로딩 중...</span>
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

  if (!data) return null;

  const totalRequests = parseInt(data.summary.total_requests) || 0;
  const successCount = parseInt(data.summary.success_count) || 0;
  const clientErrors = parseInt(data.summary.client_error_count) || 0;
  const serverErrors = parseInt(data.summary.server_error_count) || 0;
  const successRate = totalRequests > 0 ? ((successCount / totalRequests) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* 기간 선택 */}
      <div className="flex gap-2">
        {(['1h', '24h', '7d'] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all',
              period === p
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50 border border-gray-700/50'
            )}
          >
            {p === '1h' ? '1시간' : p === '24h' ? '24시간' : '7일'}
          </button>
        ))}
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* 총 요청 */}
        <div className="rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-gray-400 text-xs">총 요청</span>
          </div>
          <p className="text-3xl font-bold text-white">{totalRequests.toLocaleString()}</p>
        </div>

        {/* 평균 응답시간 */}
        <div className="rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-gray-400 text-xs">평균 응답</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {data.summary.avg_response_time || '0'}
            <span className="text-lg text-gray-500 ml-1">ms</span>
          </p>
        </div>

        {/* P95 응답시간 */}
        <div className="rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-gray-400 text-xs">P95 응답</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {data.summary.p95_response_time || '0'}
            <span className="text-lg text-gray-500 ml-1">ms</span>
          </p>
        </div>

        {/* 성공률 */}
        <div className="rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-gray-400 text-xs">성공률</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {successRate}
            <span className="text-lg text-gray-500 ml-1">%</span>
          </p>
        </div>
      </div>

      {/* 응답 상태 분포 */}
      <div className="rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 p-5">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          응답 상태 분포
        </h3>

        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-xs text-emerald-400/80 mb-1">2xx 성공</p>
            <p className="text-2xl font-bold text-emerald-400">{successCount.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <p className="text-xs text-amber-400/80 mb-1">4xx 클라이언트</p>
            <p className="text-2xl font-bold text-amber-400">{clientErrors.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
            <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-xs text-red-400/80 mb-1">5xx 서버</p>
            <p className="text-2xl font-bold text-red-400">{serverErrors.toLocaleString()}</p>
          </div>
        </div>

        {/* 상태 코드 바 */}
        {totalRequests > 0 && (
          <div className="h-4 rounded-full overflow-hidden flex bg-gray-700/30">
            {successCount > 0 && (
              <div
                className="bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
                style={{ width: `${(successCount / totalRequests) * 100}%` }}
              />
            )}
            {clientErrors > 0 && (
              <div
                className="bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500"
                style={{ width: `${(clientErrors / totalRequests) * 100}%` }}
              />
            )}
            {serverErrors > 0 && (
              <div
                className="bg-gradient-to-r from-red-600 to-red-400 transition-all duration-500"
                style={{ width: `${(serverErrors / totalRequests) * 100}%` }}
              />
            )}
          </div>
        )}
      </div>

      {/* 상위 엔드포인트 */}
      <div className="rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-emerald-400" />
          <h3 className="text-white font-semibold">상위 엔드포인트</h3>
        </div>
        <div className="space-y-2">
          {data.endpoints.slice(0, 10).map((endpoint, index) => (
            <div
              key={endpoint.endpoint}
              className="flex items-center justify-between p-3 rounded-xl bg-gray-700/30 hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className={cn(
                  'text-sm font-bold w-6 h-6 rounded-lg flex items-center justify-center',
                  index < 3 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-700 text-gray-500'
                )}>
                  {index + 1}
                </span>
                <span className="text-sm font-mono text-gray-300 truncate">
                  {endpoint.endpoint}
                </span>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <span className="text-xs text-gray-500">
                  {endpoint.avg_time}ms
                </span>
                <span className="text-sm font-medium px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400">
                  {parseInt(endpoint.count).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
          {data.endpoints.length === 0 && (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">엔드포인트 데이터가 없습니다</p>
            </div>
          )}
        </div>
      </div>

      {/* 마지막 갱신 */}
      <div className="flex items-center justify-center gap-2 py-2 text-xs text-gray-600">
        <Clock className="w-3 h-3" />
        갱신: {new Date(data.timestamp).toLocaleString('ko-KR')}
      </div>
    </div>
  );
}
