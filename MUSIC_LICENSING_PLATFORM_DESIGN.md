# 음악 라이선싱 플랫폼 시스템 설계

## 📋 프로젝트 개요

**목표**: Sound Republica Sync와 유사한 독자적인 음악 라이선싱 플랫폼 구축

**핵심 기능**:
- 음원 검색 및 필터링
- 오디오 스트리밍 플레이어
- 라이선스 신청 워크플로우
- 외부 다운로드 지원 (승인된 사용자)
- 관리자 대시보드

---

## 🎯 3단계 개발 전략

### Phase 1: MVP (3개월)
**목표**: 핵심 기능으로 빠른 출시

**필수 기능**:
- ✅ 사용자 인증 (회원가입/로그인)
- ✅ 음원 업로드 및 메타데이터 관리
- ✅ 기본 검색 및 필터링
- ✅ 오디오 스트리밍 플레이어
- ✅ 라이선스 신청 및 승인 워크플로우

**기술 스택**:
```yaml
frontend:
  framework: React + TypeScript
  state_management: Zustand or Redux Toolkit
  audio_player: React Player + Howler.js
  styling: Tailwind CSS or Chakra UI

backend:
  runtime: Node.js + Express + TypeScript
  authentication: JWT
  validation: Zod or Joi

database:
  primary: PostgreSQL (사용자, 음원, 라이선스)
  cache: Redis (세션, 임시 데이터)

storage:
  files: AWS S3
  cdn: CloudFront

deployment:
  containerization: Docker
  hosting: AWS EC2 or ECS
  ci_cd: GitHub Actions
```

**아키텍처 다이어그램**:
```
┌──────────────┐
│   React UI   │ ← 사용자 인터페이스
└──────┬───────┘
       │ HTTPS
       ↓
┌──────────────┐
│ Load Balancer│ ← Nginx or AWS ALB
└──────┬───────┘
       │
       ↓
┌──────────────┐
│ Express API  │ ← Node.js Backend
│  + JWT Auth  │
└──┬────────┬──┘
   │        │
   ↓        ↓
┌─────┐  ┌─────┐
│ PG  │  │Redis│ ← 데이터베이스
└─────┘  └─────┘
   │
   ↓
┌──────────────┐
│  S3 + CDN    │ ← 음원 파일 저장 및 전송
└──────────────┘
```

---

### Phase 2: 고급 기능 (3개월)
**추가 기능**:
- 🔍 Elasticsearch 기반 고급 검색
- 💳 결제 시스템 통합 (Stripe or Toss Payments)
- 📊 관리자 대시보드 확장
- 🔔 알림 시스템 (이메일 + 푸시)
- 📈 사용 통계 및 분석

**기술 추가**:
```yaml
search:
  engine: Elasticsearch
  features: 전문 검색, 자동완성, 패싯 필터

payment:
  gateway: Stripe or Toss Payments
  features: 구독, 단건 결제

notifications:
  email: SendGrid or AWS SES
  push: Firebase Cloud Messaging

analytics:
  tracking: Google Analytics + Custom Events
  monitoring: Sentry (에러 추적)
```

---

### Phase 3: 스케일링 및 최적화 (6개월)
**최적화 항목**:
- 🎵 적응형 비트레이트 스트리밍 (HLS/DASH)
- 📱 모바일 앱 (React Native)
- 🏗️ 마이크로서비스 전환 (필요 시)
- ⚡ 성능 최적화 (캐싱, CDN 최적화)
- 🔐 고급 보안 (WAF, DDoS 방어)

**기술 확장**:
```yaml
streaming:
  protocol: HLS (HTTP Live Streaming)
  encoding: FFmpeg for multi-bitrate encoding

mobile:
  framework: React Native or Flutter

infrastructure:
  orchestration: Kubernetes (트래픽 급증 시)
  message_queue: RabbitMQ or AWS SQS

security:
  waf: AWS WAF or Cloudflare
  ddos: AWS Shield
```

---

## 🗄️ 데이터베이스 스키마 설계

### PostgreSQL 스키마

