import { BarChart3, Upload, FileSpreadsheet, Settings, LogOut, Music, Users, Sun, Moon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useNavigate } from 'react-router-dom';

interface CMSSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function CMSSidebar({ activeTab, onTabChange }: CMSSidebarProps) {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { id: 'dashboard', label: '음원/음반 종합', icon: BarChart3 },
    { id: 'upload', label: '정산 데이터 업로드', icon: Upload },
    { id: 'history', label: '업로드 이력', icon: FileSpreadsheet },
    { id: 'settings', label: '유통사 설정', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-black flex flex-col h-screen sticky top-0">
      <div className="p-6">
        {/* 로고 */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <Music className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-white">ROUTELABEL</span>
            <span className="block text-xs text-emerald-400">Distribution CMS</span>
          </div>
        </div>

        {/* 네비게이션 */}
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                activeTab === item.id
                  ? "bg-emerald-500 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              )}
            >
              <item.icon className={cn(
                "w-4 h-4",
                activeTab === item.id ? "text-white" : "text-gray-500"
              )} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* 다른 페이지로 이동 링크 */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <button
            onClick={() => navigate('/partner-admin')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
          >
            <Users className="w-4 h-4" />
            파트너 관리
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors mt-1"
          >
            ← 관리자 페이지
          </button>
        </div>
      </div>

      {/* 하단 사용자 정보 */}
      <div className="mt-auto p-6 border-t border-white/10">
        {/* 테마 토글 버튼 */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors mb-4"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {isDark ? '라이트 모드' : '다크 모드'}
        </button>

        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-emerald-900 flex items-center justify-center text-emerald-400 font-bold text-xs">
            {user?.name?.[0] || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          로그아웃
        </button>
        <p className="mt-4 text-xs text-gray-600 px-2">v1.0.0 • CMS 콘솔</p>
      </div>
    </aside>
  );
}

export default CMSSidebar;
