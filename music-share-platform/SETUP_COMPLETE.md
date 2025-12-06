# 다중 도메인 음원 공유 플랫폼 - 설정 완료

## 🎉 구성 완료

3개의 독립적인 프론트엔드와 1개의 백엔드 API로 분리된 아키텍처가 완성되었습니다.

## 🌐 서버 구성

| 서비스 | 포트 | URL | 용도 |
|--------|------|-----|------|
| **메인 사이트** | 3000 | http://localhost:3000 | 회사 랜딩 페이지 (공개) |
| **백엔드 API** | 3001 | http://localhost:3001 | REST API 서버 |
| **음원 사이트** | 3002 | http://localhost:3002 | 음원 다운로드 (초대 전용) |
| **관리자 사이트** | 3003 | http://localhost:3003 | 관리자 대시보드 (관리자 전용) |

## 📂 프로젝트 구조

```
music-share-platform/
├── backend/                    # Node.js + Express + PostgreSQL
│   ├── src/
│   │   ├── routes/            # API 라우트
│   │   ├── middleware/        # 인증 미들웨어
│   │   ├── services/          # S3, 파일 관리
│   │   └── db/                # 데이터베이스 스키마
│   └── uploads/               # 로컬 음원 파일 (5개 더미 음원)
│
├── frontend-main/             # 메인 랜딩 사이트 (포트 3000)
│   └── src/
│       └── App.tsx            # 회사 소개 페이지
│
├── frontend-music/            # 음원 다운로드 사이트 (포트 3002)
│   └── src/
│       ├── pages/
│       │   ├── LoginPage.tsx
│       │   ├── RegisterPage.tsx  (초대 코드 필수)
│       │   ├── InvitePage.tsx
│       │   └── MyTracksPage.tsx  (재생/다운로드)
│       └── store/authStore.ts
│
└── frontend-admin/            # 관리자 사이트 (포트 3003)
    └── src/
        └── pages/
            ├── LoginPage.tsx
            └── AdminPage.tsx  (음원 업로드/초대 생성)
```

## 🔐 보안 구조

### 1. **메인 사이트** (localhost:3000)
- 완전히 공개된 랜딩 페이지
- 음원 사이트나 관리자 사이트로의 링크 없음
- 회사 정보만 표시

### 2. **음원 다운로드 사이트** (localhost:3002)
- 초대 링크를 통해서만 접근 가능
- 초대 코드 없이는 회원가입 불가
- 로그인 후 할당된 음원만 접근 가능
- 재생 및 다운로드 기능

### 3. **관리자 사이트** (localhost:3003)
- 관리자 계정만 접근 가능
- 음원 업로드 기능
- 초대 링크 생성 및 관리
- 사용자 관리

## 🎵 더미 음원

5개의 더미 음원이 데이터베이스에 추가되었습니다:

1. **Summer Breeze** - The Acoustic Band (3:00)
2. **Night Drive** - Electric Dreams (4:00)
3. **Mountain Echo** - Nature Sounds (3:30)
4. **Coffee Shop Jazz** - Jazz Trio (3:15)
5. **Electronic Pulse** - Synth Wave (3:45)

파일 위치: `backend/uploads/track_1.mp3 ~ track_5.mp3`

## 👤 기본 계정

**관리자 계정**:
- Email: admin@test.com
- Password: admin123

## 🚀 서버 시작 방법

### 현재 실행 중인 서버:
```bash
✅ 메인 사이트:       http://localhost:3000
✅ 백엔드 API:        http://localhost:3001
✅ 음원 사이트:       http://localhost:3002
✅ 관리자 사이트:     http://localhost:3003
```

### 서버 재시작이 필요한 경우:

```bash
# 백엔드 (터미널 1)
cd backend
export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
npm run dev

# 메인 사이트 (터미널 2)
cd frontend-main
npm run dev

# 음원 사이트 (터미널 3)
cd frontend-music
npm run dev

# 관리자 사이트 (터미널 4)
cd frontend-admin
npm run dev
```

## 📝 사용 시나리오

### 시나리오 1: 관리자가 음원 업로드 및 초대 생성

