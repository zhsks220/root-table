import { Question } from '../types/chatbot';

export const WELCOME_MESSAGE = '안녕하세요! 루트레이블 프로젝트 문의에 오신 것을 환영합니다.';

export const chatbotQuestions: Question[] = [
  {
    id: 'clientType',
    step: 1,
    type: 'single-select',
    message: '어떤 분이신가요?',
    subMessage: '맞춤 상담을 위해 알려주세요',
    required: true,
    options: [
      { id: 'author', label: '웹툰 작가입니다', value: 'author' },
      { id: 'platform', label: '플랫폼/제작사 담당자입니다', value: 'platform' },
      { id: 'other', label: '기타', value: 'other' },
    ],
  },
  {
    id: 'workTitle',
    step: 2,
    type: 'text-input',
    message: '어떤 작품에 음악이 필요하신가요?',
    subMessage: '작품명을 알려주세요',
    required: true,
    placeholder: '작품명을 입력해주세요',
    validation: {
      minLength: 1,
      maxLength: 100,
      errorMessage: '작품명을 입력해주세요',
    },
  },
  {
    id: 'workLink',
    step: 3,
    type: 'url-input',
    message: '작품 링크가 있으시다면 공유해주세요!',
    subMessage: '네이버웹툰, 카카오페이지 등',
    required: false,
    placeholder: 'https://...',
    skipLabel: '건너뛰기',
    validation: {
      errorMessage: '올바른 URL 형식을 입력해주세요',
    },
  },
  {
    id: 'genres',
    step: 4,
    type: 'multi-select',
    message: '작품의 장르는 무엇인가요?',
    subMessage: '여러 개 선택 가능해요',
    required: true,
    options: [
      { id: 'romance', label: '로맨스/로판', value: '로맨스/로판' },
      { id: 'action', label: '액션/무협', value: '액션/무협' },
      { id: 'fantasy', label: '판타지', value: '판타지' },
      { id: 'thriller', label: '스릴러/공포', value: '스릴러/공포' },
      { id: 'daily', label: '일상/드라마', value: '일상/드라마' },
      { id: 'bl', label: 'BL/GL', value: 'BL/GL' },
      { id: 'other', label: '기타', value: '기타' },
    ],
  },
  {
    id: 'musicTypes',
    step: 5,
    type: 'multi-select',
    message: '어떤 음악이 필요하신가요?',
    subMessage: '여러 개 선택 가능해요',
    required: true,
    options: [
      { id: 'theme', label: '캐릭터 테마곡', value: '캐릭터 테마곡' },
      { id: 'bgm', label: '장면별 BGM', value: '장면별 BGM' },
      { id: 'opening', label: '오프닝/엔딩 곡', value: '오프닝/엔딩 곡' },
      { id: 'ost', label: 'OST 앨범 전체', value: 'OST 앨범 전체' },
      { id: 'other', label: '기타/잘 모르겠어요', value: '기타' },
    ],
  },
  {
    id: 'estimatedTracks',
    step: 6,
    type: 'single-select',
    message: '대략 몇 곡 정도 필요하실 것 같으세요?',
    required: true,
    options: [
      { id: '1-3', label: '1~3곡', value: '1~3곡' },
      { id: '4-10', label: '4~10곡', value: '4~10곡' },
      { id: '10+', label: '10곡 이상', value: '10곡 이상' },
      { id: 'undecided', label: '아직 정해지지 않았어요', value: '미정' },
    ],
  },
  {
    id: 'timeline',
    step: 7,
    type: 'single-select',
    message: '희망하시는 일정이 있으신가요?',
    required: true,
    options: [
      { id: '1month', label: '1개월 이내', value: '1개월 이내' },
      { id: '1-3months', label: '1~3개월', value: '1~3개월' },
      { id: '3months+', label: '3개월 이상 여유', value: '3개월 이상' },
      { id: 'undecided', label: '아직 정해지지 않았어요', value: '미정' },
    ],
  },
  {
    id: 'budget',
    step: 8,
    type: 'single-select',
    message: '예산 범위를 알려주시면 더 정확한 제안이 가능해요.',
    subMessage: '선택사항이에요',
    required: false,
    skipLabel: '건너뛰기',
    options: [
      { id: 'under100', label: '100만원 미만', value: '100만원 미만' },
      { id: '100-300', label: '100~300만원', value: '100~300만원' },
      { id: '300-500', label: '300~500만원', value: '300~500만원' },
      { id: '500+', label: '500만원 이상', value: '500만원 이상' },
      { id: 'discuss', label: '논의 후 결정', value: '논의 후 결정' },
    ],
  },
  {
    id: 'additionalNotes',
    step: 9,
    type: 'text-input',
    message: '참고하실 레퍼런스나 특별히 원하시는 분위기가 있으신가요?',
    subMessage: '자유롭게 작성해주세요',
    required: false,
    placeholder: '예: 잔잔한 피아노 위주, 특정 곡 스타일 참고 등',
    skipLabel: '건너뛰기',
    validation: {
      maxLength: 1000,
    },
  },
  {
    id: 'contact',
    step: 10,
    type: 'contact-form',
    message: '마지막으로, 연락받으실 정보를 알려주세요!',
    subMessage: '빠른 시일 내에 연락드리겠습니다',
    required: true,
  },
];

export const COMPLETION_MESSAGE = '감사합니다! 문의가 접수되었습니다. 입력하신 이메일로 빠른 시일 내에 연락드리겠습니다.';

export const TOTAL_STEPS = chatbotQuestions.length;
