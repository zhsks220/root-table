# 테스트 가이드

로컬 환경에서 음원 공유 플랫폼을 테스트하는 방법입니다.

---

## 📋 사전 준비

### 1. 필수 소프트웨어 설치

```bash
# Node.js (v18 이상)
node --version  # v18.0.0 이상 확인

# PostgreSQL (v15 이상)
# Mac
brew install postgresql@15
brew services start postgresql@15

# Windows - https://www.postgresql.org/download/windows/
# Linux
sudo apt-get install postgresql-15
```

### 2. AWS S3 설정 (선택 - 로컬 테스트용)

**옵션 A: 실제 AWS S3 사용**
```bash
# AWS 계정에서:
# 1. S3 버킷 생성
# 2. IAM 사용자 생성 및 액세스 키 발급
# 3. 사용자에게 S3 권한 부여
```

**옵션 B: 로컬 파일 시스템 사용 (개발용)**
```bash
# S3 대신 로컬 폴더에 저장
# backend/.env에서 USE_LOCAL_STORAGE=true 설정
```

---

## 🚀 1단계: 프로젝트 설치

### 1-1. 저장소 클론 및 의존성 설치

```bash
cd /Users/zhsks220/Desktop/project/루트테이블/music-share-platform

# 백엔드 의존성 설치
cd backend
npm install

# 프론트엔드 의존성 설치
cd ../frontend
npm install
```

---

## 🗄️ 2단계: 데이터베이스 설정

### 2-1. PostgreSQL 데이터베이스 생성

```bash
# PostgreSQL 서비스 시작 확인
brew services list | grep postgresql

# 데이터베이스 생성
createdb music_share

# 연결 테스트
psql music_share
# 연결되면 \q로 종료
```

### 2-2. 환경 변수 설정

```bash
cd backend
cp .env.example .env
```

**backend/.env 파일 수정**:
```bash
# Server
PORT=3001
NODE_ENV=development

# Database (로컬 PostgreSQL)
DATABASE_URL=postgresql://postgres:@localhost:5432/music_share
# Mac의 경우 비밀번호 없이 연결 가능
# Windows의 경우: postgresql://postgres:your_password@localhost:5432/music_share

# JWT (테스트용)
JWT_SECRET=test-secret-key-change-in-production

# AWS S3 (실제 AWS 사용 시)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=ap-northeast-2
S3_BUCKET=your-bucket-name

# 또는 로컬 파일 시스템 사용
USE_LOCAL_STORAGE=true
LOCAL_STORAGE_PATH=./uploads

# Admin 계정
ADMIN_EMAIL=admin@test.com
ADMIN_PASSWORD=admin123
```

### 2-3. 데이터베이스 마이그레이션 실행

```bash
cd backend
npm run db:migrate
```

**성공 시 출력**:
```
✅ Schema created successfully
✅ Admin user created
   Email: admin@test.com
   Password: admin123
⚠️  IMPORTANT: Change the admin password after first login!
```

---

## 🎬 3단계: 서버 실행

### 3-1. 백엔드 서버 실행 (터미널 1)

```bash
cd backend
npm run dev
```

**성공 시 출력**:
```
🎵 Music Share Platform Backend
✅ Server running on port 3001
✅ Database connected
🌍 Environment: development
```

### 3-2. 프론트엔드 서버 실행 (터미널 2)

```bash
cd frontend
npm run dev
```

**성공 시 출력**:
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

---

## 🧪 4단계: 기능 테스트

### 4-1. 관리자 로그인 테스트

1. 브라우저에서 `http://localhost:3000/login` 접속
2. 관리자 계정으로 로그인:
   - 이메일: `admin@test.com`
   - 비밀번호: `admin123`
3. 로그인 성공 시 → 자동으로 대시보드로 이동

### 4-2. 음원 업로드 테스트 (관리자)

