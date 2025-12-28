import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'dark' | 'light';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark', // 다크 모드가 기본값

      setTheme: (theme) => {
        set({ theme });
        // HTML에 class 적용
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },

      toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        get().setTheme(newTheme);
      },
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        // 페이지 로드 시 저장된 테마 적용
        if (state?.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
    }
  )
);

// 앱 시작 시 저장된 테마 적용 (초기화)
const initTheme = () => {
  const storedTheme = localStorage.getItem('theme-storage');
  if (storedTheme) {
    try {
      const { state } = JSON.parse(storedTheme);
      if (state?.theme === 'dark') {
        document.documentElement.classList.add('dark');
      }
    } catch (e) {
      // 기본값 다크 모드 적용
      document.documentElement.classList.add('dark');
    }
  } else {
    // 저장된 테마 없으면 기본 다크 모드
    document.documentElement.classList.add('dark');
  }
};

initTheme();
