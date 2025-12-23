import axios from 'axios';
import { TrackSearchParams, Category, MoodOption, LanguageOption } from '../types';

// Vercel 배포 시 환경변수에서 API URL 읽기, 로컬에서는 프록시 사용
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: 토큰 자동 추가
api.interceptors.request.use((config) => {
  const authStorage = localStorage.getItem('auth-storage');
  if (authStorage) {
    const { state } = JSON.parse(authStorage);
    if (state?.token) {
      config.headers.Authorization = `Bearer ${state.token}`;
    }
  }
  return config;
});

// 응답 인터셉터: 401 에러 시 로그아웃
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
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
  getDownloadUrl: (trackId: string) => api.post(`/tracks/${trackId}/download`),
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
  createInvitation: (trackIds: string[], expiresInDays?: number) =>
    api.post('/admin/invitations', { trackIds, expiresInDays }),
  getInvitations: () => api.get('/admin/invitations'),
  getUsers: () => api.get('/admin/users'),
};