1. 관리자 대시보드 (`http://localhost:3000/admin`)
2. "음원 업로드" 섹션
3. 테스트 음원 파일 선택 (MP3, WAV, FLAC)
4. 정보 입력:
   - 제목: "테스트 곡"
   - 아티스트: "테스트 아티스트"
   - 앨범: "테스트 앨범" (선택)
5. 업로드 클릭
6. 성공 시 → 음원 목록에 추가됨

### 4-3. 초대 링크 생성 테스트

1. 관리자 대시보드 → "초대 생성"
2. 할당할 음원 선택 (체크박스)
3. 만료 기간 설정 (선택): 7일
4. "초대 링크 생성" 클릭
5. 생성된 링크 복사:
   ```
   http://localhost:3000/invite/INV-abc123def456
   ```

### 4-4. 회원가입 테스트 (일반 사용자)

1. **새 시크릿 브라우저** 또는 로그아웃
2. 초대 링크 접속: `http://localhost:3000/invite/INV-abc123def456`
3. 회원가입 페이지로 자동 이동
4. 정보 입력:
   - 이메일: `user@test.com`
   - 비밀번호: `user12345678`
   - 이름: `테스트 유저`
5. "가입하기" 클릭
6. 성공 시 → 자동 로그인 → 내 음원 페이지로 이동

### 4-5. 음원 재생 테스트

1. 내 음원 목록 확인
2. 음원 카드에서 "재생" 버튼 클릭
3. 오디오 플레이어 표시 확인
4. 재생/일시정지 테스트
5. 볼륨 조절 테스트

### 4-6. 음원 다운로드 테스트

1. 음원 카드에서 "다운로드" 버튼 클릭
2. 파일 다운로드 시작 확인
3. 다운로드된 파일 재생 확인

---

## 🔍 5단계: API 테스트 (선택)

### cURL을 사용한 API 테스트

#### 5-1. 로그인 API 테스트

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "admin123"
  }'
