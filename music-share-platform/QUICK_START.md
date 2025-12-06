# 빠른 시작 가이드

5분 안에 로컬에서 실행하기

---

## ⚡ 빠른 설치 (Mac)

```bash
# 1. PostgreSQL 설치
brew install postgresql@15
brew services start postgresql@15

# 2. 데이터베이스 생성
createdb music_share

# 3. 프로젝트 폴더로 이동
cd /Users/zhsks220/Desktop/project/루트테이블/music-share-platform

# 4. 백엔드 설정
cd backend
npm install
cp .env.example .env

# .env 파일 수정 (필수)
# DATABASE_URL=postgresql://postgres:@localhost:5432/music_share
# JWT_SECRET=test-secret-key
# USE_LOCAL_STORAGE=true  (S3 대신 로컬 저장)

# 5. 데이터베이스 마이그레이션
npm run db:migrate

# 6. 프론트엔드 설정
cd ../frontend
npm install

# 7. 서버 실행 (2개 터미널 필요)
# 터미널 1
cd backend && npm run dev

# 터미널 2
cd frontend && npm run dev
```

---

## 🎯 테스트 (2분)

### 1. 관리자 로그인
```
URL: http://localhost:3000/login
이메일: admin@test.com
비밀번호: admin123
```

### 2. 음원 업로드
- 관리자 대시보드에서 MP3 파일 업로드
- 제목, 아티스트 입력

### 3. 초대 링크 생성
- 업로드한 음원 선택
- "초대 링크 생성" 클릭
- 링크 복사

### 4. 회원가입 테스트
- 새 시크릿 브라우저에서 초대 링크 접속
- 이메일/비밀번호 입력하여 가입
- 자동 로그인 → 내 음원 페이지

### 5. 음원 재생/다운로드
- "재생" 버튼으로 스트리밍
- "다운로드" 버튼으로 파일 저장

---

## 🐛 문제 해결

### PostgreSQL 연결 실패
```bash
brew services start postgresql@15
```

### 포트 충돌 (3001 또는 3000)
```bash
lsof -i :3001
kill -9 <PID>
```

### 음원 업로드 실패
`.env` 파일에 추가:
```
USE_LOCAL_STORAGE=true
LOCAL_STORAGE_PATH=./uploads
```

---

## 📁 환경 변수 (.env)

**최소 설정**:
```bash
PORT=3001
DATABASE_URL=postgresql://postgres:@localhost:5432/music_share
JWT_SECRET=test-secret-key-change-this
USE_LOCAL_STORAGE=true
LOCAL_STORAGE_PATH=./uploads
ADMIN_EMAIL=admin@test.com
ADMIN_PASSWORD=admin123
```

**AWS S3 사용 시 추가**:
```bash
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=ap-northeast-2
S3_BUCKET=your-bucket
```

---

## ✅ 정상 작동 확인

### 백엔드 (http://localhost:3001/health)
```json
{"status":"ok","timestamp":"2025-01-19T..."}
```

### 프론트엔드 (http://localhost:3000)
- 로그인 페이지 표시

### 데이터베이스
```bash
psql music_share
SELECT * FROM users;
# admin@test.com이 있어야 함
```

---

완료! 🎉

상세 가이드: [TESTING_GUIDE.md](TESTING_GUIDE.md)
