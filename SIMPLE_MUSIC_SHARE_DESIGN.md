# 간단한 비공개 음원 공유 시스템 설계

## 📋 실제 요구사항

**목표**: 음원회사가 특정 사람들에게만 음원을 공유하는 시스템

**사용 시나리오**:
1. 음원회사 직원이 관리자 페이지에서 음원 업로드
2. 시스템이 자동으로 고유 공유 링크 생성
3. 링크를 이메일/카카오톡으로 전달
4. 받은 사람이 링크 클릭 → 음원 재생 또는 다운로드

---

## 🎯 최소 기능 (MVP)

### 필수 기능
- ✅ 관리자 업로드 페이지 (비밀번호 보호)
- ✅ 음원 파일 S3 업로드
- ✅ 고유 공유 링크 자동 생성
- ✅ 링크 기반 음원 재생 페이지
- ✅ 다운로드 기능

### 선택 기능 (나중에 추가)
- ⏳ 링크 만료 기능 (7일/30일 후 자동 삭제)
- ⏳ 다운로드 횟수 제한
- ⏳ 비밀번호 추가 보호
- ⏳ 다운로드 추적 (누가 언제 다운받았는지)

---

## 🏗️ 초간단 아키텍처

```
┌─────────────────┐
│  관리자 업로드   │ ← /admin (비밀번호 보호)
│  HTML 폼        │
└────────┬────────┘
         │ 파일 업로드
         ↓
┌─────────────────┐
│  Node.js API    │ ← Express (간단한 API 3개만)
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   AWS S3        │ ← 음원 파일 저장
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  CloudFront CDN │ ← 빠른 전송
└─────────────────┘

사용자 접근:
https://yourdomain.com/share/abc123def456
         ↓
    재생 페이지 (HTML + Audio Player)
```

---

## 💻 기술 스택 (최소화)

### 초간단 버전 (Vercel + S3)
```yaml
frontend:
  framework: 없음! 순수 HTML + JavaScript
  hosting: Vercel (무료)

backend:
  runtime: Node.js (Vercel Serverless Functions)
  api_count: 3개만
    - POST /api/upload (업로드)
    - GET /api/share/:token (링크 정보 조회)
    - GET /api/download/:token (다운로드 URL 생성)

database:
  type: JSON 파일 (S3에 저장)
  # 음원 수백 개까지는 DB 불필요

storage:
  files: AWS S3
  cdn: CloudFront

total_cost: $10-20/월
```

### 조금 더 확장 버전 (EC2 사용)
```yaml
frontend:
  framework: 순수 HTML 또는 간단한 React
  hosting: Vercel 또는 같은 서버에 호스팅

backend:
  runtime: Node.js + Express
  hosting: AWS EC2 t3.micro ($8/월)

database:
  type: SQLite (단일 파일 DB)
  # 확장 필요 시 PostgreSQL로 전환

storage:
  files: AWS S3
  cdn: CloudFront

total_cost: $20-50/월
```

---

## 📁 프로젝트 구조 (매우 간단)

```
music-share/
├── public/
│   ├── index.html          # 홈페이지 (선택)
│   ├── admin.html          # 관리자 업로드 페이지
│   └── share.html          # 음원 재생 페이지
├── api/
│   ├── upload.js           # 업로드 API
│   ├── share.js            # 링크 정보 조회 API
│   └── download.js         # 다운로드 URL 생성 API
├── data/
│   └── shares.json         # 공유 링크 메타데이터 (DB 대신)
└── package.json

총 파일: 10개 미만!
```

---

## 🔌 API 설계 (3개만)

### 1. 업로드 API

```typescript
POST /api/upload
Headers:
  X-Admin-Password: {관리자 비밀번호}
Body (multipart/form-data):
  file: {음원 파일}
  title: "곡 제목"
  artist: "아티스트명"

Response:
{
  "success": true,
  "shareUrl": "https://yourdomain.com/share/abc123def456",
  "token": "abc123def456"
}
```

### 2. 링크 정보 조회 API

```typescript
GET /api/share/:token

Response:
{
  "title": "곡 제목",
  "artist": "아티스트명",
  "duration": 180,
  "canDownload": true,
  "expiresAt": "2025-12-31T00:00:00Z" // 선택
}
```