```sql
-- 사용자 테이블
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user', -- user, admin
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 음원 테이블
CREATE TABLE tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  artist VARCHAR(255) NOT NULL,
  album VARCHAR(255),
  genre VARCHAR(100),
  mood VARCHAR(100),
  bpm INTEGER,
  duration INTEGER, -- 초 단위
  file_url VARCHAR(500) NOT NULL, -- S3 URL
  preview_url VARCHAR(500), -- 미리듣기 URL
  waveform_data JSONB, -- 파형 데이터
  metadata JSONB, -- 추가 메타데이터
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 라이선스 신청 테이블
CREATE TABLE licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL, -- 사용 목적
  project_name VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  admin_note TEXT, -- 관리자 메모
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 다운로드 기록 테이블
CREATE TABLE downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  license_id UUID REFERENCES licenses(id) ON DELETE SET NULL,
  ip_address INET,
  downloaded_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_tracks_genre ON tracks(genre);
CREATE INDEX idx_tracks_mood ON tracks(mood);
CREATE INDEX idx_tracks_artist ON tracks(artist);
CREATE INDEX idx_licenses_status ON licenses(status);
CREATE INDEX idx_licenses_user_id ON licenses(user_id);
CREATE INDEX idx_downloads_track_id ON downloads(track_id);
```

### Redis 캐시 전략

```yaml
session_storage:
  key: "session:{user_id}"
  ttl: 7_days

track_cache:
  key: "track:{track_id}"
  ttl: 1_hour

search_cache:
  key: "search:{query_hash}"
  ttl: 10_minutes
```

---

## 🔌 API 설계 (RESTful)

### 인증 API

```typescript
POST   /api/auth/register
  Body: { email, password, name }
  Response: { token, user }

POST   /api/auth/login
  Body: { email, password }
  Response: { token, user }

POST   /api/auth/logout
  Headers: Authorization: Bearer {token}
  Response: { message }
```

### 음원 API

```typescript
GET    /api/tracks
  Query: ?search=keyword&genre=pop&mood=happy&page=1&limit=20
  Response: { tracks[], total, page, limit }

GET    /api/tracks/:id
  Response: { track }

POST   /api/tracks/:id/stream
  Headers: Authorization: Bearer {token}
  Response: { streamUrl, expiresIn } // S3 pre-signed URL

POST   /api/tracks
  Headers: Authorization: Bearer {token}
  Body: { title, artist, file, metadata }
  Response: { track }
```

### 라이선스 API

```typescript
POST   /api/licenses
  Headers: Authorization: Bearer {token}
  Body: { trackId, purpose, projectName }
  Response: { license }

GET    /api/licenses
  Headers: Authorization: Bearer {token}
  Query: ?status=pending&page=1
  Response: { licenses[], total }

PATCH  /api/licenses/:id
  Headers: Authorization: Bearer {token} (admin only)
  Body: { status, adminNote }
  Response: { license }
```

### 다운로드 API

```typescript
POST   /api/tracks/:id/download
  Headers: Authorization: Bearer {token}
  Body: { licenseId }
  Response: { downloadUrl, expiresIn } // S3 pre-signed URL (유효기간 15분)
```

---

## 🔐 보안 설계

### 1. 인증 및 권한

```typescript
// JWT 토큰 구조
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "user" | "admin",
  "iat": 1234567890,
  "exp": 1234654290
}

// 권한 미들웨어
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};
```

### 2. S3 접근 제어

```typescript
// Pre-signed URL 생성 (스트리밍용)
const generateStreamUrl = async (trackId: string, userId: string) => {
  const track = await db.tracks.findById(trackId);

  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: track.file_url,
  });

  // 1시간 유효한 URL
  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

  // 스트리밍 로그 기록
  await db.streams.create({ userId, trackId, streamedAt: new Date() });

  return url;
};

// Pre-signed URL 생성 (다운로드용)
const generateDownloadUrl = async (trackId: string, userId: string, licenseId: string) => {
  // 라이선스 승인 여부 확인
  const license = await db.licenses.findOne({ id: licenseId, status: 'approved' });
  if (!license) throw new Error('License not approved');

  const track = await db.tracks.findById(trackId);

  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: track.file_url,
    ResponseContentDisposition: `attachment; filename="${track.title}.mp3"`,
  });

  // 15분 유효한 다운로드 URL
  const url = await getSignedUrl(s3Client, command, { expiresIn: 900 });

  // 다운로드 로그 기록
  await db.downloads.create({ userId, trackId, licenseId, downloadedAt: new Date() });

  return url;
};
```

### 3. Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

// 일반 API 요청 제한
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 최대 100개 요청
  message: 'Too many requests from this IP',
});

// 다운로드 요청 제한 (엄격)
const downloadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1시간
  max: 10, // 최대 10개 다운로드
  message: 'Download limit exceeded',
});

app.use('/api', apiLimiter);
app.use('/api/tracks/:id/download', downloadLimiter);
```

### 4. 파일 업로드 보안

```typescript
import multer from 'multer';
import { validateAudioFile } from './validators';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB 제한
  },
  fileFilter: (req, file, cb) => {
    // 오디오 파일만 허용
    const allowedMimes = ['audio/mpeg', 'audio/wav', 'audio/flac'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files allowed.'));
    }
  },
});

