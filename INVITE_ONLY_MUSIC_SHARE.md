# 초대 전용 음원 공유 시스템 설계

## 📋 수정된 요구사항

**목표**: 초대 링크를 받은 사람만 가입하고, 로그인해서 음원에 접근할 수 있는 시스템

**사용 시나리오**:
1. 음원회사 관리자가 초대 링크 생성 + 음원 할당
2. 특정 사람에게 초대 링크 전달 (이메일/카카오톡)
3. 받은 사람이 링크 클릭 → **회원가입** (초대 코드로만 가능)
4. 로그인 후 → 본인에게 할당된 음원만 보기/재생/다운로드

---

## 🔄 시스템 플로우

```
[관리자]
  │
  ├─ 1. 초대 링크 생성
  │    - 초대 코드: INV-abc123
  │    - 할당 음원: [곡1, 곡2, 곡3]
  │    - 링크: https://yourdomain.com/invite/INV-abc123
  │
  └─ 2. 링크 전달 (이메일/카카오톡)
       │
       ↓
[초대받은 사람]
  │
  ├─ 3. 초대 링크 클릭
  │    → 회원가입 페이지
  │    → 이메일, 비밀번호, 이름 입력
  │    → 가입 완료 (초대 코드 자동 검증)
  │
  ├─ 4. 로그인
  │    → 이메일, 비밀번호
  │    → JWT 토큰 발급
  │
  └─ 5. 내 음원 목록
       → 본인에게 할당된 음원만 표시
       → 재생 또는 다운로드
```

---

## 🗄️ 데이터베이스 스키마

```sql
-- 사용자 테이블
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'user', -- user, admin
  invitation_code VARCHAR(50), -- 어떤 초대로 가입했는지
  created_at TIMESTAMP DEFAULT NOW()
);

-- 초대 테이블
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL, -- INV-abc123
  created_by UUID REFERENCES users(id), -- 관리자
  is_used BOOLEAN DEFAULT FALSE,
  used_by UUID REFERENCES users(id), -- 누가 사용했는지
  expires_at TIMESTAMP, -- 초대 만료일 (선택)
  created_at TIMESTAMP DEFAULT NOW()
);

-- 음원 테이블
CREATE TABLE tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  artist VARCHAR(255) NOT NULL,
  album VARCHAR(255),
  duration INTEGER,
  file_url VARCHAR(500) NOT NULL, -- S3 키
  uploaded_by UUID REFERENCES users(id), -- 관리자
  created_at TIMESTAMP DEFAULT NOW()
);

-- 사용자-음원 매핑 (권한 관리)
CREATE TABLE user_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  invitation_id UUID REFERENCES invitations(id), -- 어떤 초대로 할당되었는지
  can_download BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, track_id) -- 중복 방지
);

-- 다운로드 로그 (선택)
CREATE TABLE download_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  track_id UUID REFERENCES tracks(id),
  ip_address INET,
  downloaded_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_invitations_code ON invitations(code);
CREATE INDEX idx_user_tracks_user_id ON user_tracks(user_id);
CREATE INDEX idx_user_tracks_track_id ON user_tracks(track_id);
```

---

## 🔌 API 설계

### 1. 관리자 - 초대 생성

```typescript
POST /api/admin/invitations
Headers:
  Authorization: Bearer {admin_jwt_token}
Body:
{
  "trackIds": ["track-uuid-1", "track-uuid-2"],
  "expiresInDays": 7 // 선택
}

Response:
{
  "success": true,
  "invitation": {
    "code": "INV-abc123def",
    "inviteUrl": "https://yourdomain.com/invite/INV-abc123def",
    "trackCount": 2,
    "expiresAt": "2025-01-26T10:00:00Z"
  }
}
```

### 2. 초대 코드 검증

```typescript
GET /api/invitations/:code

Response:
{
  "valid": true,
  "code": "INV-abc123def",
  "trackCount": 2,
  "expiresAt": "2025-01-26T10:00:00Z"
}

// 또는 만료/사용된 경우
{
  "valid": false,
  "error": "Invitation expired or already used"
}
```

### 3. 회원가입 (초대 코드 필수)