1. http://localhost:3003 접속
2. admin@test.com / admin123 로 로그인
3. 음원 업로드 (제목, 아티스트, 앨범, 파일)
4. API를 통해 초대 생성:
   ```bash
   curl -X POST http://localhost:3001/api/admin/invitations \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "trackIds": ["TRACK_UUID_1", "TRACK_UUID_2"],
       "expiresInDays": 30
     }'
   ```
5. 생성된 초대 코드를 사용자에게 전달

### 시나리오 2: 사용자가 초대 링크로 가입

1. 관리자로부터 받은 링크: http://localhost:3002/invite/ABC123XYZ
2. 초대 검증 페이지에서 자동으로 회원가입 페이지로 이동 (3초 후)
3. 이메일, 비밀번호, 이름 입력하여 회원가입
4. 자동 로그인 후 할당된 음원 확인
5. 음원 재생 및 다운로드

### 시나리오 3: 사용자가 음원 재생/다운로드

1. http://localhost:3002 접속
2. 이메일/비밀번호로 로그인
3. "내 음원" 페이지에서 할당된 음원 목록 확인
4. 재생 버튼: 스트리밍 재생 (1시간 유효)
5. 다운로드 버튼: 파일 다운로드 (15분 유효)

## 🔧 주요 기능

### 백엔드 API
- ✅ JWT 인증 (7일 만료)
- ✅ 초대 코드 검증 시스템
- ✅ 로컬 파일 저장 (개발) / S3 (프로덕션)
- ✅ Pre-signed URL (스트리밍/다운로드)
- ✅ CORS 설정 (3개 프론트엔드 허용)
- ✅ 다운로드 로그 기록

### 프론트엔드
- ✅ React + TypeScript
- ✅ Zustand 상태 관리 (로컬 스토리지 지속)
- ✅ Tailwind CSS 스타일링
- ✅ Responsive 디자인
- ✅ 역할 기반 접근 제어

### 데이터베이스
- ✅ PostgreSQL 15
- ✅ UUID 기본 키
- ✅ 관계형 데이터 모델
- ✅ 인덱스 최적화
- ✅ Trigger를 통한 자동 updated_at

## 🎯 다음 단계

### 개발 단계
1. 관리자 페이지에서 초대 생성 UI 추가
2. 사용자 관리 페이지 구현
3. 다운로드 통계 대시보드
4. 음원 재생 플레이어 개선

### 배포 단계
1. **프론트엔드**: Vercel 또는 Netlify
   - frontend-main → example.com
   - frontend-music → music.example.com (또는 숨겨진 도메인)
   - frontend-admin → admin-xyz123.com (완전히 다른 도메인)

2. **백엔드**: AWS EC2, ECS, 또는 Railway
   - api.example.com

3. **데이터베이스**: AWS RDS 또는 Supabase
   - PostgreSQL 인스턴스

4. **파일 저장소**: AWS S3
   - USE_LOCAL_STORAGE=false로 변경
   - S3 버킷 설정

## ⚠️ 주의사항

1. **보안**:
   - JWT_SECRET을 프로덕션에서 강력한 값으로 변경
   - 관리자 비밀번호를 첫 로그인 후 즉시 변경
   - HTTPS 사용 (프로덕션)
   - 관리자 도메인을 완전히 숨김

2. **데이터베이스**:
   - 프로덕션에서는 RDS 또는 관리형 서비스 사용
   - 정기 백업 설정
   - 연결 풀 최적화

3. **파일 저장**:
   - 로컬 저장소는 개발용만 사용
   - 프로덕션에서는 S3 또는 CDN 사용
   - 파일 용량 제한 설정

## 📊 현재 상태

```
✅ 데이터베이스: PostgreSQL 실행 중
✅ 더미 음원: 5개 추가됨
✅ 관리자 계정: 생성됨
✅ 백엔드 서버: 포트 3001
✅ 메인 사이트: 포트 3000
✅ 음원 사이트: 포트 3002
✅ 관리자 사이트: 포트 3003
✅ CORS 설정: 완료
```

## 🎉 완료!

모든 서버가 실행 중이며 테스트 가능한 상태입니다.

**테스트 시작**:
1. 메인 사이트 확인: http://localhost:3000
2. 관리자 로그인: http://localhost:3003/login (admin@test.com / admin123)
3. 음원 사이트는 초대 링크 생성 후 테스트 가능
