import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { monitoringAPI, OverviewResponse } from '../../services/monitoringApi';
import { Server, Database, AlertTriangle, Users, Music, Clock, Activity, Zap, HardDrive } from 'lucide-react';

export default function OverviewTab() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await monitoringAPI.getOverview();
        setData(response.data);
        setError(null);
      } catch (err) {
        setError('데이터를 불러오는 데 실패했습니다');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-gray-700/50 border-t-emerald-500 animate-spin" />
            <Activity className="w-6 h-6 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <span className="text-gray-400 text-sm">데이터 로딩 중...</span>
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'emerald';
      case 'warning': return 'amber';
      case 'critical': return 'red';
      default: return 'gray';
    }
  };

  const serverColor = getStatusColor(data.server.status);
  const dbColor = getStatusColor(data.database.status);

  return (
    <div className="space-y-6">
      {/* 시스템 상태 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 서버 상태 */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 p-5">
          <div className={`absolute top-0 right-0 w-32 h-32 bg-${serverColor}-500/10 rounded-full blur-3xl`} />
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl bg-${serverColor}-500/20`}>
                <Server className={`w-6 h-6 text-${serverColor}-400`} />
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium bg-${serverColor}-500/20 text-${serverColor}-400 border border-${serverColor}-500/30`}>
                {data.server.status === 'healthy' ? '정상' : data.server.status === 'warning' ? '주의' : '위험'}
              </div>
            </div>
            <h3 className="text-gray-400 text-sm mb-1">서버 상태</h3>
            <p className="text-2xl font-bold text-white mb-2">
              {data.server.status === 'healthy' ? '온라인' : data.server.status}
            </p>
            <p className="text-gray-500 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              가동시간: {data.server.uptime}
            </p>
          </div>
        </div>

        {/* 데이터베이스 상태 */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 p-5">
          <div className={`absolute top-0 right-0 w-32 h-32 bg-${dbColor}-500/10 rounded-full blur-3xl`} />
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl bg-${dbColor}-500/20`}>
                <Database className={`w-6 h-6 text-${dbColor}-400`} />
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium bg-${dbColor}-500/20 text-${dbColor}-400 border border-${dbColor}-500/30`}>
                {data.database.status === 'healthy' ? '연결됨' : data.database.status === 'warning' ? '지연' : '오류'}
              </div>
            </div>
            <h3 className="text-gray-400 text-sm mb-1">데이터베이스</h3>
            <p className="text-2xl font-bold text-white mb-2">
              {data.database.status === 'healthy' ? '정상 연결' : data.database.status}
            </p>
            <p className="text-gray-500 text-sm flex items-center gap-2">
              <Zap className="w-4 h-4" />
              응답시간: {data.database.latency || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* 메모리 사용량 */}
      <div className="rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-emerald-500/20">
            <HardDrive className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">메모리 사용량</h3>
            <p className="text-gray-500 text-xs">Railway Hobby 8GB 기준</p>
          </div>
        </div>

        <div className="flex items-end justify-between mb-3">
          <div className="text-4xl font-bold text-white">
            {data.server.memoryUsed || `${(data.server.memoryUsedBytes / (1024 * 1024)).toFixed(1)} MB`}
          </div>
          <div className={cn(
            'px-2 py-1 rounded text-xs font-medium',
            // Railway Hobby 플랜 기준: 4GB 이상 위험, 1GB 이상 주의
            (data.server.memoryUsedBytes || 0) > 4 * 1024 * 1024 * 1024
              ? 'bg-red-500/20 text-red-400'
              : (data.server.memoryUsedBytes || 0) > 1 * 1024 * 1024 * 1024
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-emerald-500/20 text-emerald-400'
          )}>
            {(data.server.memoryUsedBytes || 0) > 4 * 1024 * 1024 * 1024 ? '위험' : (data.server.memoryUsedBytes || 0) > 1 * 1024 * 1024 * 1024 ? '주의' : '양호'}
          </div>
        </div>

        <div className="h-3 rounded-full bg-gray-700/50 overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              (data.server.memoryUsedBytes || 0) > 4 * 1024 * 1024 * 1024
                ? 'bg-gradient-to-r from-red-600 to-red-400'
                : (data.server.memoryUsedBytes || 0) > 1 * 1024 * 1024 * 1024
                  ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                  : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
            )}
            style={{ width: `${Math.min(((data.server.memoryUsedBytes || 0) / (8 * 1024 * 1024 * 1024)) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* 24시간 통계 */}
      <div>
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          24시간 통계
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {/* 에러 */}
          <div className="rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 p-4 text-center">
            <div className={cn(
              'w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center',
              data.metrics.errors24h > 10
                ? 'bg-red-500/20'
                : data.metrics.errors24h > 5
                  ? 'bg-amber-500/20'
                  : 'bg-emerald-500/20'
            )}>
              <AlertTriangle className={cn(
                'w-6 h-6',
                data.metrics.errors24h > 10
                  ? 'text-red-400'
                  : data.metrics.errors24h > 5
                    ? 'text-amber-400'
                    : 'text-emerald-400'
              )} />
            </div>
            <p className="text-3xl font-bold text-white mb-1">{data.metrics.errors24h}</p>
            <p className="text-gray-500 text-sm">에러</p>
          </div>

          {/* 사용자 */}
          <div className="rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 p-4 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-3xl font-bold text-white mb-1">{data.metrics.totalUsers}</p>
            <p className="text-gray-500 text-sm">사용자</p>
          </div>

          {/* 트랙 */}
          <div className="rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 p-4 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Music className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-3xl font-bold text-white mb-1">{data.metrics.totalTracks}</p>
            <p className="text-gray-500 text-sm">트랙</p>
          </div>
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
