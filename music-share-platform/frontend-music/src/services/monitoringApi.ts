import api from './api';

// Overview 응답 타입
export interface OverviewResponse {
  server: {
    status: 'healthy' | 'warning' | 'critical';
    uptime: string;
    memoryUsed: string;
    memoryUsedBytes: number;
    memoryPercent: number;
  };
  database: {
    status: 'healthy' | 'warning' | 'critical';
    latency: string | null;
  };
  metrics: {
    errors24h: number;
    totalUsers: number;
    totalTracks: number;
  };
  timestamp: string;
}

// System 응답 타입
export interface SystemResponse {
  nodeVersion: string;
  platform: string;
  arch: string;
  uptime: {
    seconds: number;
    formatted: string;
  };
  memory: {
    heapUsed: string;
    heapTotal: string;
    rss: string;
    external: string;
    heapUsedBytes: number;
    heapTotalBytes: number;
    heapUsedPercent: number;
  };
  environment: string;
  pid: number;
  timestamp: string;
}

// Error 로그 타입
export interface ErrorLog {
  id: string;
  error_type: string;
  message: string;
  stack: string | null;
  endpoint: string;
  method: string;
  status_code: number;
  user_id: string | null;
  ip_address: string | null;
  created_at: string;
}

// DB 통계 타입
export interface DatabaseStats {
  tables: Array<{ table: string; count: number; error?: string }>;
  connections: {
    total: string;
    active: string;
    idle: string;
  };
  databaseSize: string;
  timestamp: string;
}

// API 통계 타입
export interface ApiStats {
  summary: {
    total_requests: string;
    avg_response_time: string;
    p95_response_time: string;
    success_count: string;
    client_error_count: string;
    server_error_count: string;
  };
  endpoints: Array<{ endpoint: string; count: string; avg_time: string }>;
  hourly: Array<{ hour: string; count: string }>;
  statusCodes: Array<{ status_code: number; count: string }>;
  period: string;
  timestamp: string;
}

// 사용자 통계 타입
export interface UserStats {
  byRole: Array<{ role: string; count: string }>;
  recentSignups7d: number;
  activeUsers24h: number;
  logins24h: number;
  recentUsers: Array<{
    id: string;
    email: string;
    name: string;
    role: string;
    created_at: string;
  }>;
  timestamp: string;
}

// 알림 규칙 타입
export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  operator: string;
  threshold: number;
  webhook_url: string | null;
  enabled: boolean;
  last_triggered_at: string | null;
  created_by: string | null;
  created_by_email: string | null;
  created_at: string;
  updated_at: string;
}

// 알림 히스토리 타입
export interface AlertHistory {
  id: string;
  alert_rule_id: string;
  alert_name: string;
  metric: string;
  metric_value: number;
  threshold: number;
  message: string;
  webhook_status: string;
  created_at: string;
}

// 모니터링 API
export const monitoringAPI = {
  // Overview
  getOverview: () => api.get<OverviewResponse>('/monitoring/overview'),

  // System
  getSystem: () => api.get<SystemResponse>('/monitoring/system'),

  // Errors
  getErrors: (params?: { limit?: number; offset?: number; status_code?: number }) =>
    api.get<{ errors: ErrorLog[]; total: number; limit: number; offset: number }>(
      '/monitoring/errors',
      { params }
    ),

  // Database
  getDatabase: () => api.get<DatabaseStats>('/monitoring/database'),

  // API Stats
  getApiStats: (params?: { period?: '1h' | '24h' | '7d' }) =>
    api.get<ApiStats>('/monitoring/api-stats', { params }),

  // Users
  getUsers: () => api.get<UserStats>('/monitoring/users'),

  // Alerts
  getAlerts: () => api.get<{ alerts: AlertRule[] }>('/monitoring/alerts'),

  createAlert: (data: {
    name: string;
    metric: string;
    operator: string;
    threshold: number;
    webhook_url?: string;
    enabled?: boolean;
  }) => api.post<{ alert: AlertRule }>('/monitoring/alerts', data),

  updateAlert: (id: string, data: Partial<AlertRule>) =>
    api.put<{ alert: AlertRule }>(`/monitoring/alerts/${id}`, data),

  deleteAlert: (id: string) => api.delete(`/monitoring/alerts/${id}`),

  getAlertHistory: (params?: { limit?: number }) =>
    api.get<{ history: AlertHistory[] }>('/monitoring/alerts/history', { params }),

  // Telegram
  getTelegramStatus: () =>
    api.get<{ configured: boolean; botToken: string | null; chatId: string | null }>('/monitoring/telegram/status'),

  testTelegram: () =>
    api.post<{ success: boolean; message?: string; error?: string }>('/monitoring/telegram/test'),
};
