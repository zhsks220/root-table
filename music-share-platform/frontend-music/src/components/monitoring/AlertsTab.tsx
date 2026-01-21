import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { monitoringAPI, AlertRule, AlertHistory } from '../../services/monitoringApi';
import {
  Bell, Plus, Trash2, Edit, Clock, AlertTriangle, Activity, Zap, HardDrive, ChevronDown, ChevronUp,
  Send, CheckCircle, XCircle, Loader2
} from 'lucide-react';

const METRICS = [
  { value: 'error_rate', label: '에러율 (%)', icon: AlertTriangle },
  { value: 'response_time', label: '응답시간 (ms)', icon: Zap },
  { value: 'memory_usage', label: '메모리 사용량 (%)', icon: HardDrive },
  { value: 'request_count', label: '요청 수', icon: Activity },
];

const OPERATORS = [
  { value: '>', label: '>' },
  { value: '<', label: '<' },
  { value: '>=', label: '>=' },
  { value: '<=', label: '<=' },
  { value: '=', label: '=' },
];

export default function AlertsTab() {
  const [alerts, setAlerts] = useState<AlertRule[]>([]);
  const [history, setHistory] = useState<AlertHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // 텔레그램 상태
  const [telegramStatus, setTelegramStatus] = useState<{
    configured: boolean;
    botToken: string | null;
    chatId: string | null;
  } | null>(null);
  const [telegramTesting, setTelegramTesting] = useState(false);
  const [telegramTestResult, setTelegramTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    metric: 'error_rate',
    operator: '>',
    threshold: 10,
    webhook_url: '',
    enabled: true,
  });

  useEffect(() => {
    fetchData();
    fetchTelegramStatus();
  }, []);

  const fetchTelegramStatus = async () => {
    try {
      const res = await monitoringAPI.getTelegramStatus();
      setTelegramStatus(res.data);
    } catch (err) {
      console.error('Failed to fetch telegram status:', err);
    }
  };

  const handleTelegramTest = async () => {
    setTelegramTesting(true);
    setTelegramTestResult(null);
    try {
      const res = await monitoringAPI.testTelegram();
      setTelegramTestResult({
        success: res.data.success,
        message: res.data.message || res.data.error || ''
      });
    } catch (err: any) {
      setTelegramTestResult({
        success: false,
        message: err.response?.data?.error || '전송 실패'
      });
    } finally {
      setTelegramTesting(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [alertsRes, historyRes] = await Promise.all([
        monitoringAPI.getAlerts(),
        monitoringAPI.getAlertHistory({ limit: 20 }),
      ]);
      setAlerts(alertsRes.data.alerts);
      setHistory(historyRes.data.history);
      setError(null);
    } catch (err) {
      setError('알림 설정을 불러오는 데 실패했습니다');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await monitoringAPI.updateAlert(editingId, formData);
      } else {
        await monitoringAPI.createAlert(formData);
      }
      setShowForm(false);
      setEditingId(null);
      resetForm();
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (alert: AlertRule) => {
    setFormData({
      name: alert.name,
      metric: alert.metric,
      operator: alert.operator,
      threshold: alert.threshold,
      webhook_url: alert.webhook_url || '',
      enabled: alert.enabled,
    });
    setEditingId(alert.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 알림 규칙을 삭제하시겠습니까?')) return;
    try {
      await monitoringAPI.deleteAlert(id);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggle = async (alert: AlertRule) => {
    try {
      await monitoringAPI.updateAlert(alert.id, { enabled: !alert.enabled });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      metric: 'error_rate',
      operator: '>',
      threshold: 10,
      webhook_url: '',
      enabled: true,
    });
  };

  const getMetricLabel = (metric: string) => {
    return METRICS.find((m) => m.value === metric)?.label || metric;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-gray-700/50 border-t-emerald-500 animate-spin" />
            <Bell className="w-6 h-6 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <span className="text-gray-400 text-sm">알림 설정 로딩 중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-red-400 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 텔레그램 알림 설정 */}
      <div className="rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2.5 rounded-xl',
              telegramStatus?.configured ? 'bg-emerald-500/20' : 'bg-gray-700/50'
            )}>
              <Send className={cn(
                'w-5 h-5',
                telegramStatus?.configured ? 'text-emerald-400' : 'text-gray-500'
              )} />
            </div>
            <div>
              <h3 className="text-white font-semibold">텔레그램 알림</h3>
              {telegramStatus?.configured ? (
                <p className="text-emerald-400 text-xs flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  연결됨 (Chat ID: {telegramStatus.chatId})
                </p>
              ) : (
                <p className="text-gray-500 text-xs flex items-center gap-1">
                  <XCircle className="w-3 h-3" />
                  미설정 - 환경변수 필요
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleTelegramTest}
            disabled={!telegramStatus?.configured || telegramTesting}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
              telegramStatus?.configured
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/25'
                : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
            )}
          >
            {telegramTesting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                전송 중...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                테스트 전송
              </>
            )}
          </button>
        </div>

        {/* 테스트 결과 */}
        {telegramTestResult && (
          <div className={cn(
            'mt-4 p-3 rounded-xl text-sm flex items-center gap-2',
            telegramTestResult.success
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          )}>
            {telegramTestResult.success ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 flex-shrink-0" />
            )}
            {telegramTestResult.message}
          </div>
        )}
      </div>

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20">
            <Bell className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold">알림 규칙</h2>
            <p className="text-gray-500 text-xs">{alerts.length}개 설정됨</p>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingId(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm font-medium hover:from-emerald-700 hover:to-emerald-600 transition-all shadow-lg shadow-emerald-500/25"
        >
          <Plus className="w-4 h-4" />
          규칙 추가
        </button>
      </div>

      {/* 알림 폼 */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 p-5"
        >
          <h3 className="text-white font-semibold mb-4">
            {editingId ? '알림 규칙 수정' : '새 알림 규칙'}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-xs font-medium">이름</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="예: 높은 에러율 경고"
                className="w-full mt-1 px-4 py-2.5 rounded-xl bg-gray-700/50 border border-gray-600/50 text-white placeholder-gray-500 text-sm focus:border-emerald-500/50 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-gray-400 text-xs font-medium">메트릭</label>
                <select
                  value={formData.metric}
                  onChange={(e) => setFormData({ ...formData, metric: e.target.value })}
                  className="w-full mt-1 px-4 py-2.5 rounded-xl bg-gray-700/50 border border-gray-600/50 text-white text-sm focus:border-emerald-500/50 focus:outline-none"
                >
                  {METRICS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-gray-400 text-xs font-medium">연산자</label>
                <select
                  value={formData.operator}
                  onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                  className="w-full mt-1 px-4 py-2.5 rounded-xl bg-gray-700/50 border border-gray-600/50 text-white text-sm focus:border-emerald-500/50 focus:outline-none"
                >
                  {OPERATORS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-gray-400 text-xs font-medium">임계값</label>
                <input
                  type="number"
                  value={formData.threshold}
                  onChange={(e) => setFormData({ ...formData, threshold: parseFloat(e.target.value) })}
                  required
                  className="w-full mt-1 px-4 py-2.5 rounded-xl bg-gray-700/50 border border-gray-600/50 text-white text-sm focus:border-emerald-500/50 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-gray-400 text-xs font-medium">웹훅 URL (Slack/Discord)</label>
              <input
                type="url"
                value={formData.webhook_url}
                onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                placeholder="https://hooks.slack.com/..."
                className="w-full mt-1 px-4 py-2.5 rounded-xl bg-gray-700/50 border border-gray-600/50 text-white placeholder-gray-500 text-sm focus:border-emerald-500/50 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enabled"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="rounded bg-gray-700 border-gray-600"
              />
              <label htmlFor="enabled" className="text-gray-300 text-sm">활성화</label>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm font-medium hover:from-emerald-700 hover:to-emerald-600 transition-all"
              >
                {editingId ? '수정' : '생성'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  resetForm();
                }}
                className="px-6 py-2.5 rounded-xl bg-gray-700/50 text-gray-300 text-sm font-medium hover:bg-gray-600/50 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 알림 규칙 목록 */}
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 p-8 text-center">
            <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">설정된 알림 규칙이 없습니다</p>
            <p className="text-gray-500 text-sm mt-1">위의 버튼을 클릭하여 새 규칙을 추가하세요</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className="rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggle(alert)}
                    className={cn(
                      'w-12 h-7 rounded-full relative transition-colors',
                      alert.enabled ? 'bg-emerald-500' : 'bg-gray-700'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-1 w-5 h-5 rounded-full bg-white transition-transform shadow-lg',
                        alert.enabled ? 'left-6' : 'left-1'
                      )}
                    />
                  </button>
                  <span className="text-white font-medium">{alert.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(alert)}
                    className="p-2 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(alert.id)}
                    className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="text-sm px-4 py-2.5 rounded-xl bg-gray-700/30 font-mono text-gray-300">
                {getMetricLabel(alert.metric)} {alert.operator} {alert.threshold}
              </div>

              {alert.webhook_url && (
                <p className="text-xs text-gray-500 mt-2 truncate">
                  웹훅: {alert.webhook_url}
                </p>
              )}

              {alert.last_triggered_at && (
                <p className="text-xs text-emerald-400 mt-1">
                  마지막 발동: {new Date(alert.last_triggered_at).toLocaleString('ko-KR')}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* 알림 히스토리 */}
      <div className="rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 overflow-hidden">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-700/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-gray-400" />
            <span className="text-white font-medium">알림 히스토리</span>
            <span className="text-gray-500 text-sm">({history.length})</span>
          </div>
          {showHistory ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {showHistory && (
          <div className="border-t border-gray-700/50">
            {history.length === 0 ? (
              <p className="p-6 text-gray-500 text-center">알림 히스토리가 없습니다</p>
            ) : (
              <div className="divide-y divide-gray-700/50">
                {history.map((h) => (
                  <div key={h.id} className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-medium">{h.alert_name}</span>
                      <span className={cn(
                        'text-xs px-2 py-1 rounded-lg',
                        h.webhook_status === 'sent'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : h.webhook_status === 'failed'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-gray-500/20 text-gray-400'
                      )}>
                        {h.webhook_status === 'sent' ? '전송됨' : h.webhook_status === 'failed' ? '실패' : '없음'}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">{h.message}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      {new Date(h.created_at).toLocaleString('ko-KR')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
