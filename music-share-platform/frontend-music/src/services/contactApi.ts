import axios from 'axios';

// API URL - 랜딩페이지에서는 인증 없이 접근
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const contactApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 상담 신청 데이터 타입
export interface ContactFormData {
  name: string;
  organization?: string;
  email: string;
  workLink: string;
  message?: string;
}

// 상담 신청 응답 타입
export interface ContactSubmitResponse {
  success: boolean;
  message: string;
  inquiryId: string;
  createdAt: string;
}

// Contact API (공개)
export const contactAPI = {
  // 상담 신청 제출
  submit: (data: ContactFormData) =>
    contactApi.post<ContactSubmitResponse>('/contact', data),
};

export default contactAPI;
