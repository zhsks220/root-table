import api from './api';

// CMS API 기본 경로 (숨겨진 경로)
const CMS_BASE = '/cms-rl2025x';

// 타입 정의
export interface DashboardSummary {
  period: { start: string; end: string };
  totals: {
    grossRevenue: number;
    netRevenue: number;
    managementFee: number;
    totalStreams: number;
    totalDownloads: number;
  };
  monthlyTrend: {
    yearMonth: string;
    grossRevenue: number;
    netRevenue: number;
    managementFee: number;
  }[];
  distributorShare: {
    name: string;
    code: string;
    revenue: number;
    sharePercent: number;
  }[];
}

export interface DistributorSettlement {
  rank: number;
  distributorName: string;
  distributorCode: string;
  commissionRate: number;
  sharePercent: number;
  grossRevenue: number;
  netRevenue: number;
  managementFee: number;
  streamCount: number;
  downloadCount: number;
  monthCount: number;
}

export interface DistributorSettlementsResponse {
  period: { start: string; end: string };
  settlements: DistributorSettlement[];
  totals: {
    grossRevenue: number;
    netRevenue: number;
    managementFee: number;
    streamCount: number;
    downloadCount: number;
    sharePercent: number;
  };
}

export interface MonthlySettlement {
  yearMonth: string;
  distributorName: string;
  distributorCode: string;
  grossRevenue: number;
  netRevenue: number;
  managementFee: number;
  streamCount: number;
  downloadCount: number;
  trackTitle: string | null;
  trackArtist: string | null;
}

export interface ShareTrendData {
  yearMonth: string;
  distributors: {
    distributorName: string;
    distributorCode: string;
    grossRevenue: number;
    sharePercent: number;
  }[];
}

export interface Distributor {
  id: string;
  name: string;
  code: string;
  commissionRate: number;
  isActive: boolean;
  createdAt: string;
}

export interface UploadHistory {
  id: string;
  fileName: string;
  fileSize: number;
  recordCount: number;
  uploadType: string;
  status: string;
  errorMessage: string | null;
  processedAt: string | null;
  createdAt: string;
  uploadedByName: string;
}

// CMS API 클라이언트
export const cmsAPI = {
  // 대시보드 요약
  getDashboardSummary: (startDate?: string, endDate?: string) =>
    api.get<DashboardSummary>(`${CMS_BASE}/dashboard/summary`, {
      params: { startDate, endDate },
    }),

  // 유통사별 정산 현황
  getDistributorSettlements: (startDate?: string, endDate?: string) =>
    api.get<DistributorSettlementsResponse>(`${CMS_BASE}/settlements/by-distributor`, {
      params: { startDate, endDate },
    }),

  // 월별 상세 정산
  getMonthlySettlements: (startDate?: string, endDate?: string, distributorId?: string) =>
    api.get<{ period: { start: string; end: string }; settlements: MonthlySettlement[] }>(
      `${CMS_BASE}/settlements/monthly`,
      { params: { startDate, endDate, distributorId } }
    ),

  // 앨범 정산
  getAlbumSettlements: (startDate?: string, endDate?: string) =>
    api.get(`${CMS_BASE}/settlements/albums`, {
      params: { startDate, endDate },
    }),

  // 점유율 변동 차트
  getShareTrend: (startDate?: string, endDate?: string) =>
    api.get<{ period: { start: string; end: string }; data: ShareTrendData[] }>(
      `${CMS_BASE}/charts/share-trend`,
      { params: { startDate, endDate } }
    ),

  // 유통사 목록
  getDistributors: () =>
    api.get<{ distributors: Distributor[] }>(`${CMS_BASE}/distributors`),

  // 엑셀 업로드
  uploadSettlements: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`${CMS_BASE}/upload/settlements`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // 업로드 이력
  getUploadHistory: () =>
    api.get<{ uploads: UploadHistory[] }>(`${CMS_BASE}/upload/history`),

  // 엑셀 다운로드 (JSON 형태로 받아서 프론트에서 처리)
  exportSettlements: (startDate?: string, endDate?: string, format: 'json' | 'csv' = 'json') =>
    api.get(`${CMS_BASE}/export/settlements`, {
      params: { startDate, endDate, format },
      ...(format === 'csv' ? { responseType: 'blob' } : {}),
    }),
};

export default cmsAPI;
