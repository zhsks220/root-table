import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { monitoringAPI, DatabaseStats } from '../../services/monitoringApi';
import { Database, Table2, Link, HardDrive, Clock, AlertTriangle } from 'lucide-react';

export default function DatabaseTab() {
  const [data, setData] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await monitoringAPI.getDatabase();
        setData(response.data);
        setError(null);
      } catch (err) {
        setError('데이터베이스 통계를 불러오는 데 실패했습니다');
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
            <Database className="w-6 h-6 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <span className="text-gray-400 text-sm">데이터베이스 정보 로딩 중...</span>
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

  return (
    <div className="space-y-6">
      {/* 연결 상태 */}
      <div className="rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-emerald-500/20">
            <Link className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-white font-semibold">연결 상태</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-gray-700/30 text-center">
            <p className="text-gray-500 text-xs mb-2">총 연결</p>
            <p className="text-2xl font-bold text-white">{data.connections.total}</p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <p className="text-emerald-400/80 text-xs mb-2">활성</p>
            <p className="text-2xl font-bold text-emerald-400">{data.connections.active}</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-700/30 text-center">
            <p className="text-gray-500 text-xs mb-2">유휴</p>
            <p className="text-2xl font-bold text-gray-400">{data.connections.idle}</p>
          </div>
        </div>
      </div>

      {/* 데이터베이스 크기 */}
      <div className="rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20">
              <HardDrive className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">데이터베이스 크기</p>
              <p className="text-2xl font-bold text-white">{data.databaseSize}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 테이블 목록 */}
      <div className="rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-emerald-500/20">
            <Table2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">테이블</h3>
            <p className="text-gray-500 text-xs">{data.tables.length}개 테이블</p>
          </div>
        </div>
        <div className="space-y-2">
          {data.tables
            .sort((a, b) => b.count - a.count)
            .map((table, index) => (
              <div
                key={table.table}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-700/30 hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={cn(
                    'text-sm font-bold w-6 h-6 rounded-lg flex items-center justify-center',
                    index < 3 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-700 text-gray-500'
                  )}>
                    {index + 1}
                  </span>
                  <Database className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-300 font-mono text-sm">{table.table}</span>
                </div>
                {table.error ? (
                  <span className="text-xs px-2 py-1 rounded-lg bg-red-500/20 text-red-400">오류</span>
                ) : (
                  <span className={cn(
                    'text-sm font-medium px-3 py-1 rounded-lg',
                    table.count > 1000
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : table.count > 100
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-gray-700 text-gray-400'
                  )}>
                    {table.count.toLocaleString()} 행
                  </span>
                )}
              </div>
            ))}
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
