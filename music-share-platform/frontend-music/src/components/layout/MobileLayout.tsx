import React, { useState, useEffect } from 'react';
import { Menu, X, LogOut, ChevronRight, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';

export interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface QuickLink {
  label: string;
  path: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface MobileLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  menuItems: MenuItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  quickLinks?: QuickLink[];
  logoIcon?: React.ComponentType<{ className?: string }>;
  logoImage?: string;
  logoImageDark?: string;
  logoTypeImage?: string;
  logoTypeImageDark?: string;
  logoText?: string;
  logoSubtext?: string;
  theme?: 'light' | 'dark';
}

export function MobileLayout({
  children,
  title: _title,
  subtitle,
  menuItems,
  activeTab,
  onTabChange,
  quickLinks = [],
  logoIcon: LogoIcon,
  logoImage,
  logoImageDark,
  logoTypeImage,
  logoTypeImageDark,
  logoText,
  logoSubtext,
  theme: _themeProp = 'light' // prop은 무시하고 스토어 사용
}: MobileLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();

  // 화면 크기 변경 시 메뉴 닫기
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 경로 변경 시 메뉴 닫기
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    setIsMobileMenuOpen(false);
  };

  const isDark = theme === 'dark';

  return (
    <div className={cn("min-h-screen", isDark ? "bg-black" : "bg-gray-50")}>
      {/* 모바일 헤더 */}
      <header className={cn(
        "md:hidden fixed top-0 left-0 right-0 z-40 border-b",
        isDark
          ? "bg-black border-white/10"
          : "bg-white border-gray-200"
      )}>
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isDark
                ? "text-gray-400 hover:text-white hover:bg-white/10"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            )}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>

          <div className="flex items-center gap-2">
            {logoImage ? (
              <>
                <img src={isDark && logoImageDark ? logoImageDark : logoImage} alt="Logo" className="h-6" />
                {logoTypeImage && (
                  <img src={isDark && logoTypeImageDark ? logoTypeImageDark : logoTypeImage} alt="Type" className="h-12" />
                )}
              </>
            ) : (
              <>
                <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
                  {LogoIcon && <LogoIcon className="w-4 h-4 text-white" />}
                </div>
                {logoText && (
                  <span className={cn(
                    "font-bold text-base",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    {logoText}
                  </span>
                )}
              </>
            )}
          </div>

          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs",
            isDark
              ? "bg-emerald-900 text-emerald-400"
              : "bg-emerald-100 text-emerald-600"
          )}>
            {user?.name?.[0] || 'U'}
          </div>
        </div>
      </header>

      {/* 모바일 슬라이드 메뉴 */}
      <div
        className={cn(
          "md:hidden fixed inset-0 z-30 transition-all duration-300",
          isMobileMenuOpen ? "visible" : "invisible"
        )}
      >
        {/* 오버레이 */}
        <div
          className={cn(
            "absolute inset-0 bg-black transition-opacity duration-300",
            isMobileMenuOpen ? "opacity-50" : "opacity-0"
          )}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* 사이드 메뉴 */}
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-72 transition-transform duration-300 flex flex-col",
            isDark ? "bg-black" : "bg-white",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* 메뉴 헤더 */}
          <div className={cn(
            "p-6 border-b",
            isDark ? "border-white/10" : "border-gray-200"
          )}>
            {logoImage ? (
              <div>
                <div className="flex items-center gap-3">
                  <img src={isDark && logoImageDark ? logoImageDark : logoImage} alt="Logo" className="h-8" />
                  {logoTypeImage && (
                    <img src={isDark && logoTypeImageDark ? logoTypeImageDark : logoTypeImage} alt="Type" className="h-16" />
                  )}
                </div>
                {logoSubtext && (
                  <span className="text-xs text-emerald-500 block mt-1">{logoSubtext}</span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                  {LogoIcon && <LogoIcon className="w-6 h-6 text-white" />}
                </div>
                <div>
                  {logoText && (
                    <span className={cn(
                      "font-bold text-lg block",
                      isDark ? "text-white" : "text-gray-900"
                    )}>
                      {logoText}
                    </span>
                  )}
                  {logoSubtext && (
                    <span className="text-xs text-emerald-500">{logoSubtext}</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 네비게이션 */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                  activeTab === item.id
                    ? isDark
                      ? "bg-emerald-500 text-white"
                      : "bg-emerald-50 text-emerald-700"
                    : isDark
                      ? "text-gray-400 hover:text-white hover:bg-white/10"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5",
                  activeTab === item.id
                    ? isDark ? "text-white" : "text-emerald-600"
                    : isDark ? "text-gray-500" : "text-gray-400"
                )} />
                {item.label}
              </button>
            ))}

            {/* 빠른 링크 */}
            {quickLinks.filter(link => link.path !== location.pathname).length > 0 && (
              <div className={cn(
                "mt-6 pt-6 border-t",
                isDark ? "border-white/10" : "border-gray-200"
              )}>
                {quickLinks.filter(link => link.path !== location.pathname).map((link, idx) => (
                  <button
                    key={idx}
                    onClick={() => navigate(link.path)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-colors",
                      isDark
                        ? "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      {link.icon && <link.icon className="w-4 h-4" />}
                      {link.label}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ))}
              </div>
            )}
          </nav>

          {/* 사용자 정보 및 로그아웃 */}
          <div className={cn(
            "p-4 border-t",
            isDark ? "border-white/10" : "border-gray-200"
          )}>
            {/* 테마 토글 버튼 */}
            <button
              onClick={toggleTheme}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors mb-3",
                isDark
                  ? "text-gray-400 hover:text-white hover:bg-white/10"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              {isDark ? '라이트 모드' : '다크 모드'}
            </button>

            <div className="flex items-center gap-3 px-3 py-2 mb-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                isDark
                  ? "bg-emerald-900 text-emerald-400"
                  : "bg-emerald-100 text-emerald-600"
              )}>
                {user?.name?.[0] || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-medium truncate",
                  isDark ? "text-white" : "text-gray-900"
                )}>
                  {user?.name}
                </p>
                <p className={cn(
                  "text-xs truncate",
                  isDark ? "text-gray-500" : "text-gray-500"
                )}>
                  {user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className={cn(
                "w-full flex items-center gap-2 px-4 py-3 text-sm rounded-lg transition-colors",
                isDark
                  ? "text-gray-500 hover:text-red-400 hover:bg-red-900/20"
                  : "text-gray-500 hover:text-red-600 hover:bg-red-50"
              )}
            >
              <LogOut className="w-4 h-4" />
              로그아웃
            </button>
          </div>
        </div>
      </div>

      {/* 데스크톱 사이드바 + 메인 콘텐츠 */}
      <div className="flex">
        {/* 데스크톱 사이드바 */}
        <aside className={cn(
          "hidden md:flex w-64 flex-col h-screen sticky top-0",
          isDark ? "bg-black" : "bg-[#fbfbfb] border-r border-gray-100"
        )}>
          <div className="p-6">
            <div className="mb-8">
              {logoImage ? (
                <div>
                  <div className="flex items-center gap-3">
                    <img src={isDark && logoImageDark ? logoImageDark : logoImage} alt="Logo" className="h-8" />
                    {logoTypeImage && (
                      <img src={isDark && logoTypeImageDark ? logoTypeImageDark : logoTypeImage} alt="Type" className="h-14" />
                    )}
                  </div>
                  {logoSubtext && (
                    <span className="text-xs text-emerald-500 block mt-1">{logoSubtext}</span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                    {LogoIcon && <LogoIcon className="w-5 h-5 text-white" />}
                  </div>
                  <div>
                    {logoText && (
                      <span className={cn(
                        "font-bold text-lg tracking-tight block",
                        isDark ? "text-white" : "text-gray-900"
                      )}>
                        {logoText}
                      </span>
                    )}
                    {logoSubtext && (
                      <span className="text-xs text-emerald-500">{logoSubtext}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <nav className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    activeTab === item.id
                      ? isDark
                        ? "bg-emerald-500 text-white"
                        : "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200/50"
                      : isDark
                        ? "text-gray-400 hover:text-white hover:bg-white/10"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/50"
                  )}
                >
                  <item.icon className={cn(
                    "w-4 h-4",
                    activeTab === item.id
                      ? isDark ? "text-white" : "text-emerald-500"
                      : isDark ? "text-gray-500" : "text-gray-400"
                  )} />
                  {item.label}
                </button>
              ))}
            </nav>

            {/* 빠른 링크 */}
            {quickLinks.filter(link => link.path !== location.pathname).length > 0 && (
              <div className={cn(
                "mt-8 pt-6 border-t",
                isDark ? "border-white/10" : "border-gray-100"
              )}>
                {quickLinks.filter(link => link.path !== location.pathname).map((link, idx) => (
                  <button
                    key={idx}
                    onClick={() => navigate(link.path)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                      isDark
                        ? "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    {link.icon && <link.icon className="w-4 h-4" />}
                    {link.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 사용자 정보 */}
          <div className={cn(
            "mt-auto p-6 border-t",
            isDark ? "border-gray-800" : "border-gray-100"
          )}>
            {/* 테마 토글 버튼 */}
            <button
              onClick={toggleTheme}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors mb-4",
                isDark
                  ? "text-gray-400 hover:text-white hover:bg-white/10"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              )}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {isDark ? '라이트 모드' : '다크 모드'}
            </button>

            <div className="flex items-center gap-3 mb-4 px-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs",
                isDark
                  ? "bg-emerald-900 text-emerald-400"
                  : "bg-emerald-100 text-emerald-600"
              )}>
                {user?.name?.[0] || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium truncate",
                  isDark ? "text-white" : "text-gray-900"
                )}>
                  {user?.name}
                </p>
                <p className={cn(
                  "text-xs truncate",
                  isDark ? "text-gray-500" : "text-gray-500"
                )}>
                  {user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors",
                isDark
                  ? "text-gray-500 hover:text-red-400 hover:bg-red-900/20"
                  : "text-gray-500 hover:text-red-600 hover:bg-red-50"
              )}
            >
              <LogOut className="w-4 h-4" />
              로그아웃
            </button>
            <p className={cn(
              "mt-4 text-xs px-2",
              isDark ? "text-gray-600" : "text-gray-400"
            )}>
              v1.0.0 • {subtitle || 'Console'}
            </p>
          </div>
        </aside>

        {/* 메인 콘텐츠 */}
        <main className={cn(
          "flex-1 min-h-screen overflow-x-hidden pt-14 md:pt-0",
          isDark ? "bg-black" : "bg-gray-50"
        )}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default MobileLayout;
