import api from './api';

// 파트너 API 기본 경로
const PARTNER_BASE = '/partner';

// 타입 정의
export interface PartnerProfile {
  id: string;
  userId: string;
  partnerType: 'artist' | 'company' | 'composer';
  businessName: string;
  representativeName: string;
  businessNumber: string;
  phone: string;
  email: string;
  address: string;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  defaultShareRate: number;
  contractStartDate: string;
  contractEndDate: string;
  memo: string;
  isActive: boolean;
  createdAt: string;
}

export interface PartnerDashboard {
  partner: PartnerProfile;
  stats: {
    trackCount: number;
    totalSettlements: number;
    pendingSettlements: number;
    totalEarnings: number;
    lastMonthEarnings: number;
  };
  recentSettlements: {
    id: string;
    yearMonth: string;
    grossRevenue: number;
    netRevenue: number;
    partnerShare: number;
    status: string;
    createdAt: string;
  }[];
  assignedTracks: {
    id: string;
    trackId: string;
    title: string;
    artist: string;
    album: string;
    shareRate: number;
    role: string;
  }[];
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
}

export interface PartnerTrack {
  id: string;
  trackId: string;
  title: string;
  artist: string;
  album: string;
  shareRate: number;
  role: string;
  contractStartDate: string;
  contractEndDate: string;
  isActive: boolean;
}

export interface LibraryTrack {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  duration: number | null;
  mood: string | null;
  language: string | null;
  bpm: number | null;
  release_year: number | null;
  is_explicit: boolean;
  created_at: string;
  categories: { id: string; name: string; is_primary: boolean }[];
  isAssigned: boolean;
  shareRate: number | null;
  role: string | null;
}

export interface LibrarySearchParams {
  q?: string;
  category?: string;
  mood?: string;
  language?: string;
  sort?: 'created_at' | 'title' | 'artist';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  assigned_only?: boolean;
}

// 파트너 API 클라이언트
export const partnerAPI = {
  // 초대 코드 확인
  verifyInvitation: (code: string) =>
    api.get<{
      valid: boolean;
      invitation: {
        partnerType: string;
        businessName: string;
        email: string;
        phone: string;
        defaultShareRate: number;
      };
    }>(`${PARTNER_BASE}/verify-invitation/${code}`),

  // 파트너 등록 (초대 코드 사용)
  register: (data: {
    invitationCode: string;
    email: string;
    password: string;
    name: string;
    phone?: string;
    businessName?: string;
    businessNumber?: string;
    representativeName?: string;
    address?: string;
    bankName?: string;
    bankAccount?: string;
    bankHolder?: string;
  }) => api.post<{ message: string; partnerId: string }>(`${PARTNER_BASE}/register`, data),

  // 파트너 대시보드
  getDashboard: () =>
    api.get<PartnerDashboard>(`${PARTNER_BASE}/dashboard`),

  // 내 프로필
  getProfile: () =>
    api.get<{ partner: PartnerProfile }>(`${PARTNER_BASE}/profile`),

  // 프로필 업데이트
  updateProfile: (data: Partial<PartnerProfile>) =>
    api.put<{ message: string }>(`${PARTNER_BASE}/profile`, data),

  // 내 정산 목록
  getSettlements: (params?: { yearMonth?: string; status?: string }) =>
    api.get<{ settlements: PartnerSettlement[] }>(`${PARTNER_BASE}/settlements`, { params }),

  // 내 트랙 목록
  getTracks: () =>
    api.get<{ tracks: PartnerTrack[] }>(`${PARTNER_BASE}/tracks`),

  // 전체 트랙 라이브러리 (할당 여부 포함)
  getLibrary: (params?: LibrarySearchParams) =>
    api.get<{
      tracks: LibraryTrack[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`${PARTNER_BASE}/library`, { params }),

  // 트랙 스트리밍 URL (할당된 트랙만)
  getStreamUrl: (trackId: string) =>
    api.get<{ streamUrl: string }>(`${PARTNER_BASE}/library/${trackId}/stream`),

  // 트랙 다운로드 (할당된 트랙만)
  downloadTrack: (trackId: string) =>
    api.get<Blob>(`${PARTNER_BASE}/library/${trackId}/download`, { responseType: 'blob' }),
};

export default partnerAPI;
