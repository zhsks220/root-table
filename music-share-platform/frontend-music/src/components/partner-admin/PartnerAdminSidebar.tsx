import { Users, UserPlus, Calculator, Settings, LogOut, Music, BarChart3, Sun, Moon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useNavigate } from 'react-router-dom';

interface PartnerAdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function PartnerAdminSidebar({ activeTab, onTabChange }: PartnerAdminSidebarProps) {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { id: 'partners', label: '파트너 관리', icon: Users },
    { id: 'invitations', label: '파트너 초대', icon: UserPlus },
    { id: 'settlements', label: '정산 관리', icon: Calculator },
    { id: 'settings', label: '설정', icon: Settings },
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
            <span className="block text-xs text-emerald-400">Partner Admin</span>
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

        {/* CMS 페이지로 이동 링크 */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <button
            onClick={() => navigate('/cms')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            CMS 대시보드
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
        <p className="mt-4 text-xs text-gray-600 px-2">v1.0.0 • Partner Admin</p>
      </div>
    </aside>
  );
}

export default PartnerAdminSidebar;
