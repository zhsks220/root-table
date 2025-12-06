# 음원 공유 플랫폼 (초대 전용)

초대 링크를 받은 사람만 가입하고, 할당된 음원을 재생/다운로드할 수 있는 시스템

## 프로젝트 구조

```
music-share-platform/
├── frontend/          # React 프론트엔드
├── backend/           # Node.js + Express 백엔드
└── README.md
```

## 기술 스택

**Frontend**:
- React + TypeScript
- React Router
- Zustand (상태 관리)
- Tailwind CSS
- Howler.js (오디오 재생)

**Backend**:
- Node.js + Express + TypeScript
- PostgreSQL (데이터베이스)
- JWT (인증)
- AWS S3 (파일 저장)
- bcrypt (비밀번호 해싱)

## 주요 기능

1. **초대 시스템**
   - 관리자가 초대 링크 생성 + 음원 할당
   - 초대 링크로만 회원가입 가능

2. **인증**
   - 회원가입 (초대 코드 필수)
   - 로그인 (JWT)

3. **음원 관리**
   - 사용자별 할당된 음원만 보기
   - 스트리밍 재생
   - 다운로드 (권한 있는 경우)

4. **관리자**
   - 음원 업로드
   - 초대 생성
   - 사용자 관리

## 개발 시작

### 1. 백엔드 설정
```bash
cd backend
npm install
cp .env.example .env
# .env 파일 수정 (DB, AWS 설정)
npm run dev
```

### 2. 프론트엔드 설정
```bash
cd frontend
npm install
npm run dev
```

## 환경 변수 설정

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/music_share
JWT_SECRET=your-secret-key
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=ap-northeast-2
S3_BUCKET=your-bucket-name
```

## 배포

- Frontend: Vercel
- Backend: Vercel Serverless or AWS EC2
- Database: Supabase or AWS RDS
- Storage: AWS S3
- CDN: CloudFront
