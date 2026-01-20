import axios from 'axios';
import { TrackSearchParams, Category, MoodOption, LanguageOption, WebToonProjectSearchParams, WebToonScene } from '../types';

// Vercel 배포 시 환경변수에서 API URL 읽기, 로컬에서는 프록시 사용
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 토큰 갱신 중인지 여부
let isRefreshing = false;
// 토큰 갱신 대기 중인 요청들
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// 요청 인터셉터: 토큰 자동 추가
api.interceptors.request.use((config) => {
  const authStorage = localStorage.getItem('auth-storage');
  if (authStorage) {
    const { state } = JSON.parse(authStorage);
    if (state?.accessToken) {
      config.headers.Authorization = `Bearer ${state.accessToken}`;
    }
  }
  return config;
});

// 응답 인터셉터: 401 에러 시 토큰 갱신 시도 후 로그아웃
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 또는 403 에러이고 재시도하지 않은 요청인 경우
    // 403: 토큰 만료 (Invalid or expired token)
    const status = error.response?.status;
    if ((status === 401 || status === 403) && !originalRequest._retry) {
      // 토큰 갱신 요청 자체가 실패한 경우는 바로 로그아웃
      if (originalRequest.url === '/auth/refresh') {
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // 이미 토큰 갱신 중이면 대기열에 추가
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      // 저장된 refreshToken으로 토큰 갱신 시도
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        try {
          const { state } = JSON.parse(authStorage);
          if (state?.refreshToken) {
            const response = await api.post('/auth/refresh', {
              refreshToken: state.refreshToken,
            });

            const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

            // 새 토큰 저장
            const newState = {
              ...state,
              accessToken: newAccessToken,
              refreshToken: newRefreshToken || state.refreshToken,
            };
            localStorage.setItem('auth-storage', JSON.stringify({ state: newState }));

            // 대기 중인 요청들 처리
            processQueue(null, newAccessToken);

            // 원래 요청 재시도
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          processQueue(refreshError, null);
          localStorage.removeItem('auth-storage');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      // refreshToken이 없으면 로그아웃
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (email: string, password: string, name: string, invitationCode: string) =>
    api.post('/auth/register', { email, password, name, invitationCode }),
};

// Invitation API
export const invitationAPI = {
  verify: (code: string) => api.get(`/invitations/${code}`),
};

// Track API
export const trackAPI = {
  getMyTracks: () => api.get('/tracks/my-tracks'),
  getStreamUrl: (trackId: string) => api.get(`/tracks/${trackId}/stream`),
  // MP3로 변환된 파일 직접 다운로드
  downloadTrack: (trackId: string) => api.get(`/tracks/${trackId}/download`, {
    responseType: 'blob',
  }),
};

// Category API
export const categoryAPI = {
  // 전체 카테고리 조회 (트리 구조)
  getCategories: () => api.get<{ categories: Category[] }>('/categories'),
  // 메인 카테고리만 조회
  getMainCategories: () => api.get<{ categories: Category[] }>('/categories/main'),
  // 특정 카테고리의 서브카테고리
  getSubcategories: (slug: string) => api.get<{ subcategories: Category[] }>(`/categories/${slug}/subcategories`),
  // 특정 카테고리 상세
  getCategory: (slug: string) => api.get<{ category: Category }>(`/categories/${slug}`),
  // 분위기 옵션 목록
  getMoods: () => api.get<{ moods: MoodOption[] }>('/categories/options/moods'),
  // 언어 옵션 목록
  getLanguages: () => api.get<{ languages: LanguageOption[] }>('/categories/options/languages'),
};

// Track Update Data Type
export interface TrackUpdateData {
  title?: string;
  artist?: string;
  album?: string;
  mood?: string | null;
  language?: string | null;
  bpm?: number | null;
  release_year?: number | null;
  is_explicit?: boolean;
  description?: string | null;
  tags?: string[] | null;
  categories?: { id: string; is_primary?: boolean }[];
}

// Admin API
export const adminAPI = {
  uploadTrack: (formData: FormData) =>
    api.post('/admin/tracks', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getTracks: (params?: TrackSearchParams) => {
    const queryParams = new URLSearchParams();
    if (params?.q) queryParams.set('q', params.q);
    if (params?.category) queryParams.set('category', params.category);
    if (params?.mood) queryParams.set('mood', params.mood);
    if (params?.language) queryParams.set('language', params.language);
    if (params?.sort) queryParams.set('sort', params.sort);
    if (params?.order) queryParams.set('order', params.order);
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    const queryString = queryParams.toString();
    return api.get(`/admin/tracks${queryString ? `?${queryString}` : ''}`);
  },
  getTrack: (trackId: string) => api.get(`/admin/tracks/${trackId}`),
  updateTrack: (trackId: string, data: TrackUpdateData) =>
    api.patch(`/admin/tracks/${trackId}`, data),
  deleteTrack: (trackId: string) => api.delete(`/admin/tracks/${trackId}`),
  // 관리자 전용 스트리밍/다운로드 (user_tracks 체크 안함)
  getStreamUrl: (trackId: string) => api.get(`/admin/tracks/${trackId}/stream`),
  // MP3로 변환된 파일 직접 다운로드
  downloadTrack: (trackId: string) => api.get(`/admin/tracks/${trackId}/download`, {
    responseType: 'blob',
  }),
  createInvitation: (trackIds: string[], expiresInDays?: number) =>
    api.post('/admin/invitations', { trackIds, expiresInDays }),
  getInvitations: () => api.get('/admin/invitations'),
  getUsers: () => api.get('/admin/users'),
};

// WebToon Project API
export const webToonProjectAPI = {
  // Projects
  createProject: (formData: FormData) =>
    api.post('/admin/webtoon-projects', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getProjects: (params?: WebToonProjectSearchParams) => {
    const queryParams = new URLSearchParams();
    if (params?.q) queryParams.set('q', params.q);
    if (params?.status) queryParams.set('status', params.status);
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    const queryString = queryParams.toString();
    return api.get(`/admin/webtoon-projects${queryString ? `?${queryString}` : ''}`);
  },

  getProject: (projectId: string) =>
    api.get(`/admin/webtoon-projects/${projectId}`),

  updateProject: (projectId: string, formData: FormData) =>
    api.patch(`/admin/webtoon-projects/${projectId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteProject: (projectId: string) =>
    api.delete(`/admin/webtoon-projects/${projectId}`),

  // Scenes
  uploadScene: (projectId: string, formData: FormData) =>
    api.post(`/admin/webtoon-projects/${projectId}/scenes`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  updateScene: (projectId: string, sceneId: string, data: Partial<WebToonScene> | FormData) => {
    const config = data instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    return api.patch(`/admin/webtoon-projects/${projectId}/scenes/${sceneId}`, data, config);
  },

  reorderScenes: (projectId: string, scenes: Array<{ id: string; display_order: number }>) =>
    api.patch(`/admin/webtoon-projects/${projectId}/scenes/reorder`, { scenes }),

  deleteScene: (projectId: string, sceneId: string) =>
    api.delete(`/admin/webtoon-projects/${projectId}/scenes/${sceneId}`),

  // Scene-Track associations
  linkTrackToScene: (projectId: string, sceneId: string, trackId: string, displayOrder?: number) =>
    api.post(`/admin/webtoon-projects/${projectId}/scenes/${sceneId}/tracks`, {
      track_id: trackId,
      display_order: displayOrder,
    }),

  unlinkTrackFromScene: (projectId: string, sceneId: string, trackId: string) =>
    api.delete(`/admin/webtoon-projects/${projectId}/scenes/${sceneId}/tracks/${trackId}`),

  // Project Data (markers, memos)
  saveProjectData: (projectId: string, data: {
    trackMarkers: Array<{ id: string; trackId: string; positionY: number }>;
    memoNotes: Array<{ id: string; content: string; positionX: number; positionY: number; width: number; height: number }>;
  }) => api.put(`/admin/webtoon-projects/${projectId}/data`, data),

  loadProjectData: (projectId: string) =>
    api.get(`/admin/webtoon-projects/${projectId}/data`),

  // Project-specific tracks (프로젝트 전용 음원)
  uploadProjectTrack: (projectId: string, formData: FormData) =>
    api.post(`/admin/webtoon-projects/${projectId}/project-tracks`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getProjectTracks: (projectId: string) =>
    api.get(`/admin/webtoon-projects/${projectId}/project-tracks`),

  deleteProjectTrack: (projectId: string, trackId: string) =>
    api.delete(`/admin/webtoon-projects/${projectId}/project-tracks/${trackId}`),

  getProjectTrackStreamUrl: (projectId: string, trackId: string) =>
    api.get(`/admin/webtoon-projects/${projectId}/project-tracks/${trackId}/stream`),
};