### 3. 다운로드 URL 생성 API

```typescript
POST /api/download/:token

Response:
{
  "downloadUrl": "https://s3-presigned-url...",
  "expiresIn": 900 // 15분
}
```

---

## 💾 데이터 저장 (DB 대신 JSON)

### shares.json 파일 구조

```json
{
  "abc123def456": {
    "title": "Beautiful Song",
    "artist": "Artist Name",
    "s3Key": "uploads/2025/01/abc123.mp3",
    "uploadedAt": "2025-01-19T10:00:00Z",
    "expiresAt": null,
    "downloadCount": 0,
    "maxDownloads": null,
    "password": null
  },
  "xyz789ghi012": {
    "title": "Another Track",
    "artist": "Another Artist",
    "s3Key": "uploads/2025/01/xyz789.mp3",
    "uploadedAt": "2025-01-19T11:00:00Z",
    "expiresAt": "2025-02-19T11:00:00Z",
    "downloadCount": 3,
    "maxDownloads": 10,
    "password": "secretpass"
  }
}
```

**장점**:
- DB 설치 및 관리 불필요
- 백업 간단 (파일 하나만)
- 수백~수천 개까지는 충분히 빠름

**언제 DB로 전환?**:
- 공유 링크가 10,000개 이상
- 복잡한 검색 필요
- 다중 관리자 필요

---

## 📄 HTML 페이지 예시

### 관리자 업로드 페이지 (admin.html)

```html
<!DOCTYPE html>
<html>
<head>
  <title>음원 업로드 관리</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 600px;
      margin: 50px auto;
      padding: 20px;
    }
    .upload-form {
      border: 2px dashed #ccc;
      padding: 40px;
      text-align: center;
    }
    button {
      background: #007bff;
      color: white;
      padding: 10px 20px;
      border: none;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <h1>음원 업로드</h1>

  <!-- 비밀번호 확인 -->
  <div id="login" style="display: block;">
    <input type="password" id="password" placeholder="관리자 비밀번호" />
    <button onclick="checkPassword()">로그인</button>
  </div>

  <!-- 업로드 폼 -->
  <div id="upload-form" style="display: none;">
    <div class="upload-form">
      <input type="file" id="file" accept="audio/*" required />
      <br/><br/>
      <input type="text" id="title" placeholder="곡 제목" required />
      <br/><br/>
      <input type="text" id="artist" placeholder="아티스트" required />
      <br/><br/>
      <button onclick="uploadFile()">업로드</button>
    </div>

    <div id="result" style="margin-top: 20px;"></div>
  </div>

  <script>
    let adminPassword = '';

    function checkPassword() {
      const password = document.getElementById('password').value;
      // 간단한 비밀번호 체크 (실제로는 서버에서 검증)
      if (password === 'your-secret-password') {
        adminPassword = password;
        document.getElementById('login').style.display = 'none';
        document.getElementById('upload-form').style.display = 'block';
      } else {
        alert('비밀번호가 틀렸습니다.');
      }
    }

    async function uploadFile() {
      const file = document.getElementById('file').files[0];
      const title = document.getElementById('title').value;
      const artist = document.getElementById('artist').value;

      if (!file || !title || !artist) {
        alert('모든 필드를 입력해주세요.');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('artist', artist);

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'X-Admin-Password': adminPassword
          },
          body: formData
        });

        const data = await response.json();

        if (data.success) {
          document.getElementById('result').innerHTML = `
            <h3>업로드 성공!</h3>
            <p><strong>공유 링크:</strong></p>
            <input type="text" value="${data.shareUrl}" readonly style="width: 100%; padding: 10px;" />
            <button onclick="copyToClipboard('${data.shareUrl}')">링크 복사</button>
          `;
        } else {
          alert('업로드 실패: ' + data.error);
        }
      } catch (error) {
        alert('오류 발생: ' + error.message);
      }
    }

    function copyToClipboard(text) {
      navigator.clipboard.writeText(text);
      alert('링크가 복사되었습니다!');
    }
  </script>
</body>
</html>
```

### 음원 재생 페이지 (share.html)