```typescript
POST /api/auth/register
Body:
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "홍길동",
  "invitationCode": "INV-abc123def"
}

Response:
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "홍길동"
  },
  "token": "jwt-token",
  "assignedTracks": 2
}

// 처리 과정:
// 1. 초대 코드 검증
// 2. 사용자 생성
// 3. 초대에 할당된 음원들을 user_tracks에 매핑
// 4. 초대 코드를 'used'로 표시
```

### 4. 로그인

```typescript
POST /api/auth/login
Body:
{
  "email": "user@example.com",
  "password": "securepassword"
}

Response:
{
  "success": true,
  "token": "jwt-token",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "홍길동"
  }
}
```

### 5. 내 음원 목록

```typescript
GET /api/my-tracks
Headers:
  Authorization: Bearer {jwt_token}

Response:
{
  "tracks": [
    {
      "id": "track-uuid-1",
      "title": "Beautiful Song",
      "artist": "Artist Name",
      "album": "Album Name",
      "duration": 180,
      "canDownload": true
    },
    {
      "id": "track-uuid-2",
      "title": "Another Track",
      "artist": "Another Artist",
      "album": "Another Album",
      "duration": 200,
      "canDownload": true
    }
  ]
}
```

### 6. 음원 스트리밍

```typescript
GET /api/tracks/:trackId/stream
Headers:
  Authorization: Bearer {jwt_token}

Response:
{
  "streamUrl": "https://s3-presigned-url...",
  "expiresIn": 3600
}

// 권한 검증:
// 1. JWT 토큰에서 사용자 ID 추출
// 2. user_tracks 테이블에서 해당 사용자가 이 음원에 접근 가능한지 확인
// 3. 가능하면 S3 pre-signed URL 생성
```

### 7. 음원 다운로드

```typescript
POST /api/tracks/:trackId/download
Headers:
  Authorization: Bearer {jwt_token}

Response:
{
  "downloadUrl": "https://s3-presigned-url...",
  "expiresIn": 900,
  "filename": "Beautiful Song.mp3"
}

// 추가로 download_logs에 기록
```

---

## 🏗️ 기술 스택

```yaml
frontend:
  framework: React + TypeScript
  state_management: Zustand or Context API
  routing: React Router
  styling: Tailwind CSS
  audio_player: Howler.js

backend:
  runtime: Node.js + Express + TypeScript
  authentication: JWT (jsonwebtoken)
  password_hashing: bcrypt
  validation: Zod

database:
  type: PostgreSQL
  # 초기에는 SQLite도 가능하지만 확장성 고려 시 PostgreSQL 권장

storage:
  files: AWS S3
  cdn: CloudFront

deployment:
  backend: AWS EC2 or Vercel Serverless
  frontend: Vercel or Netlify
  database: AWS RDS or Supabase
```

---

## 📁 프로젝트 구조

```
music-share-invite/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── InvitePage.tsx        # /invite/:code
│   │   │   ├── RegisterPage.tsx      # 회원가입
│   │   │   ├── LoginPage.tsx         # 로그인
│   │   │   ├── MyTracksPage.tsx      # 내 음원 목록
│   │   │   └── AdminPage.tsx         # 관리자 대시보드
│   │   ├── components/
│   │   │   ├── AudioPlayer.tsx       # 오디오 플레이어
│   │   │   ├── TrackCard.tsx         # 음원 카드
│   │   │   └── InviteForm.tsx        # 초대 생성 폼
│   │   ├── hooks/
│   │   │   ├── useAuth.ts            # 인증 훅
│   │   │   └── useTracks.ts          # 음원 관리 훅
│   │   ├── store/
│   │   │   └── authStore.ts          # 인증 상태 관리
│   │   └── services/
│   │       └── api.ts                # API 클라이언트
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts               # 인증 라우트
│   │   │   ├── invitations.ts        # 초대 관리
│   │   │   ├── tracks.ts             # 음원 관리
│   │   │   └── admin.ts              # 관리자 전용
│   │   ├── middleware/
│   │   │   ├── auth.ts               # JWT 검증
│   │   │   └── admin.ts              # 관리자 권한 검증
│   │   ├── services/
│   │   │   ├── s3.ts                 # S3 업로드/다운로드
│   │   │   ├── invitation.ts         # 초대 로직
│   │   │   └── track.ts              # 음원 로직
│   │   ├── db/
│   │   │   └── schema.sql            # 데이터베이스 스키마
│   │   └── index.ts
│   └── package.json
│
└── README.md
```

