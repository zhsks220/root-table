import api from './api';

// 파트너 관리 API 기본 경로
const PARTNER_ADMIN_BASE = '/partner/admin';

// 타입 정의
export interface Partner {
  id: string;
  partnerType: 'artist' | 'company' | 'composer';
  businessName: string;
  representativeName: string;
  phone: string;
  email: string;
  userName: string;
  defaultShareRate: number;
  isActive: boolean;
  trackCount: number;
  totalSettlement: number;
  createdAt: string;
}

export interface PartnerDetail extends Partner {
  userId: string;
  businessNumber: string;
  address: string;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  contractStartDate: string;
  contractEndDate: string;
  memo: string;
}

export interface PartnerTrack {
  id: string;
  trackId: string;
  shareRate: number;
  role: string;
  contractStartDate: string;
  contractEndDate: string;
  isActive: boolean;
  title: string;
  artist: string;
  album: string;
}

export interface PartnerSettlement {
  id: string;
  yearMonth: string;
  grossRevenue: number;
  netRevenue: number;
  partnerShare: number;
  managementFee: number;
  totalStreams: number;
  totalDownloads: number;
  status: 'pending' | 'confirmed' | 'paid';
  confirmedAt: string | null;
  paidAt: string | null;
  createdAt: string;
  businessName: string;
  partnerType: string;
  representativeName: string;
}

export interface PartnerInvitation {
  id: string;
  invitationCode: string;
  partnerType: string;
  businessName: string;
  email: string;
  phone: string;
  defaultShareRate: number;
  memo: string;
  isUsed: boolean;
  usedByName: string | null;
  usedByEmail: string | null;
  usedAt: string | null;
  expiresAt: string;
  createdByName: string;
  createdAt: string;
  trackCount: number;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  createdAt: string;
}

// 파트너 관리 API 클라이언트
export const partnerAdminAPI = {
  // 파트너 목록
  getPartners: (params?: { type?: string; status?: string; search?: string }) =>
    api.get<{ partners: Partner[] }>(`${PARTNER_ADMIN_BASE}/partners`, { params }),

  // 파트너 상세
  getPartner: (id: string) =>
    api.get<{
      partner: PartnerDetail;
      tracks: PartnerTrack[];
      recentSettlements: { id: string; yearMonth: string; grossRevenue: number; partnerShare: number; status: string; createdAt: string }[];
    }>(`${PARTNER_ADMIN_BASE}/partners/${id}`),

  // 파트너 수정
  updatePartner: (id: string, data: Partial<PartnerDetail>) =>
    api.put(`${PARTNER_ADMIN_BASE}/partners/${id}`, data),

  // 파트너 비활성화/삭제
  deactivatePartner: (id: string) =>
    api.delete(`${PARTNER_ADMIN_BASE}/partners/${id}`),

  // 파트너 삭제 (별칭)
  deletePartner: (id: string) =>
    api.delete(`${PARTNER_ADMIN_BASE}/partners/${id}`),

  // 파트너 트랙 목록
  getPartnerTracks: (partnerId: string) =>
    api.get<{ tracks: PartnerTrack[] }>(`${PARTNER_ADMIN_BASE}/partners/${partnerId}/tracks`),

  // 트랙 할당
  assignTrack: (partnerId: string, data: { trackId: string; shareRate: number; role?: string }) =>
    api.post(`${PARTNER_ADMIN_BASE}/partners/${partnerId}/tracks`, data),

  // 트랙 할당 해제
  unassignTrack: (partnerId: string, trackId: string) =>
    api.delete(`${PARTNER_ADMIN_BASE}/partners/${partnerId}/tracks/${trackId}`),

  // 초대 목록
  getInvitations: (status?: string) =>
    api.get<{ invitations: PartnerInvitation[] }>(`${PARTNER_ADMIN_BASE}/invitations`, { params: { status } }),

  // 초대 생성
  createInvitation: (data: {
    partnerType: string;
    businessName?: string;
    email?: string;
    phone?: string;
    defaultShareRate?: number;
    memo?: string;
    expiresInDays?: number;
    tracks?: { trackId: string; shareRate: number; role?: string }[];
  }) => api.post<{ message: string; invitation: PartnerInvitation }>(`${PARTNER_ADMIN_BASE}/invitations`, data),

  // 초대 취소
  cancelInvitation: (id: string) =>
    api.delete(`${PARTNER_ADMIN_BASE}/invitations/${id}`),

  // 초대 삭제 (별칭)
  deleteInvitation: (id: string) =>
    api.delete(`${PARTNER_ADMIN_BASE}/invitations/${id}`),

  // 정산 할당
  allocateSettlements: (yearMonth: string) =>
    api.post<{ message: string; yearMonth: string; allocatedPartners: number }>(
      `${PARTNER_ADMIN_BASE}/settlements/allocate`,
      { yearMonth }
    ),

  // 파트너별 정산 현황
  getSettlements: (params?: { yearMonth?: string; partnerId?: string; status?: string }) =>
    api.get<{ settlements: PartnerSettlement[] }>(`${PARTNER_ADMIN_BASE}/settlements`, { params }),

  // 특정 파트너 정산 현황 (별칭)
  getPartnerSettlements: (partnerId: string) =>
    api.get<{ settlements: PartnerSettlement[] }>(`${PARTNER_ADMIN_BASE}/settlements`, { params: { partnerId } }),

  // 정산 상태 변경
  updateSettlementStatus: (id: string, data: { status: string; paymentRef?: string }) =>
    api.put(`${PARTNER_ADMIN_BASE}/settlements/${id}/status`, data),

  // 트랙 검색
  searchTracks: (search?: string) =>
    api.get<{ tracks: Track[] }>(`${PARTNER_ADMIN_BASE}/tracks`, { params: { search } }),
};

export default partnerAdminAPI;