```html
<!DOCTYPE html>
<html>
<head>
  <title>음원 재생</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 600px;
      margin: 50px auto;
      padding: 20px;
      text-align: center;
    }
    .player {
      background: #f5f5f5;
      padding: 40px;
      border-radius: 10px;
    }
    audio {
      width: 100%;
      margin: 20px 0;
    }
    button {
      background: #28a745;
      color: white;
      padding: 10px 30px;
      border: none;
      cursor: pointer;
      font-size: 16px;
    }
  </style>
</head>
<body>
  <div id="loading">로딩 중...</div>

  <div id="player" style="display: none;">
    <div class="player">
      <h1 id="title"></h1>
      <h3 id="artist"></h3>

      <audio id="audio" controls preload="auto">
        브라우저가 오디오 재생을 지원하지 않습니다.
      </audio>

      <br/>
      <button onclick="downloadTrack()">⬇️ 다운로드</button>
    </div>
  </div>

  <div id="error" style="display: none; color: red;">
    <h2>접근할 수 없는 링크입니다.</h2>
    <p>링크가 만료되었거나 올바르지 않습니다.</p>
  </div>

  <script>
    // URL에서 토큰 추출
    const token = window.location.pathname.split('/share/')[1];

    async function loadTrack() {
      try {
        const response = await fetch(`/api/share/${token}`);
        const data = await response.json();

        if (data.error) {
          showError();
          return;
        }

        // 곡 정보 표시
        document.getElementById('title').textContent = data.title;
        document.getElementById('artist').textContent = data.artist;

        // 스트리밍 URL 생성 (S3 pre-signed URL)
        const streamResponse = await fetch(`/api/stream/${token}`);
        const streamData = await streamResponse.json();

        document.getElementById('audio').src = streamData.streamUrl;

        document.getElementById('loading').style.display = 'none';
        document.getElementById('player').style.display = 'block';

      } catch (error) {
        showError();
      }
    }

    async function downloadTrack() {
      try {
        const response = await fetch(`/api/download/${token}`, {
          method: 'POST'
        });
        const data = await response.json();

        if (data.downloadUrl) {
          window.location.href = data.downloadUrl;
        } else {
          alert('다운로드할 수 없습니다.');
        }
      } catch (error) {
        alert('다운로드 오류: ' + error.message);
      }
    }

    function showError() {
      document.getElementById('loading').style.display = 'none';
      document.getElementById('error').style.display = 'block';
    }

    // 페이지 로드 시 실행
    loadTrack();
  </script>
</body>
</html>
```

---

## 🔐 보안 설계 (간단함)

### 1. 링크 기반 인증

```typescript
// 랜덤 토큰 생성 (crypto 모듈)
import crypto from 'crypto';

function generateToken() {
  return crypto.randomBytes(16).toString('hex'); // abc123def456...
}

// 토큰 검증 (shares.json에서 존재 확인)
function verifyToken(token) {
  const shares = JSON.parse(fs.readFileSync('data/shares.json'));
  return shares[token] !== undefined;
}
```

### 2. 관리자 인증 (환경변수)

```javascript
// .env 파일
ADMIN_PASSWORD=your-super-secret-password

// API에서 검증
app.post('/api/upload', (req, res) => {
  const password = req.headers['x-admin-password'];

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 업로드 처리...
});
```

### 3. S3 Pre-signed URLs

```typescript
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({ region: 'ap-northeast-2' });

// 업로드용 URL
async function getUploadUrl(key) {
  const command = new PutObjectCommand({
    Bucket: 'your-bucket',
    Key: key,
  });
  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

// 다운로드용 URL
async function getDownloadUrl(key) {
  const command = new GetObjectCommand({
    Bucket: 'your-bucket',
    Key: key,
    ResponseContentDisposition: `attachment; filename="${key}"`,
  });
  return await getSignedUrl(s3Client, command, { expiresIn: 900 }); // 15분
}

// 스트리밍용 URL
async function getStreamUrl(key) {
  const command = new GetObjectCommand({
    Bucket: 'your-bucket',
    Key: key,
  });
  return await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1시간
}
```

---

## 🚀 Vercel 배포 (가장 간단)

### 프로젝트 구조 (Vercel용)

