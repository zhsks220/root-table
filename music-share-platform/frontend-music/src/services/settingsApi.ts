import api from './api';

// 설정 API
export const settingsAPI = {
  // 공통 설정
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/settings/password', { currentPassword, newPassword }),

  updateProfile: (name: string) =>
    api.put('/settings/profile', { name }),

  getMe: () =>
    api.get('/settings/me'),

  // 관리자 설정 - 유통사 관리
  getDistributors: () =>
    api.get('/settings/admin/distributors'),

  createDistributor: (data: { name: string; code: string; commissionRate?: number }) =>
    api.post('/settings/admin/distributors', data),

  updateDistributor: (id: string, data: { name?: string; code?: string; commissionRate?: number; isActive?: boolean }) =>
    api.put(`/settings/admin/distributors/${id}`, data),

  deleteDistributor: (id: string) =>
    api.delete(`/settings/admin/distributors/${id}`),

  // 시스템 설정
  getSystemSettings: () =>
    api.get('/settings/admin/system'),
};

export default settingsAPI;
