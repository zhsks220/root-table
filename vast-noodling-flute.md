# Typeform 스타일 멀티스텝 문의 폼 구현 계획

## 개요
루트레이블 랜딩페이지의 문의하기를 Typeform 스타일의 별도 페이지(`/inquiry`)로 직접 구현
- Typeform 구독료 절감 ($29~59/월)
- 100% 브랜드 커스터마이징
- 데이터 직접 관리

---

## 작업 목록 (체크리스트)

### Phase 1: 기반 구조 (프론트엔드)
- [ ] 1.1 `inquiryStore.ts` 생성 - zustand 상태 관리
- [ ] 1.2 `InquiryPage.tsx` 생성 - 페이지 컴포넌트
- [ ] 1.3 `App.tsx`에 `/inquiry` 라우트 추가
- [ ] 1.4 `contactApi.ts` 타입 확장

### Phase 2: 폼 컨테이너 컴포넌트
- [ ] 2.1 `InquiryForm.tsx` - 메인 컨테이너 + AnimatePresence
- [ ] 2.2 `InquiryProgress.tsx` - 상단 진행률 바
- [ ] 2.3 `InquiryNavigation.tsx` - 이전/다음 버튼
- [ ] 2.4 `InquiryComplete.tsx` - 제출 완료 화면

### Phase 3: 스텝 컴포넌트
- [ ] 3.1 `StepName.tsx` - 이름/필명 입력
- [ ] 3.2 `StepOrganization.tsx` - 소속/회사 입력 (선택)
- [ ] 3.3 `StepEmail.tsx` - 이메일 입력
- [ ] 3.4 `StepProjectType.tsx` - 프로젝트 유형 선택 (그리드 카드)
- [ ] 3.5 `StepMusicStyle.tsx` - 음악 스타일 선택 (태그 다중선택)
- [ ] 3.6 `StepWorkLink.tsx` - 작품 링크 입력
- [ ] 3.7 `StepMessage.tsx` - 추가 메시지 (선택)
- [ ] 3.8 `StepConfirm.tsx` - 입력 내용 확인 + 제출

### Phase 4: 백엔드 확장
- [ ] 4.1 DB 마이그레이션 SQL 작성 및 실행
- [ ] 4.2 `contact.ts` API 라우트 수정 (새 필드 처리)
- [ ] 4.3 검증 로직 추가

### Phase 5: 연결 및 마무리
- [ ] 5.1 기존 Contact 컴포넌트 → `/inquiry` 링크로 변경
- [ ] 5.2 Hero 섹션 CTA 버튼 링크 수정
- [ ] 5.3 FloatingCTA 링크 수정
- [ ] 5.4 반응형 테스트 (모바일/데스크톱)
- [ ] 5.5 키보드 네비게이션 테스트

---

## 수집할 정보 (8 Steps)

| Step | 필드 | 필수 | UI 타입 |
|------|------|------|---------|
| 1 | 이름/필명 | ✅ | 텍스트 입력 |
| 2 | 소속/회사 | ❌ | 텍스트 입력 |
| 3 | 이메일 | ✅ | 이메일 입력 |
| 4 | 프로젝트 유형 | ✅ | 그리드 카드 선택 |
| 5 | 음악 스타일 | ❌ | 태그 다중선택 |
| 6 | 작품 링크 | ✅ | URL 입력 |
| 7 | 추가 메시지 | ❌ | 텍스트에어리어 |
| 8 | 확인 및 제출 | - | 요약 + 버튼 |

### 프로젝트 유형 옵션
- 웹툰
- 영화/드라마
- 광고
- 유튜브
- 게임
- 팟캐스트
- 기타 (직접 입력)

### 음악 스타일 옵션
**장르:** 오케스트라, 일렉트로닉, 힙합/R&B, 록/메탈, 재즈, 어쿠스틱, 앰비언트, K-POP
**분위기:** 긴장감, 희망적, 감성적, 웅장함, 신비로움, 코믹, 공포, 액션

---

## 파일 구조

