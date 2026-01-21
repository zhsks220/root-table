import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { cn } from '../lib/utils';
import {
  ArrowLeft, Activity, Server, AlertTriangle, Database,
  BarChart3, Users, Bell, RefreshCw, CheckCircle, XCircle,
  Clock, LogOut, Settings
} from 'lucide-react';

// 탭 컴포넌트들
import OverviewTab from '../components/monitoring/OverviewTab';
import SystemTab from '../components/monitoring/SystemTab';
import ErrorsTab from '../components/monitoring/ErrorsTab';
import DatabaseTab from '../components/monitoring/DatabaseTab';
import ApiStatsTab from '../components/monitoring/ApiStatsTab';
import UsersTab from '../components/monitoring/UsersTab';
import AlertsTab from '../components/monitoring/AlertsTab';

type TabType = 'overview' | 'system' | 'errors' | 'database' | 'api' | 'users' | 'alerts';

const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: '전체 현황', icon: Activity },
  { id: 'system', label: '시스템', icon: Server },
  { id: 'errors', label: '에러', icon: AlertTriangle },
  { id: 'database', label: '데이터베이스', icon: Database },
  { id: 'api', label: 'API 통계', icon: BarChart3 },
  { id: 'users', label: '사용자', icon: Users },
  { id: 'alerts', label: '알림', icon: Bell },
];

export default function MonitoringDashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 자동 새로고침 (30초)
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setLastRefresh(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setLastRefresh(new Date());
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const renderTabContent = () => {
    const key = lastRefresh.getTime();

    switch (activeTab) {
      case 'overview':
        return <OverviewTab key={key} />;
      case 'system':
        return <SystemTab key={key} />;
      case 'errors':
        return <ErrorsTab key={key} />;
      case 'database':
        return <DatabaseTab key={key} />;
      case 'api':
        return <ApiStatsTab key={key} />;
      case 'users':
        return <UsersTab key={key} />;
      case 'alerts':
        return <AlertsTab key={key} />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#0a0a0f]"
    >
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-800/50 bg-[#0a0a0f]/95 backdrop-blur-md">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">
                모니터링 대시보드
              </h1>
              <p className="text-xs text-gray-500">
                {user?.email} · 개발자
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto Refresh Toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={cn(
                'px-3 py-2 rounded-xl transition-all text-xs font-medium flex items-center gap-2',
                autoRefresh
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-gray-800/50 text-gray-500 border border-gray-700/50'
              )}
              title={autoRefresh ? '자동 새로고침 켜짐' : '자동 새로고침 꺼짐'}
            >
              {autoRefresh ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              <span className="hidden sm:inline">{autoRefresh ? '자동' : '수동'}</span>
            </button>

            {/* Manual Refresh */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw className={cn('w-5 h-5', isRefreshing && 'animate-spin')} />
            </button>

            {/* Admin Page */}
            <button
              onClick={() => navigate('/admin')}
              className="p-2 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-all"
              title="관리자 페이지"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Logout */}
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-all"
              title="로그아웃"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex px-4 pb-3 gap-2 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap',
                    isActive
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 pb-20">
        {renderTabContent()}
      </main>

      {/* Last Refresh Indicator */}
      <div className="fixed bottom-4 right-4 px-4 py-2 rounded-full bg-gray-800/90 border border-gray-700/50 text-xs text-gray-400 flex items-center gap-2 backdrop-blur-sm">
        <Clock className="w-3.5 h-3.5" />
        마지막 갱신: {lastRefresh.toLocaleTimeString('ko-KR')}
      </div>
    </motion.div>
  );
}