```
music-share/
├── public/
│   ├── admin.html
│   └── share.html
├── api/
│   ├── upload.js         # Serverless Function
│   ├── share.js          # Serverless Function
│   └── download.js       # Serverless Function
├── vercel.json
└── package.json
```

### vercel.json

```json
{
  "rewrites": [
    { "source": "/admin", "destination": "/admin.html" },
    { "source": "/share/:token", "destination": "/share.html" }
  ],
  "env": {
    "ADMIN_PASSWORD": "@admin-password",
    "AWS_ACCESS_KEY_ID": "@aws-access-key",
    "AWS_SECRET_ACCESS_KEY": "@aws-secret-key",
    "S3_BUCKET": "@s3-bucket"
  }
}
```

### api/upload.js (Serverless Function)

```javascript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import multiparty from 'multiparty';
import crypto from 'crypto';
import fs from 'fs';

const s3Client = new S3Client({ region: 'ap-northeast-2' });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 관리자 인증
  const password = req.headers['x-admin-password'];
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 파일 파싱
  const form = new multiparty.Form();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    const file = files.file[0];
    const title = fields.title[0];
    const artist = fields.artist[0];

    // 토큰 생성
    const token = crypto.randomBytes(16).toString('hex');
    const s3Key = `uploads/${new Date().getFullYear()}/${token}.mp3`;

    // S3 업로드
    const fileContent = fs.readFileSync(file.path);
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: s3Key,
      Body: fileContent,
      ContentType: file.headers['content-type'],
    }));

    // 메타데이터 저장 (실제로는 데이터베이스나 S3에 JSON 저장)
    // 여기서는 간단히 메모리에만 저장 (재시작 시 사라짐 - 개선 필요)
    const shareData = {
      title,
      artist,
      s3Key,
      uploadedAt: new Date().toISOString(),
    };

    // 공유 링크 생성
    const shareUrl = `https://yourdomain.com/share/${token}`;

    res.json({
      success: true,
      shareUrl,
      token,
    });
  });
}
```

---

## 💰 예상 비용

### 초소규모 (월 1TB 전송 기준)

```
Vercel:
- Hobby Plan: 무료 (제한: 100GB 대역폭/월)
- Pro Plan: $20/월 (1TB 대역폭)

AWS S3 + CloudFront:
- S3 Storage (100GB): $2.30/월
- CloudFront (1TB 전송): $85/월

총: $0-107/월 (Vercel 무료 → $2/월, Pro → $107/월)
```

### 소규모 (EC2 사용)

```
AWS EC2:
- t3.micro: $8/월

AWS S3 + CloudFront:
- S3 Storage (100GB): $2.30/월
- CloudFront (1TB 전송): $85/월

총: $95/월
```

**기존 복잡한 설계**: $150/월
**간단한 설계**: $0-107/월 (최대 40% 절감)

---

## ✅ 개발 단계

### Phase 1: MVP (1주)
- [ ] Vercel 프로젝트 설정
- [ ] AWS S3 버킷 생성
- [ ] 관리자 업로드 페이지
- [ ] 음원 재생 페이지
- [ ] S3 pre-signed URL 구현

### Phase 2: 보안 강화 (3일)
- [ ] 링크 만료 기능
- [ ] 다운로드 횟수 제한
- [ ] 비밀번호 추가 보호

### Phase 3: 관리 기능 (3일)
- [ ] 업로드 목록 페이지
- [ ] 링크 삭제 기능
- [ ] 다운로드 통계

---

## 🎯 요약

### 필요한 것
✅ 간단한 파일 업로드 → S3
✅ 공유 링크 생성
✅ 링크 기반 접근 제어
✅ 재생/다운로드 기능

### 필요 없는 것
❌ 회원가입/로그인
❌ 검색 기능
❌ 복잡한 데이터베이스
❌ 마이크로서비스
❌ Elasticsearch
❌ Kafka/RabbitMQ
❌ HLS/DASH 스트리밍

### 결과
- **개발 기간**: 1-2주 (기존: 3개월)
- **비용**: $10-107/월 (기존: $150/월)
- **복잡도**: 매우 낮음 (파일 10개 미만)
- **유지보수**: 거의 불필요

이게 실제로 필요한 시스템입니다!