---

## 🔐 인증 구현

### JWT 토큰 생성

```typescript
import jwt from 'jsonwebtoken';

function generateToken(user: User) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' } // 7일 유효
  );
}
```

### 인증 미들웨어

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
```

### 비밀번호 해싱

```typescript
import bcrypt from 'bcrypt';

// 회원가입 시
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// 로그인 시
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
```

---

## 📄 핵심 페이지 구현

### 1. 회원가입 페이지 (RegisterPage.tsx)

```typescript
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function RegisterPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [invitationValid, setInvitationValid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });

  useEffect(() => {
    // 초대 코드 검증
    axios.get(`/api/invitations/${code}`)
      .then(res => {
        if (res.data.valid) {
          setInvitationValid(true);
        } else {
          alert('유효하지 않거나 만료된 초대 링크입니다.');
          navigate('/');
        }
      })
      .catch(() => {
        alert('초대 코드를 확인할 수 없습니다.');
        navigate('/');
      })
      .finally(() => setLoading(false));
  }, [code, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await axios.post('/api/auth/register', {
        ...formData,
        invitationCode: code,
      });

      // 토큰 저장
      localStorage.setItem('token', res.data.token);

      alert(`가입 완료! ${res.data.assignedTracks}개의 음원에 접근할 수 있습니다.`);
      navigate('/my-tracks');
    } catch (error: any) {
      alert('회원가입 실패: ' + error.response?.data?.error);
    }
  };

  if (loading) return <div>로딩 중...</div>;
  if (!invitationValid) return null;

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">회원가입</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">이메일</label>
          <input
            type="email"
            required
            className="w-full px-3 py-2 border rounded"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">비밀번호</label>
          <input
            type="password"
            required
            minLength={8}
            className="w-full px-3 py-2 border rounded"
            value={formData.password}
            onChange={e => setFormData({ ...formData, password: e.target.value })}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">이름</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border rounded"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          가입하기
        </button>
      </form>
    </div>
  );
}
```

### 2. 내 음원 목록 페이지 (MyTracksPage.tsx)

```typescript
import { useState, useEffect } from 'react';
import axios from 'axios';
import AudioPlayer from '../components/AudioPlayer';

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  canDownload: boolean;
}

