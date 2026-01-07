// 챗봇 문의 시스템 타입 정의

// 질문 타입
export type QuestionType =
  | 'single-select'   // 단일 선택
  | 'multi-select'    // 다중 선택
  | 'text-input'      // 텍스트 입력
  | 'url-input'       // URL 입력
  | 'email-input'     // 이메일 입력
  | 'contact-form';   // 연락처 폼 (이름, 이메일, 소속)

// 질문 옵션
export interface QuestionOption {
  id: string;
  label: string;
  value: string;
}

// 질문 정의
export interface Question {
  id: string;
  step: number;
  type: QuestionType;
  message: string;
  subMessage?: string;
  options?: QuestionOption[];
  required: boolean;
  placeholder?: string;
  skipLabel?: string;
  validation?: {
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
    errorMessage?: string;
  };
}

// 사용자 응답
export interface UserResponse {
  questionId: string;
  value: string | string[];
  timestamp: Date;
}

// 채팅 메시지
export interface ChatMessage {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

// 연락처 폼 데이터
export interface ContactFormData {
  name: string;
  email: string;
  organization?: string;
}

// 전체 문의 데이터
export interface ChatbotInquiryData {
  clientType: string;
  workTitle: string;
  workLink?: string;
  genres: string[];
  musicTypes: string[];
  estimatedTracks: string;
  timeline: string;
  budget?: string;
  additionalNotes?: string;
  name: string;
  email: string;
  organization?: string;
  sessionId: string;
  createdAt: Date;
}

// 챗봇 상태
export type ChatbotStatus =
  | 'idle'
  | 'chatting'
  | 'submitting'
  | 'success'
  | 'error';

// useChatbot 훅 반환 타입
export interface UseChatbotReturn {
  // 상태
  status: ChatbotStatus;
  currentStep: number;
  totalSteps: number;
  messages: ChatMessage[];
  responses: Record<string, string | string[]>;
  isTyping: boolean;
  error: string | null;

  // 액션
  startChat: () => void;
  selectOption: (value: string | string[]) => void;
  submitText: (value: string) => void;
  submitContactForm: (data: ContactFormData) => void;
  skipQuestion: () => void;
  reset: () => void;

  // 현재 질문
  currentQuestion: Question | null;

  // 완료 데이터
  inquiryData: ChatbotInquiryData | null;
}
