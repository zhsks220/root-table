import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { monitoringAPI, UserStats } from '../../services/monitoringApi';
import { Users, UserPlus, LogIn, Activity, Clock, Shield, User, Briefcase, AlertTriangle, Code } from 'lucide-react';

export default function UsersTab() {
  const [data, setData] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await monitoringAPI.getUsers();
        setData(response.data);
        setError(null);
      } catch (err) {
        setError('사용자 통계를 불러오는 데 실패했습니다');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return Shield;
      case 'developer': return Code;
      case 'partner': return Briefcase;
      default: return User;
    }
  };

  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'admin': return { color: 'red', label: '관리자' };
      case 'developer': return { color: 'emerald', label: '개발자' };
      case 'partner': return { color: 'emerald', label: '파트너' };
      default: return { color: 'gray', label: '사용자' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-gray-700/50 border-t-emerald-500 animate-spin" />
            <Users className="w-6 h-6 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <span className="text-gray-400 text-sm">사용자 정보 로딩 중...</span>
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

  const totalUsers = data.byRole.reduce((sum, r) => sum + parseInt(r.count), 0);

  return (
    <div className="space-y-6">
      {/* 활동 요약 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 p-4 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Activity className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-gray-500 text-xs mb-1">활성 (24시간)</p>
          <p className="text-2xl font-bold text-white">{data.activeUsers24h}</p>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 p-4 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <LogIn className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-gray-500 text-xs mb-1">로그인 (24시간)</p>
          <p className="text-2xl font-bold text-white">{data.logins24h}</p>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 p-4 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <UserPlus className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-gray-500 text-xs mb-1">신규 (7일)</p>
          <p className="text-2xl font-bold text-white">{data.recentSignups7d}</p>
        </div>
      </div>

      {/* 역할별 사용자 */}
      <div className="rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20">
              <Users className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-white font-semibold">역할별 사용자</h3>
          </div>
          <span className="text-gray-500 text-sm">총 {totalUsers}명</span>
        </div>

        <div className="space-y-4">
          {data.byRole.map((role) => {
            const Icon = getRoleIcon(role.role);
            const info = getRoleInfo(role.role);
            const count = parseInt(role.count);
            const percentage = totalUsers > 0 ? (count / totalUsers) * 100 : 0;

            return (
              <div key={role.role}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`p-1.5 rounded-lg bg-${info.color}-500/20`}>
                      <Icon className={`w-4 h-4 text-${info.color}-400`} />
                    </span>
                    <span className="text-gray-300">{info.label}</span>
                  </div>
                  <span className="text-white font-bold">{count}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-700/50 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      role.role === 'admin' ? 'bg-gradient-to-r from-red-600 to-red-400'
                        : role.role === 'developer' ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                          : role.role === 'partner' ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                            : 'bg-gradient-to-r from-gray-600 to-gray-400'
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 최근 사용자 */}
      <div className="rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-emerald-500/20">
            <UserPlus className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-white font-semibold">최근 가입자</h3>
        </div>

        <div className="space-y-2">
          {data.recentUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">최근 가입자가 없습니다</p>
            </div>
          ) : (
            data.recentUsers.map((user) => {
              const Icon = getRoleIcon(user.role);
              const info = getRoleInfo(user.role);
              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-700/30 hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`p-2 rounded-lg bg-${info.color}-500/20`}>
                      <Icon className={`w-4 h-4 text-${info.color}-400`} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">
                        {user.name || '이름 없음'}
                      </p>
                      <p className="text-gray-500 text-xs truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-xs px-2 py-1 rounded-lg bg-${info.color}-500/20 text-${info.color}-400`}>
                      {info.label}
                    </span>
                    <p className="text-gray-500 text-xs mt-1">
                      {new Date(user.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </div>
              );
            })
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