export default function MyTracksPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [streamUrl, setStreamUrl] = useState<string>('');

  useEffect(() => {
    // 내 음원 목록 가져오기
    const token = localStorage.getItem('token');
    axios.get('/api/my-tracks', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setTracks(res.data.tracks))
      .catch(err => {
        if (err.response?.status === 401) {
          alert('로그인이 필요합니다.');
          window.location.href = '/login';
        }
      });
  }, []);

  const playTrack = async (track: Track) => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`/api/tracks/${track.id}/stream`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentTrack(track);
      setStreamUrl(res.data.streamUrl);
    } catch (error) {
      alert('재생할 수 없습니다.');
    }
  };

  const downloadTrack = async (track: Track) => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.post(`/api/tracks/${track.id}/download`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.location.href = res.data.downloadUrl;
    } catch (error) {
      alert('다운로드할 수 없습니다.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">내 음원</h1>

      {tracks.length === 0 ? (
        <p className="text-gray-500">할당된 음원이 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {tracks.map(track => (
            <div key={track.id} className="bg-white p-4 rounded shadow flex items-center justify-between">
              <div>
                <h3 className="font-bold">{track.title}</h3>
                <p className="text-gray-600">{track.artist}</p>
                <p className="text-sm text-gray-500">{track.album}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => playTrack(track)}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  ▶️ 재생
                </button>
                {track.canDownload && (
                  <button
                    onClick={() => downloadTrack(track)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    ⬇️ 다운로드
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {currentTrack && streamUrl && (
        <AudioPlayer
          track={currentTrack}
          streamUrl={streamUrl}
          onClose={() => setCurrentTrack(null)}
        />
      )}
    </div>
  );
}
```

### 3. 관리자 - 초대 생성 페이지

```typescript
import { useState } from 'react';
import axios from 'axios';

export default function AdminInvitePage() {
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [inviteUrl, setInviteUrl] = useState<string>('');

  const createInvitation = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.post('/api/admin/invitations', {
        trackIds: selectedTracks,
        expiresInDays: 7
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setInviteUrl(res.data.invitation.inviteUrl);
    } catch (error) {
      alert('초대 생성 실패');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">초대 링크 생성</h1>

      {/* 음원 선택 UI */}
      <div className="mb-6">
        <h3 className="font-bold mb-2">할당할 음원 선택</h3>
        {/* 음원 목록 체크박스 */}
      </div>

      <button
        onClick={createInvitation}
        className="bg-blue-600 text-white px-6 py-2 rounded"
      >
        초대 링크 생성
      </button>

      {inviteUrl && (
        <div className="mt-6 p-4 bg-green-50 rounded">
          <p className="font-bold mb-2">초대 링크가 생성되었습니다!</p>
          <input
            type="text"
            value={inviteUrl}
            readOnly
            className="w-full p-2 border rounded"
          />
          <button
            onClick={() => navigator.clipboard.writeText(inviteUrl)}
            className="mt-2 bg-gray-600 text-white px-4 py-2 rounded"
          >
            복사
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## 🔒 권한 검증 로직

```typescript
// backend/src/services/track.ts

import { pool } from '../db';

export async function canUserAccessTrack(userId: string, trackId: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT EXISTS(
      SELECT 1 FROM user_tracks
      WHERE user_id = $1 AND track_id = $2
    ) AS has_access`,
    [userId, trackId]
  );

  return result.rows[0].has_access;
}

// API에서 사용
app.get('/api/tracks/:trackId/stream', authenticateToken, async (req, res) => {
  const { trackId } = req.params;
  const userId = req.user!.id;

  // 권한 검증
  const hasAccess = await canUserAccessTrack(userId, trackId);
  if (!hasAccess) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // S3 pre-signed URL 생성
  const streamUrl = await generateStreamUrl(trackId);
  res.json({ streamUrl, expiresIn: 3600 });
});
```

---

## 💰 예상 비용

```
AWS 서비스 (월):
- EC2 t3.small: $15
- RDS PostgreSQL (db.t3.micro): $15
- S3 Storage (100GB): $2.30
- CloudFront (1TB): $85

또는 Vercel + Supabase:
- Vercel Pro: $20
- Supabase Pro: $25
- S3 + CloudFront: $87

총: $117-132/월
```

**복잡도 비교**:
- 링크만 공유 (이전 설계): $10-20/월
- 초대 전용 회원제 (현재): $117-132/월
- 완전 공개 플랫폼 (최초 설계): $150+/월

---

## ✅ 개발 단계

### Phase 1: 인증 시스템 (1주)
- [ ] 데이터베이스 스키마 생성
- [ ] 회원가입 API
- [ ] 로그인 API
- [ ] JWT 인증 미들웨어

### Phase 2: 초대 시스템 (3-4일)
- [ ] 초대 생성 API
- [ ] 초대 코드 검증
- [ ] 음원 자동 할당 로직

### Phase 3: 음원 관리 (3-4일)
- [ ] 내 음원 목록 API
- [ ] 권한 검증 로직
- [ ] S3 스트리밍/다운로드

### Phase 4: UI 구현 (1주)
- [ ] 회원가입/로그인 페이지
- [ ] 내 음원 목록 페이지
- [ ] 오디오 플레이어
- [ ] 관리자 대시보드

총 개발 기간: **2-3주**

---

## 🎯 요약

### 핵심 변경사항
✅ 초대 링크 → 회원가입 → 로그인 → 음원 접근
✅ 사용자별 음원 할당 (권한 관리)
✅ JWT 인증 시스템
✅ 데이터베이스 필수 (PostgreSQL)

### 여전히 불필요한 것
❌ 공개 검색 기능
❌ 공개 음원 목록
❌ 복잡한 라이선스 워크플로우
❌ 결제 시스템

이 설계가 요구사항에 맞나요?