app.post('/api/tracks', requireAuth, requireAdmin, upload.single('file'), async (req, res) => {
  try {
    // 추가 검증 (악성 파일 차단)
    const isValid = await validateAudioFile(req.file.buffer);
    if (!isValid) throw new Error('Invalid audio file');

    // S3 업로드
    const fileKey = `tracks/${uuidv4()}.mp3`;
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: fileKey,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    }));

    // DB에 메타데이터 저장
    const track = await db.tracks.create({
      title: req.body.title,
      artist: req.body.artist,
      file_url: fileKey,
      // ... 기타 메타데이터
    });

    res.json({ track });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

---

## 🎨 프론트엔드 아키텍처

### 디렉토리 구조

```
src/
├── components/
│   ├── common/           # 공통 컴포넌트
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Modal.tsx
│   ├── audio/            # 오디오 관련
│   │   ├── AudioPlayer.tsx
│   │   ├── Waveform.tsx
│   │   └── PlaylistQueue.tsx
│   ├── tracks/           # 음원 관련
│   │   ├── TrackCard.tsx
│   │   ├── TrackList.tsx
│   │   ├── TrackDetail.tsx
│   │   └── TrackSearch.tsx
│   └── licenses/         # 라이선스 관련
│       ├── LicenseForm.tsx
│       ├── LicenseList.tsx
│       └── LicenseStatus.tsx
├── pages/
│   ├── Home.tsx
│   ├── Search.tsx
│   ├── TrackDetail.tsx
│   ├── MyLicenses.tsx
│   └── AdminDashboard.tsx
├── hooks/                # Custom Hooks
│   ├── useAuth.ts
│   ├── useAudioPlayer.ts
│   └── useTracks.ts
├── store/                # 상태 관리 (Zustand)
│   ├── authStore.ts
│   ├── playerStore.ts
│   └── trackStore.ts
├── services/             # API 서비스
│   ├── api.ts
│   ├── authService.ts
│   ├── trackService.ts
│   └── licenseService.ts
└── utils/
    ├── formatters.ts
    └── validators.ts
```

### 오디오 플레이어 구현 예시

```typescript
// store/playerStore.ts
import create from 'zustand';
import { Howl } from 'howler';

interface PlayerStore {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  howl: Howl | null;

  playTrack: (track: Track, streamUrl: string) => void;
  pause: () => void;
  resume: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  volume: 0.8,
  currentTime: 0,
  duration: 0,
  howl: null,

  playTrack: (track, streamUrl) => {
    const { howl } = get();

    // 기존 재생 중지
    if (howl) {
      howl.unload();
    }

    // 새 오디오 로드
    const newHowl = new Howl({
      src: [streamUrl],
      html5: true, // 스트리밍 최적화
      volume: get().volume,
      onplay: () => set({ isPlaying: true }),
      onpause: () => set({ isPlaying: false }),
      onend: () => set({ isPlaying: false, currentTime: 0 }),
      onload: function() {
        set({ duration: this.duration() });
      },
    });

    newHowl.play();
    set({ currentTrack: track, howl: newHowl });

    // 현재 재생 시간 업데이트
    const updateTime = setInterval(() => {
      if (newHowl.playing()) {
        set({ currentTime: newHowl.seek() as number });
      }
    }, 1000);
  },

  pause: () => {
    const { howl } = get();
    howl?.pause();
  },

  resume: () => {
    const { howl } = get();
    howl?.play();
  },

  seek: (time) => {
    const { howl } = get();
    howl?.seek(time);
    set({ currentTime: time });
  },

  setVolume: (volume) => {
    const { howl } = get();
    howl?.volume(volume);
    set({ volume });
  },
}));
```

---

## 📊 성능 최적화 전략

### 1. 프론트엔드 최적화

```typescript
// 무한 스크롤 (React Query + Intersection Observer)
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';

const TrackList = () => {
  const { ref, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['tracks'],
    queryFn: ({ pageParam = 1 }) => fetchTracks({ page: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage]);

  return (
    <div>
      {data?.pages.map((page) =>
        page.tracks.map((track) => <TrackCard key={track.id} track={track} />)
      )}
      <div ref={ref}>{isFetchingNextPage && 'Loading...'}</div>
    </div>
  );
};
```

### 2. 백엔드 캐싱

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// 캐시 미들웨어
const cacheMiddleware = (duration: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `cache:${req.originalUrl}`;
    const cached = await redis.get(key);

    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // 원래 res.json을 래핑
    const originalJson = res.json.bind(res);
    res.json = (data: any) => {
      redis.setex(key, duration, JSON.stringify(data));
      return originalJson(data);
    };

    next();
  };
};

