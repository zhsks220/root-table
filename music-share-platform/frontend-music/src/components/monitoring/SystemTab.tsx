import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { monitoringAPI, SystemResponse } from '../../services/monitoringApi';
import { Server, Cpu, HardDrive, Clock, Info, AlertTriangle, Activity } from 'lucide-react';

export default function SystemTab() {
  const [data, setData] = useState<SystemResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await monitoringAPI.getSystem();
        setData(response.data);
        setError(null);
      } catch (err) {
        setError('시스템 데이터를 불러오는 데 실패했습니다');
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
            <Server className="w-6 h-6 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <span className="text-gray-400 text-sm">시스템 정보 로딩 중...</span>
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

  const infoItems = [
    { label: 'Node 버전', value: data.nodeVersion, icon: Server },
    { label: '플랫폼', value: `${data.platform} (${data.arch})`, icon: Cpu },
    { label: '환경', value: data.environment === 'production' ? '운영' : '개발', icon: Info },
    { label: '프로세스 ID', value: data.pid, icon: Activity },
  ];

  const memoryItems = [
    { label: '사용 힙', value: data.memory.heapUsed },
    { label: '전체 힙', value: data.memory.heapTotal },
    { label: 'RSS', value: data.memory.rss },
    { label: '외부', value: data.memory.external },
  ];

  return (
    <div className="space-y-6">
      {/* 가동시간 카드 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900/50 to-gray-900/80 border border-emerald-500/30 p-5">
        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-emerald-500/20">
            <Clock className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <p className="text-emerald-400/80 text-sm mb-1">서버 가동시간</p>
            <p className="text-3xl font-bold text-white">{data.uptime.formatted}</p>
          </div>
        </div>
      </div>

      {/* 메모리 사용량 */}
      <div className="rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20">
              <HardDrive className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">메모리 사용량</h3>
              <p className="text-gray-500 text-xs">힙 메모리 현황</p>
            </div>
          </div>
          <div className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium',
            // Railway Hobby 플랜 기준 (8GB 제한): 4GB 이상 위험, 1GB 이상 주의
            data.memory.heapUsedBytes > 4 * 1024 * 1024 * 1024
              ? 'bg-red-500/20 text-red-400'
              : data.memory.heapUsedBytes > 1 * 1024 * 1024 * 1024
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-emerald-500/20 text-emerald-400'
          )}>
            {data.memory.heapUsed}
          </div>
        </div>

        {/* 프로그레스 바 - Railway Hobby 8GB 기준 */}
        <div className="h-4 rounded-full bg-gray-700/50 overflow-hidden mb-5">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              // Railway Hobby 플랜 기준 (8GB 제한): 4GB 이상 위험, 1GB 이상 주의
              data.memory.heapUsedBytes > 4 * 1024 * 1024 * 1024
                ? 'bg-gradient-to-r from-red-600 to-red-400'
                : data.memory.heapUsedBytes > 1 * 1024 * 1024 * 1024
                  ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                  : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
            )}
            style={{ width: `${Math.min((data.memory.heapUsedBytes / (8 * 1024 * 1024 * 1024)) * 100, 100)}%` }}
          />
        </div>
        <p className="text-gray-500 text-xs mb-4 text-right">Railway Hobby 8GB 기준</p>

        {/* 메모리 상세 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {memoryItems.map((item) => (
            <div key={item.label} className="p-3 rounded-xl bg-gray-700/30">
              <p className="text-gray-500 text-xs mb-1">{item.label}</p>
              <p className="text-white font-medium">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 시스템 정보 */}
      <div className="rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-emerald-500/20">
            <Info className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-white font-semibold">시스템 정보</h3>
        </div>
        <div className="space-y-3">
          {infoItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-gray-700/30">
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-400 text-sm">{item.label}</span>
                </div>
                <span className="text-white font-medium">{item.value}</span>
              </div>
            );
          })}
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