```

**응답 예시**:
```json
{
  "success": true,
  "user": {
    "id": "uuid...",
    "email": "admin@test.com",
    "name": "Admin",
    "role": "admin"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 5-2. 내 음원 조회 API 테스트

```bash
# 위에서 받은 토큰 사용
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET http://localhost:3001/api/tracks/my-tracks \
  -H "Authorization: Bearer $TOKEN"
```

#### 5-3. 초대 코드 검증 API 테스트

```bash
curl -X GET http://localhost:3001/api/invitations/INV-abc123def456
```

---

## 🐛 6단계: 문제 해결

### 데이터베이스 연결 오류

**증상**: `❌ Failed to connect to database`

**해결 방법**:
```bash
# PostgreSQL 실행 확인
brew services list | grep postgresql

# 실행되지 않았다면
brew services start postgresql@15

# .env 파일의 DATABASE_URL 확인
# Mac: postgresql://postgres:@localhost:5432/music_share
# Windows: postgresql://postgres:your_password@localhost:5432/music_share
```

### 포트 충돌 오류

**증상**: `Error: listen EADDRINUSE: address already in use :::3001`

**해결 방법**:
```bash
# 3001 포트 사용 중인 프로세스 찾기
lsof -i :3001

# 프로세스 종료
kill -9 PID
```

### S3 업로드 오류

**증상**: `AWS S3 upload failed`

**해결 방법 1: 로컬 파일 시스템 사용**
```bash
# backend/.env 수정
USE_LOCAL_STORAGE=true
LOCAL_STORAGE_PATH=./uploads

# uploads 폴더 생성
mkdir backend/uploads
```

**해결 방법 2: AWS 설정 확인**
```bash
# .env 파일의 AWS 키 확인
# IAM 사용자 권한 확인 (S3FullAccess 또는 특정 버킷 권한)
```

### 음원 재생 안 됨

**증상**: 재생 버튼 클릭 시 아무 반응 없음

**해결 방법**:
```bash
# 브라우저 콘솔 확인 (F12)
# CORS 오류 확인

# backend/src/index.ts의 CORS 설정 확인
# origin이 http://localhost:3000인지 확인
```

---

## 📊 7단계: 데이터베이스 직접 확인

### PostgreSQL CLI 접속

```bash
psql music_share
```

### 유용한 SQL 쿼리

```sql
-- 전체 사용자 조회
SELECT id, email, name, role, created_at FROM users;

-- 전체 초대 조회
SELECT code, is_used, expires_at, created_at FROM invitations;

-- 전체 음원 조회
SELECT id, title, artist, album, created_at FROM tracks;

-- 사용자별 음원 권한 조회
SELECT u.email, t.title, ut.can_download
FROM user_tracks ut
JOIN users u ON ut.user_id = u.id
JOIN tracks t ON ut.track_id = t.id;

-- 다운로드 로그 조회
SELECT u.email, t.title, dl.downloaded_at
FROM download_logs dl
JOIN users u ON dl.user_id = u.id
JOIN tracks t ON dl.track_id = t.id
ORDER BY dl.downloaded_at DESC;
```

---

## 🧹 8단계: 초기화 및 재시작

### 데이터베이스 초기화

```bash
# 데이터베이스 삭제
dropdb music_share

# 재생성
createdb music_share

# 마이그레이션 재실행
cd backend
npm run db:migrate
```

### 업로드 파일 초기화

```bash
# 로컬 파일 시스템 사용 시
rm -rf backend/uploads/*

# S3 사용 시 AWS 콘솔에서 수동 삭제
```

---

## ✅ 테스트 체크리스트

### 기본 기능
- [ ] 관리자 로그인
- [ ] 음원 업로드 (MP3, WAV)
- [ ] 초대 링크 생성
- [ ] 초대 링크 접속
- [ ] 회원가입 (초대 코드로)
- [ ] 일반 사용자 로그인
- [ ] 내 음원 목록 조회
- [ ] 음원 재생
- [ ] 음원 다운로드

### 권한 테스트
- [ ] 초대 없이 회원가입 시도 (실패해야 함)
- [ ] 할당되지 않은 음원 접근 시도 (실패해야 함)
- [ ] 일반 사용자의 관리자 페이지 접근 (실패해야 함)
- [ ] 로그아웃 후 보호된 페이지 접근 (로그인으로 리다이렉트)

### 에러 처리
- [ ] 잘못된 이메일/비밀번호 로그인
- [ ] 만료된 초대 코드 사용
- [ ] 이미 사용된 초대 코드 재사용
- [ ] 네트워크 오류 시 메시지 표시

---

## 🎯 간단 테스트 시나리오

**5분 완전 테스트**:

```bash
# 1. 서버 실행 (2개 터미널)
Terminal 1: cd backend && npm run dev
Terminal 2: cd frontend && npm run dev

# 2. 관리자 로그인
http://localhost:3000/login
→ admin@test.com / admin123

# 3. 음원 업로드
→ 테스트 MP3 파일 선택
→ 제목, 아티스트 입력
→ 업로드

# 4. 초대 생성
→ 업로드한 음원 선택
→ 초대 링크 생성
→ 링크 복사

# 5. 새 브라우저에서 회원가입
→ 초대 링크 접속
→ user@test.com / password123
→ 가입

# 6. 음원 재생/다운로드
→ 내 음원에서 재생 버튼
→ 다운로드 버튼

✅ 모두 성공하면 정상 작동!
```

---

## 🔗 추가 리소스

- PostgreSQL 설치: https://www.postgresql.org/download/
- Node.js 설치: https://nodejs.org/
- AWS S3 가이드: https://aws.amazon.com/s3/getting-started/
- Postman (API 테스트 도구): https://www.postman.com/

문제가 발생하면 백엔드 터미널과 브라우저 콘솔(F12)의 에러 메시지를 확인하세요!