// 사용 예시
app.get('/api/tracks', cacheMiddleware(600), async (req, res) => {
  // 10분 캐싱
  const tracks = await db.tracks.findMany();
  res.json({ tracks });
});
```

### 3. 데이터베이스 최적화

```sql
-- 전문 검색 인덱스 (PostgreSQL Full-Text Search)
ALTER TABLE tracks ADD COLUMN search_vector tsvector;

UPDATE tracks SET search_vector =
  to_tsvector('english', coalesce(title, '') || ' ' ||
                          coalesce(artist, '') || ' ' ||
                          coalesce(album, ''));

CREATE INDEX idx_tracks_search ON tracks USING GIN(search_vector);

-- 검색 쿼리
SELECT * FROM tracks
WHERE search_vector @@ to_tsquery('english', 'jazz & piano')
ORDER BY ts_rank(search_vector, to_tsquery('english', 'jazz & piano')) DESC
LIMIT 20;
```

---

## 🚀 배포 전략

### Docker 구성

```dockerfile
# Dockerfile (Backend)
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

```yaml
# docker-compose.yml (로컬 개발)
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://user:pass@db:5432/music_platform
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
    depends_on:
      - db
      - redis

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: music_platform
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### AWS 배포 (ECS)

```yaml
# Infrastructure as Code (Terraform 예시)
resource "aws_ecs_cluster" "main" {
  name = "music-platform-cluster"
}

resource "aws_ecs_task_definition" "app" {
  family                   = "music-platform-app"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"

  container_definitions = jsonencode([{
    name  = "app"
    image = "${aws_ecr_repository.app.repository_url}:latest"
    portMappings = [{
      containerPort = 3000
      protocol      = "tcp"
    }]
    environment = [
      { name = "DATABASE_URL", value = var.database_url },
      { name = "REDIS_URL", value = var.redis_url }
    ]
  }])
}

resource "aws_lb" "main" {
  name               = "music-platform-lb"
  internal           = false
  load_balancer_type = "application"
  subnets            = var.public_subnets
}
```

---

## 📈 모니터링 및 로깅

```typescript
// 에러 추적 (Sentry)
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

// 로깅 (Winston)
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// 성능 모니터링
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
});
```

---

## 💰 예상 비용 (AWS 기준, 월간)

**Phase 1 (MVP - 소규모)**:
- EC2 (t3.medium): $30
- RDS PostgreSQL (db.t3.micro): $15
- ElastiCache Redis (cache.t3.micro): $12
- S3 Storage (100GB): $2.3
- CloudFront (1TB 전송): $85
- **총 예상 비용: ~$150/월**

**Phase 2 (확장)**:
- EC2 Auto Scaling (2-4 인스턴스): $60-120
- RDS (db.t3.small): $30
- Elasticsearch (t3.small): $40
- S3 + CloudFront (5TB): $400
- **총 예상 비용: ~$600-800/월**

**Phase 3 (대규모)**:
- ECS Fargate: $200-500
- RDS (db.m5.large): $150
- Elasticsearch Cluster: $200
- S3 + CloudFront (20TB): $1,500
- **총 예상 비용: ~$2,500-3,000/월**

---

## ✅ 체크리스트

### 개발 시작 전
- [ ] 법률 자문 확보 (저작권, 개인정보 보호법)
- [ ] 음원 저작권 처리 방안 확정
- [ ] AWS 계정 및 S3 버킷 설정
- [ ] 도메인 구매 및 SSL 인증서 발급
- [ ] 개발 환경 구축 (Docker, Git)

### MVP 완료 전
- [ ] 사용자 인증 테스트
- [ ] 음원 업로드 및 스트리밍 테스트
- [ ] 라이선스 워크플로우 테스트
- [ ] 보안 검증 (OWASP Top 10)
- [ ] 성능 테스트 (동시 사용자 100명)

### 출시 전
- [ ] 베타 테스트 (실제 사용자 20명)
- [ ] 서버 모니터링 설정
- [ ] 백업 전략 수립
- [ ] 문서화 완료
- [ ] 법적 준수 재확인

---

## 📚 참고 자료

- [AWS S3 Pre-signed URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)
- [Howler.js Audio Library](https://howlerjs.com/)
- [PostgreSQL Full-Text Search](https://www.postgresql.org/docs/current/textsearch.html)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [Music Licensing Legal Guide](https://www.ascap.com/help/music-licensing-101)
