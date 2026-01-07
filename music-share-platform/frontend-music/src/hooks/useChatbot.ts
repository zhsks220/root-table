import { useState, useCallback, useMemo, useRef } from 'react';
import {
  ChatMessage,
  ChatbotStatus,
  ChatbotInquiryData,
  ContactFormData,
  UseChatbotReturn,
} from '../types/chatbot';
import {
  chatbotQuestions,
  WELCOME_MESSAGE,
  COMPLETION_MESSAGE,
  TOTAL_STEPS,
} from '../data/chatbotQuestions';
import { contactAPI } from '../services/contactApi';

const generateId = () => Math.random().toString(36).substring(2, 9);
const generateSessionId = () => `session_${Date.now()}_${generateId()}`;

export const useChatbot = (): UseChatbotReturn => {
  const [status, setStatus] = useState<ChatbotStatus>('idle');
  const [currentStep, setCurrentStep] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [responses, setResponses] = useState<Record<string, string | string[]>>({});
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId] = useState(generateSessionId);

  // 최신 responses를 참조하기 위한 ref
  const responsesRef = useRef(responses);
  responsesRef.current = responses;

  const currentQuestion = useMemo(() => {
    if (currentStep === 0 || currentStep > TOTAL_STEPS) return null;
    return chatbotQuestions[currentStep - 1];
  }, [currentStep]);

  // 봇 메시지 추가 (타이핑 효과)
  const addBotMessage = useCallback(async (content: string, subContent?: string) => {
    setIsTyping(true);

    // 타이핑 딜레이
    await new Promise(resolve => setTimeout(resolve, 500));

    setMessages(prev => [
      ...prev,
      {
        id: generateId(),
        type: 'bot',
        content: subContent ? `${content}\n${subContent}` : content,
        timestamp: new Date(),
      },
    ]);

    setIsTyping(false);
  }, []);

  // 사용자 메시지 추가
  const addUserMessage = useCallback((content: string) => {
    setMessages(prev => [
      ...prev,
      {
        id: generateId(),
        type: 'user',
        content,
        timestamp: new Date(),
      },
    ]);
  }, []);

  // 다음 질문으로 이동
  const goToNextQuestion = useCallback(async () => {
    const nextStep = currentStep + 1;

    if (nextStep > TOTAL_STEPS) {
      // 완료
      await addBotMessage(COMPLETION_MESSAGE);
      setStatus('success');
      return;
    }

    setCurrentStep(nextStep);
    const nextQuestion = chatbotQuestions[nextStep - 1];
    await addBotMessage(nextQuestion.message, nextQuestion.subMessage);
  }, [currentStep, addBotMessage]);

  // 채팅 시작
  const startChat = useCallback(async () => {
    setStatus('chatting');
    setMessages([]);
    setResponses({});
    setCurrentStep(0);
    setError(null);

    // 환영 메시지
    await addBotMessage(WELCOME_MESSAGE);

    // 첫 번째 질문
    setCurrentStep(1);
    const firstQuestion = chatbotQuestions[0];
    await addBotMessage(firstQuestion.message, firstQuestion.subMessage);
  }, [addBotMessage]);

  // 옵션 선택 (단일/다중)
  const selectOption = useCallback(async (value: string | string[]) => {
    if (!currentQuestion) return;

    // 사용자 메시지 표시
    const displayValue = Array.isArray(value) ? value.join(', ') : value;
    const option = currentQuestion.options?.find(o => o.value === value);
    addUserMessage(option?.label || displayValue);

    // 응답 저장
    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: value,
    }));

    // 다음 질문
    await goToNextQuestion();
  }, [currentQuestion, addUserMessage, goToNextQuestion]);

  // 텍스트 제출
  const submitText = useCallback(async (value: string) => {
    if (!currentQuestion) return;

    // 유효성 검사
    if (currentQuestion.required && !value.trim()) {
      setError(currentQuestion.validation?.errorMessage || '필수 항목입니다');
      return;
    }

    if (currentQuestion.type === 'url-input' && value.trim()) {
      try {
        new URL(value);
      } catch {
        setError('올바른 URL 형식을 입력해주세요');
        return;
      }
    }

    setError(null);
    addUserMessage(value || '(건너뜀)');

    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: value,
    }));

    await goToNextQuestion();
  }, [currentQuestion, addUserMessage, goToNextQuestion]);

  // 연락처 폼 제출 (마지막 단계 - API 호출 포함)
  const submitContactForm = useCallback(async (data: ContactFormData) => {
    if (!currentQuestion) return;

    // 유효성 검사
    if (!data.name.trim()) {
      setError('이름을 입력해주세요');
      return;
    }

    if (!data.email.trim()) {
      setError('이메일을 입력해주세요');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      setError('올바른 이메일 형식을 입력해주세요');
      return;
    }

    setError(null);
    addUserMessage(`${data.name} / ${data.email}${data.organization ? ` / ${data.organization}` : ''}`);

    // responses 업데이트
    const currentResponses = responsesRef.current;
    setResponses({
      ...currentResponses,
      name: data.name,
      email: data.email,
      organization: data.organization || '',
    });

    // API 제출
    setStatus('submitting');
    setIsTyping(true);

    try {
      await contactAPI.submitChatbot({
        clientType: (currentResponses.clientType as string) || '',
        workTitle: (currentResponses.workTitle as string) || '',
        workLink: (currentResponses.workLink as string) || undefined,
        genres: (currentResponses.genres as string[]) || [],
        musicTypes: (currentResponses.musicTypes as string[]) || [],
        estimatedTracks: (currentResponses.estimatedTracks as string) || '',
        timeline: (currentResponses.timeline as string) || '',
        budget: (currentResponses.budget as string) || undefined,
        additionalNotes: (currentResponses.additionalNotes as string) || undefined,
        name: data.name,
        email: data.email,
        organization: data.organization,
        sessionId,
      });

      // 성공 메시지
      await addBotMessage(COMPLETION_MESSAGE);
      setStatus('success');
    } catch (err) {
      console.error('Chatbot submission error:', err);
      setError('문의 제출 중 오류가 발생했습니다. 다시 시도해주세요.');
      setStatus('chatting');
      setIsTyping(false);
    }
  }, [currentQuestion, addUserMessage, addBotMessage, sessionId]);

  // 질문 건너뛰기
  const skipQuestion = useCallback(async () => {
    if (!currentQuestion || currentQuestion.required) return;

    addUserMessage('(건너뜀)');

    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: '',
    }));

    await goToNextQuestion();
  }, [currentQuestion, addUserMessage, goToNextQuestion]);

  // 초기화
  const reset = useCallback(() => {
    setStatus('idle');
    setCurrentStep(0);
    setMessages([]);
    setResponses({});
    setIsTyping(false);
    setError(null);
  }, []);

  // 완료된 문의 데이터
  const inquiryData = useMemo((): ChatbotInquiryData | null => {
    if (status !== 'success') return null;

    return {
      clientType: responses.clientType as string || '',
      workTitle: responses.workTitle as string || '',
      workLink: responses.workLink as string || undefined,
      genres: (responses.genres as string[]) || [],
      musicTypes: (responses.musicTypes as string[]) || [],
      estimatedTracks: responses.estimatedTracks as string || '',
      timeline: responses.timeline as string || '',
      budget: responses.budget as string || undefined,
      additionalNotes: responses.additionalNotes as string || undefined,
      name: responses.name as string || '',
      email: responses.email as string || '',
      organization: responses.organization as string || undefined,
      sessionId,
      createdAt: new Date(),
    };
  }, [status, responses, sessionId]);

  return {
    status,
    currentStep,
    totalSteps: TOTAL_STEPS,
    messages,
    responses,
    isTyping,
    error,
    startChat,
    selectOption,
    submitText,
    submitContactForm,
    skipQuestion,
    reset,
    currentQuestion,
    inquiryData,
  };
};
