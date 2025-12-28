import nodemailer from 'nodemailer';

// 이메일 발송 설정
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// 관리자 이메일 주소
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'route@routelabel.org';

// 상담 문의 알림 데이터 타입
interface ContactNotificationData {
  name: string;
  organization?: string | null;
  email: string;
  workLink: string;
  message?: string | null;
  createdAt: Date;
}

// 상담 문의 접수 알림 이메일 발송
export async function sendContactNotification(data: ContactNotificationData): Promise<boolean> {
  // SMTP 설정이 없으면 스킵
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('[Email] SMTP not configured, skipping notification email');
    return false;
  }

  const formattedDate = new Date(data.createdAt).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const mailOptions = {
    from: `"ROUTELABEL" <${process.env.SMTP_USER}>`,
    to: ADMIN_EMAIL,
    subject: `[상담 문의] ${data.name}님의 새로운 상담 신청`,
    html: `
      <div style="font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #059669, #10b981); color: white; padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">새로운 상담 신청이 접수되었습니다</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 14px;">${formattedDate}</p>
        </div>

        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151; width: 100px;">이름</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #111827;">${data.name}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151;">소속</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #111827;">${data.organization || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151;">이메일</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #111827;">
                <a href="mailto:${data.email}" style="color: #059669; text-decoration: none;">${data.email}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151;">작품 링크</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #111827;">
                <a href="${data.workLink}" target="_blank" style="color: #059669; text-decoration: none; word-break: break-all;">${data.workLink}</a>
              </td>
            </tr>
            ${data.message ? `
            <tr>
              <td style="padding: 12px 0; font-weight: 600; color: #374151; vertical-align: top;">문의 내용</td>
              <td style="padding: 12px 0; color: #111827; white-space: pre-wrap;">${data.message}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        <div style="background: #111827; color: white; padding: 20px 30px; border-radius: 0 0 12px 12px; text-align: center;">
          <p style="margin: 0; font-size: 12px; opacity: 0.7;">
            CMS에서 문의를 확인하고 응대해주세요.
          </p>
          <a href="${process.env.CMS_URL || 'https://music.routelabel.org'}/cms"
             style="display: inline-block; margin-top: 15px; padding: 10px 20px; background: #059669; color: white; text-decoration: none; border-radius: 8px; font-size: 14px;">
            CMS 바로가기
          </a>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Email] Contact notification sent to ${ADMIN_EMAIL}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send notification:', error);
    return false;
  }
}

// 이메일 연결 테스트
export async function verifyEmailConnection(): Promise<boolean> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('[Email] SMTP not configured');
    return false;
  }

  try {
    await transporter.verify();
    console.log('[Email] SMTP connection verified');
    return true;
  } catch (error) {
    console.error('[Email] SMTP connection failed:', error);
    return false;
  }
}

export default {
  sendContactNotification,
  verifyEmailConnection,
};
