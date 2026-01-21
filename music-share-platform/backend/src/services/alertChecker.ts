import { pool } from '../db';

// 환경변수에서 텔레그램 설정 로드
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// 알림 쿨다운 시간 (분) - 같은 규칙 재발동 방지
const ALERT_COOLDOWN_MINUTES = 5;

// 체크 사이클당 최대 알림 전송 수 (스팸 방지)
const MAX_ALERTS_PER_CYCLE = 2;

// 시간당 최대 알림 전송 수 (텔레그램 rate limit 방지)
const MAX_ALERTS_PER_HOUR = 10;

// 시간당 알림 카운터
let hourlyAlertCount = 0;
let hourlyResetTime = Date.now();

interface AlertRule {
  id: string;
  name: string;
  metric: string;
  operator: string;
  threshold: number;
  webhook_url: string | null;
  enabled: boolean;
  last_triggered_at: Date | null;
}

// 메트릭 값 조회 함수
async function getMetricValue(metric: string): Promise<number> {
  switch (metric) {
    case 'error_rate': {
      // 최근 10분 에러율 (%)
      const result = await pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status_code >= 500) * 100.0 / NULLIF(COUNT(*), 0) as error_rate
        FROM request_logs
        WHERE created_at > NOW() - INTERVAL '10 minutes'
      `);
      return parseFloat(result.rows[0]?.error_rate || '0');
    }

    case 'response_time': {
      // 평균 응답 시간 (ms)
      const result = await pool.query(`
        SELECT AVG(response_time) as avg_response
        FROM request_logs
        WHERE created_at > NOW() - INTERVAL '10 minutes'
      `);
      return parseFloat(result.rows[0]?.avg_response || '0');
    }

    case 'error_count': {
      // 최근 10분 에러 수 (빠른 감지)
      const result = await pool.query(`
        SELECT COUNT(*) as count
        FROM error_logs
        WHERE created_at > NOW() - INTERVAL '10 minutes'
      `);
      return parseInt(result.rows[0]?.count || '0');
    }

    case 'memory_usage': {
      // 현재 메모리 사용률 (%)
      const memoryUsage = process.memoryUsage();
      return Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100);
    }

    case 'request_count': {
      // 분당 요청 수
      const result = await pool.query(`
        SELECT COUNT(*) as count
        FROM request_logs
        WHERE created_at > NOW() - INTERVAL '1 minute'
      `);
      return parseInt(result.rows[0]?.count || '0');
    }

    default:
      return 0;
  }
}

// 조건 비교 함수
function compareValue(value: number, operator: string, threshold: number): boolean {
  switch (operator) {
    case '>': return value > threshold;
    case '<': return value < threshold;
    case '>=': return value >= threshold;
    case '<=': return value <= threshold;
    case '=': return value === threshold;
    default: return false;
  }
}

// 텔레그램 알림 전송
async function sendTelegramAlert(message: string, alertName: string): Promise<'sent' | 'failed' | 'not_configured'> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return 'not_configured';
  }

  try {
    const text = `🚨 <b>알림: ${alertName}</b>\n\n${message}\n\n⏰ ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`;

    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text,
          parse_mode: 'HTML'
        })
      }
    );

    if (response.ok) {
      console.log(`📱 Telegram alert sent: ${alertName}`);
      return 'sent';
    } else {
      const error = await response.json();
      console.error('Telegram send failed:', error);
      return 'failed';
    }
  } catch (error) {
    console.error('Telegram send error:', error);
    return 'failed';
  }
}

// 웹훅 전송 (Slack/Discord 호환)
async function sendWebhook(webhookUrl: string, message: string, alertName: string): Promise<'sent' | 'failed'> {
  try {
    // Slack 형식
    const payload = {
      text: `🚨 Alert: ${alertName}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*🚨 Alert Triggered: ${alertName}*\n${message}`
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `_Triggered at ${new Date().toISOString()}_`
            }
          ]
        }
      ]
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    return response.ok ? 'sent' : 'failed';
  } catch (error) {
    console.error('Webhook send error:', error);
    return 'failed';
  }
}

// 쿨다운 체크 (마지막 발동 후 N분 이내면 스킵)
function isInCooldown(lastTriggeredAt: Date | null): boolean {
  if (!lastTriggeredAt) return false;

  const now = new Date();
  const cooldownMs = ALERT_COOLDOWN_MINUTES * 60 * 1000;
  const timeSinceLastTrigger = now.getTime() - new Date(lastTriggeredAt).getTime();

  return timeSinceLastTrigger < cooldownMs;
}

// 알림 히스토리 저장
async function saveAlertHistory(
  alertRuleId: string,
  metricValue: number,
  threshold: number,
  message: string,
  webhookStatus: string
): Promise<void> {
  try {
    await pool.query(`
      INSERT INTO alert_history (alert_rule_id, metric_value, threshold, message, webhook_status)
      VALUES ($1, $2, $3, $4, $5)
    `, [alertRuleId, metricValue, threshold, message, webhookStatus]);

    // 알림 규칙의 last_triggered_at 업데이트
    await pool.query(`
      UPDATE alert_rules SET last_triggered_at = NOW() WHERE id = $1
    `, [alertRuleId]);
  } catch (error) {
    console.error('Save alert history error:', error);
  }
}

// 메인 체커 함수
async function checkAlerts(): Promise<void> {
  try {
    // 시간당 카운터 리셋 (1시간 지났으면)
    const now = Date.now();
    if (now - hourlyResetTime > 60 * 60 * 1000) {
      hourlyAlertCount = 0;
      hourlyResetTime = now;
    }

    // 시간당 최대 알림 수 체크
    if (hourlyAlertCount >= MAX_ALERTS_PER_HOUR) {
      console.log(`⚠️ Hourly alert limit (${MAX_ALERTS_PER_HOUR}) reached, skipping check`);
      return;
    }

    // 활성화된 알림 규칙 조회 (last_triggered_at 포함)
    const result = await pool.query(`
      SELECT id, name, metric, operator, threshold, webhook_url, enabled, last_triggered_at
      FROM alert_rules
      WHERE enabled = true
    `);

    const alerts: AlertRule[] = result.rows;
    let alertsSentThisCycle = 0; // 이번 사이클에서 전송된 알림 수

    for (const alert of alerts) {
      try {
        // 사이클당 최대 전송 수 체크
        if (alertsSentThisCycle >= MAX_ALERTS_PER_CYCLE) {
          console.log(`⚠️ Max alerts per cycle (${MAX_ALERTS_PER_CYCLE}) reached, skipping remaining`);
          break;
        }

        // 시간당 최대 알림 수 재체크
        if (hourlyAlertCount >= MAX_ALERTS_PER_HOUR) {
          console.log(`⚠️ Hourly alert limit reached during cycle`);
          break;
        }

        // 쿨다운 체크 (같은 규칙 재발동 방지)
        if (isInCooldown(alert.last_triggered_at)) {
          continue; // 쿨다운 중이면 스킵
        }

        const metricValue = await getMetricValue(alert.metric);
        const isTriggered = compareValue(metricValue, alert.operator, alert.threshold);

        if (isTriggered) {
          const metricLabel = getMetricLabel(alert.metric);
          const message = `📊 ${metricLabel}: ${metricValue}\n⚠️ 임계값: ${alert.operator} ${alert.threshold}`;
          console.log(`🚨 Alert triggered: ${alert.name} - ${alert.metric} is ${metricValue}`);

          // 텔레그램 알림 전송 (우선)
          const telegramStatus = await sendTelegramAlert(message, alert.name);

          // 웹훅 알림 전송 (설정된 경우)
          let webhookStatus = 'no_webhook';
          if (alert.webhook_url) {
            webhookStatus = await sendWebhook(alert.webhook_url, message, alert.name);
          }

          // 최종 상태 (텔레그램 > 웹훅)
          const finalStatus = telegramStatus === 'sent' ? 'telegram_sent' :
                             webhookStatus === 'sent' ? 'webhook_sent' :
                             telegramStatus === 'not_configured' && webhookStatus === 'no_webhook' ? 'no_notification' :
                             'failed';

          await saveAlertHistory(
            alert.id,
            metricValue,
            alert.threshold,
            message,
            finalStatus
          );

          // 알림 전송 카운트 증가
          alertsSentThisCycle++;
          hourlyAlertCount++;
        }
      } catch (error) {
        console.error(`Error checking alert ${alert.name}:`, error);
      }
    }

    if (alertsSentThisCycle > 0) {
      console.log(`📬 ${alertsSentThisCycle} alert(s) sent this cycle (hourly: ${hourlyAlertCount}/${MAX_ALERTS_PER_HOUR})`);
    }
  } catch (error) {
    console.error('Alert checker error:', error);
  }
}

// 메트릭 라벨 (한국어)
function getMetricLabel(metric: string): string {
  switch (metric) {
    case 'error_rate': return '에러율 (%)';
    case 'response_time': return '평균 응답시간 (ms)';
    case 'error_count': return '에러 수';
    case 'memory_usage': return '메모리 사용률 (%)';
    case 'request_count': return '분당 요청 수';
    default: return metric;
  }
}

// 알림 체커 시작 (1분 간격)
let alertInterval: NodeJS.Timeout | null = null;

export function startAlertChecker(): void {
  // 이미 실행 중이면 중복 시작 방지
  if (alertInterval) {
    console.log('⚠️ Alert checker already running');
    return;
  }

  console.log('🔔 Starting alert checker (interval: 1 minute)');

  // 초기 실행 (10초 후)
  setTimeout(() => {
    checkAlerts();
  }, 10000);

  // 1분마다 실행
  alertInterval = setInterval(() => {
    checkAlerts();
  }, 60000);
}

export function stopAlertChecker(): void {
  if (alertInterval) {
    clearInterval(alertInterval);
    alertInterval = null;
    console.log('🔕 Alert checker stopped');
  }
}

export { checkAlerts };
