import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'partner';
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  rememberMe: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string, rememberMe?: boolean) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      rememberMe: true,

      setAuth: (user, accessToken, refreshToken, rememberMe = true) => {
        // API 클라이언트에 토큰 설정
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        set({ user, accessToken, refreshToken, isAuthenticated: true, error: null, rememberMe });

        // rememberMe가 false면 sessionStorage로 이동, localStorage에서 제거
        if (!rememberMe) {
          sessionStorage.setItem('auth-session', JSON.stringify({
            state: { user, accessToken, refreshToken, isAuthenticated: true, rememberMe }
          }));
          localStorage.removeItem('auth-storage');
        }
      },

      setTokens: (accessToken, refreshToken) => {
        // API 클라이언트에 토큰 설정
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        set({ accessToken, refreshToken });
      },

      logout: () => {
        // API 클라이언트에서 토큰 제거
        delete api.defaults.headers.common['Authorization'];
        // sessionStorage도 정리
        sessionStorage.removeItem('auth-session');
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, error: null, rememberMe: true });
      },

      login: async (email: string, password: string, rememberMe: boolean = true) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/login', { email, password });
          const { user, accessToken, refreshToken } = response.data;

          // API 클라이언트에 토큰 설정
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false, error: null, rememberMe });

          // rememberMe가 false면 sessionStorage로 이동, localStorage에서 제거
          if (!rememberMe) {
            sessionStorage.setItem('auth-session', JSON.stringify({
              state: { user, accessToken, refreshToken, isAuthenticated: true, rememberMe }
            }));
            localStorage.removeItem('auth-storage');
          }
        } catch (err: any) {
          const errorMessage = err.response?.data?.error || '로그인에 실패했습니다.';
          set({ isLoading: false, error: errorMessage });
          throw err;
        }
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          return false;
        }

        try {
          const response = await api.post('/auth/refresh', { refreshToken });
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

          // API 클라이언트에 새 토큰 설정
          api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
          set({ accessToken: newAccessToken, refreshToken: newRefreshToken || refreshToken });
          return true;
        } catch (err) {
          // 리프레시 토큰도 만료된 경우 로그아웃
          get().logout();
          return false;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// 앱 시작 시 저장된 토큰으로 API 클라이언트 설정
// localStorage (로그인 상태 유지) 또는 sessionStorage (세션 한정) 확인
const storedAuth = localStorage.getItem('auth-storage');
const sessionAuth = sessionStorage.getItem('auth-session');

if (storedAuth) {
  try {
    const { state } = JSON.parse(storedAuth);
    if (state?.accessToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${state.accessToken}`;
    }
  } catch (e) {
    // 파싱 실패 시 무시
  }
} else if (sessionAuth) {
  // sessionStorage에 있으면 zustand store 복원
  try {
    const { state } = JSON.parse(sessionAuth);
    if (state?.accessToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${state.accessToken}`;
      // zustand store에 상태 복원
      useAuthStore.setState({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        rememberMe: state.rememberMe ?? false,
      });
    }
  } catch (e) {
    // 파싱 실패 시 무시
  }
}
