import axios from 'axios';

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

// Admin API
export const adminAPI = {
  uploadTrack: (formData: FormData) =>
    api.post('/admin/tracks', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getTracks: () => api.get('/admin/tracks'),
  deleteTrack: (trackId: string) => api.delete(`/admin/tracks/${trackId}`),
  createInvitation: (trackIds: string[], expiresInDays?: number) =>
    api.post('/admin/invitations', { trackIds, expiresInDays }),
  getInvitations: () => api.get('/admin/invitations'),
  getUsers: () => api.get('/admin/users'),
};
