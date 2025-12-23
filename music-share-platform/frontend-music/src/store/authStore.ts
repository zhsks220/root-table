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
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  login: (email: string, password: string) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setAuth: (user, token) => {
        // API 클라이언트에 토큰 설정
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        set({ user, token, isAuthenticated: true, error: null });
      },

      logout: () => {
        // API 클라이언트에서 토큰 제거
        delete api.defaults.headers.common['Authorization'];
        set({ user: null, token: null, isAuthenticated: false, error: null });
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/login', { email, password });
          const { user, token } = response.data;

          // API 클라이언트에 토큰 설정
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          set({ user, token, isAuthenticated: true, isLoading: false, error: null });
        } catch (err: any) {
          const errorMessage = err.response?.data?.error || '로그인에 실패했습니다.';
          set({ isLoading: false, error: errorMessage });
          throw err;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// 앱 시작 시 저장된 토큰으로 API 클라이언트 설정
const storedAuth = localStorage.getItem('auth-storage');
if (storedAuth) {
  try {
    const { state } = JSON.parse(storedAuth);
    if (state?.token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
    }
  } catch (e) {
    // 파싱 실패 시 무시
  }
}
