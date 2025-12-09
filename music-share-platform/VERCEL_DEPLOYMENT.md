# Vercel 배포 가이드

## 프로젝트 구조
- **frontend-music**: Vercel에 배포 (프론트엔드)
- **backend**: Railway/Render에 배포 (백엔드 API)

---

## 1. 백엔드 배포 (Railway 추천)

### Railway 배포 방법
1. [Railway](https://railway.app/) 가입
2. "New Project" → "Deploy from GitHub repo" 선택
3. music-share-platform 리포지토리 연결
4. Root Directory를 `backend`로 설정
5. 환경변수 설정:
   ```
   DATABASE_URL=postgresql://user:password@host:5432/dbname
   JWT_SECRET=your-secret-key
   AWS_ACCESS_KEY_ID=your-aws-key
   AWS_SECRET_ACCESS_KEY=your-aws-secret
   AWS_REGION=ap-northeast-2
   AWS_S3_BUCKET=your-bucket-name
   PORT=3001
   NODE_ENV=production
   ```
6. Deploy 클릭

### Railway 배포 후 URL 복사
배포 완료 후 제공되는 URL을 복사 (예: `https://your-app.railway.app`)

---

## 2. 프론트엔드 배포 (Vercel)

### Vercel 배포 방법
1. [Vercel](https://vercel.com/) 가입
2. "Add New Project" 클릭
3. music-share-platform 리포지토리 연결
4. **중요 설정**:
   - Root Directory: `frontend-music`
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

5. 환경변수 설정 (Settings → Environment Variables):
   ```
   VITE_API_URL=https://your-backend.railway.app/api
   ```

6. Deploy 클릭

---

## 3. CORS 설정 (백엔드)

백엔드에서 Vercel 도메인 허용 필요:

`backend/src/index.ts` 수정:
```typescript
app.use(cors({
  origin: [
    'http://localhost:3002',
    'https://your-app.vercel.app'  // Vercel 도메인 추가
  ],
  credentials: true
}));
```

---

## 4. 배포 순서 요약

1. **Railway에 백엔드 배포** → URL 획득
2. **Vercel 환경변수에 백엔드 URL 설정**
3. **Vercel에 프론트엔드 배포**
4. **백엔드 CORS에 Vercel 도메인 추가**

---

## 5. 커스텀 도메인 (선택)

### Vercel 커스텀 도메인
1. Vercel Dashboard → Settings → Domains
2. 도메인 추가 후 DNS 설정

### Railway 커스텀 도메인
1. Railway Dashboard → Settings → Domains
2. 도메인 추가 후 CNAME 설정

---

## 문제 해결

### API 호출 실패
- CORS 설정 확인
- 환경변수 `VITE_API_URL` 확인
- 백엔드 서버 상태 확인

### 빌드 실패
- `npm run build` 로컬 테스트
- TypeScript 에러 확인
- 의존성 설치 확인