### 신규 생성 (12개 파일)
```
frontend-music/src/
├── pages/
│   └── InquiryPage.tsx
├── store/
│   └── inquiryStore.ts
└── components/inquiry/
    ├── InquiryForm.tsx
    ├── InquiryProgress.tsx
    ├── InquiryNavigation.tsx
    ├── InquiryComplete.tsx
    └── steps/
        ├── StepName.tsx
        ├── StepOrganization.tsx
        ├── StepEmail.tsx
        ├── StepProjectType.tsx
        ├── StepMusicStyle.tsx
        ├── StepWorkLink.tsx
        ├── StepMessage.tsx
        └── StepConfirm.tsx
```

### 수정 필요 (5개 파일)
```
frontend-music/src/App.tsx              # 라우트 추가
frontend-music/src/services/contactApi.ts   # 타입 확장
frontend-music/src/components/landing/Contact.tsx  # 링크 변경
backend/src/routes/contact.ts           # 새 필드 처리
backend/src/db/contact-schema.sql       # 컬럼 추가
```

---

## 상세 구현 명세

### 1. inquiryStore.ts (Zustand)
```typescript
interface InquiryFormData {
  name: string;
  organization: string;
  email: string;
  projectType: string;
  projectTypeOther: string;
  musicGenres: string[];
  musicMoods: string[];
  musicNote: string;
  workLink: string;
  message: string;
}

interface InquiryState {
  currentStep: number;
  totalSteps: 8;
  formData: InquiryFormData;
  direction: 1 | -1;  // 애니메이션 방향
  status: 'idle' | 'submitting' | 'success' | 'error';

  // Actions
  nextStep: () => void;
  prevStep: () => void;
  updateField: (field, value) => void;
  submit: () => Promise<void>;
  reset: () => void;
}
```

### 2. DB 마이그레이션
```sql
ALTER TABLE contact_inquiries
ADD COLUMN project_type VARCHAR(50),
ADD COLUMN project_type_other VARCHAR(200),
ADD COLUMN music_genres TEXT[],
ADD COLUMN music_moods TEXT[],
ADD COLUMN music_note TEXT;

CREATE INDEX idx_contact_project_type ON contact_inquiries(project_type);
```

### 3. 애니메이션 설정 (Framer Motion)
```typescript
const variants = {
  enter: (direction) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction) => ({
    x: direction > 0 ? -100 : 100,
    opacity: 0
  })
};
```

### 4. 키보드 단축키
- `Enter` → 다음 스텝 (유효성 통과 시)
- `Shift + Enter` → textarea 줄바꿈
- `Escape` → 이전 스텝
- `Tab` → 포커스 이동

---

## UI/UX 상세

### 레이아웃 구조
```
┌─────────────────────────────────────┐
│ ProgressBar (상단 고정)              │
├─────────────────────────────────────┤
│                                     │
│   Step Number (1 →)                 │
│                                     │
│   질문 텍스트                        │
│   (큰 폰트, 볼드)                    │
│                                     │
│   부가 설명 (작은 폰트)              │
│                                     │
│   [ 입력 필드 / 선택 카드 ]          │
│                                     │
│   Enter ↵ 눌러서 계속                │
│                                     │
├─────────────────────────────────────┤
│ ← 이전    [확인] 또는 다음 →         │
└─────────────────────────────────────┘
```

### 색상 (루트레이블 브랜드)
- Primary: `emerald-500` (#10b981)
- Background: 다크모드 기준 `zinc-900`
- Text: `white`, `white/50`, `white/30`
- Border: `white/10`, 선택 시 `emerald-500`

### 반응형
- **모바일**: padding 줄임, 버튼 하단 고정, 터치 영역 44px+
- **데스크톱**: max-width 640px, 중앙 정렬

---

## 핵심 파일 경로

**프론트엔드**
- `frontend-music/src/App.tsx`
- `frontend-music/src/services/contactApi.ts`
- `frontend-music/src/components/landing/Contact.tsx`
- `frontend-music/src/components/landing/Hero.tsx`
- `frontend-music/src/components/landing/FloatingCTA.tsx`

**백엔드**
- `backend/src/routes/contact.ts`
- `backend/src/db/contact-schema.sql`

**참고 패턴**
- `frontend-music/src/components/PageTransition.tsx` (애니메이션)
- `frontend-music/src/store/authStore.ts` (zustand 패턴)

---

## 예상 소요 시간
- Phase 1: 30분
- Phase 2: 1시간
- Phase 3: 2시간
- Phase 4: 30분
- Phase 5: 30분
- **총 예상: 4~5시간**
