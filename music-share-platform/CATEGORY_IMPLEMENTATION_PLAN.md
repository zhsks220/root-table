# 🎵 루트레이블 음원 카테고리 및 검색 시스템 구현 계획

## 📋 개요

음원 유통 플랫폼(Spotify, Apple Music, Melon, Genie 등)의 카테고리 분류 체계를 분석하여 루트레이블 프로젝트에 최적화된 카테고리 시스템과 검색 기능을 구현합니다.

---

## 🔬 외부 플랫폼 카테고리 분류 체계 분석

### Spotify (Every Noise at Once)
- **6,000+ 장르** 알고리즘 기반 분류
- 메인 장르 + 마이크로 장르 구조
- 지역별, 시대별, 분위기별 세분화

### Apple Music / iTunes
- **계층적 장르 구조** (Primary Genre → Sub-Genre)
- 34개 메인 장르, 300+ 서브 장르
- 국제 표준 장르 코드 사용

### 한국 플랫폼 (멜론, 지니, 벅스, FLO)
- **국내 음악 특화 카테고리**
- 발라드, 댄스, 힙합/R&B, 인디 등 한국 시장 맞춤
- OST, 트로트, CCM 등 특수 카테고리

### DistroKid / TuneCore / CD Baby
- **Primary Genre + Secondary Genre** 시스템
- 유통사 → 스트리밍 플랫폼 메타데이터 전달
- 무드(Mood), 에너지(Energy) 등 추가 속성

---

## 🎯 루트레이블 카테고리 시스템 설계

### 1. 카테고리 구조 (2-Level Hierarchy)

```
📂 Main Category (장르)
 ├── 📁 Sub Category (서브장르)
 └── 📁 Sub Category (서브장르)
```

### 2. 메인 카테고리 목록 (15개)

| ID | 카테고리 | 영문명 | 설명 |
|----|---------|--------|------|
| 1 | 팝 | Pop | 대중 음악, K-Pop 포함 |
| 2 | 힙합/랩 | Hip-Hop/Rap | 힙합, 랩, 트랩 |
| 3 | R&B/소울 | R&B/Soul | 알앤비, 소울, 네오소울 |
| 4 | 록/메탈 | Rock/Metal | 록, 얼터너티브, 메탈 |
| 5 | 일렉트로닉 | Electronic | EDM, 하우스, 테크노 |
| 6 | 발라드 | Ballad | 발라드, 어쿠스틱 |
| 7 | 댄스 | Dance | K-Pop 댄스, 클럽 뮤직 |
| 8 | 인디/얼터너티브 | Indie/Alternative | 인디 록, 인디 팝 |
| 9 | 재즈 | Jazz | 재즈, 스무스 재즈 |
| 10 | 클래식 | Classical | 클래식, 오케스트라 |
| 11 | OST/사운드트랙 | OST/Soundtrack | 영화, 드라마 OST |
| 12 | 트로트 | Trot | 트로트, 뽕짝 |
| 13 | CCM/종교 | CCM/Religious | CCM, 가스펠 |
| 14 | 국악/월드 | Traditional/World | 국악, 월드뮤직 |
| 15 | 기타 | Other | 기타 장르 |

### 3. 서브카테고리 예시

**팝 (Pop)**
- K-Pop, J-Pop, 팝 록, 신스팝, 어덜트 컨템포러리

**힙합/랩 (Hip-Hop/Rap)**
- 한국 힙합, 트랩, 붐뱁, 올드스쿨, 뉴스쿨

**일렉트로닉 (Electronic)**
- EDM, 하우스, 테크노, 트랜스, 퓨처베이스, Lo-Fi

**록/메탈 (Rock/Metal)**
- 얼터너티브 록, 팝 록, 하드 록, 메탈, 펑크

### 4. 추가 메타데이터 (선택사항)

| 필드 | 설명 | 값 예시 |
|------|------|---------|
| mood | 분위기 | 밝은, 어두운, 감성적, 에너지틱 |
| language | 언어 | 한국어, 영어, 일본어, 기타 |
| bpm | 템포 | 숫자 (60-200) |
| release_year | 발매년도 | 2024 |
| is_explicit | 성인 콘텐츠 | true/false |

---

## 🏗️ 데이터베이스 스키마 변경

### 새로운 테이블

```sql
-- 카테고리 테이블
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  display_order INTEGER DEFAULT 0,
  icon VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 트랙-카테고리 매핑 (다대다)
CREATE TABLE track_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(track_id, category_id)
);
```

### tracks 테이블 확장

```sql
ALTER TABLE tracks ADD COLUMN mood VARCHAR(50);
ALTER TABLE tracks ADD COLUMN language VARCHAR(20) DEFAULT 'ko';
ALTER TABLE tracks ADD COLUMN bpm INTEGER;
ALTER TABLE tracks ADD COLUMN release_year INTEGER;
ALTER TABLE tracks ADD COLUMN is_explicit BOOLEAN DEFAULT FALSE;
ALTER TABLE tracks ADD COLUMN description TEXT;
ALTER TABLE tracks ADD COLUMN tags TEXT[];
```

### 인덱스 추가

```sql
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_track_categories_track ON track_categories(track_id);
CREATE INDEX idx_track_categories_category ON track_categories(category_id);
CREATE INDEX idx_tracks_mood ON tracks(mood);
CREATE INDEX idx_tracks_language ON tracks(language);
CREATE INDEX idx_tracks_tags ON tracks USING GIN(tags);
```

---

## 🔌 Backend API 설계

### 카테고리 API

```
GET    /api/categories              # 전체 카테고리 조회 (트리 구조)
GET    /api/categories/:id          # 특정 카테고리 상세
POST   /api/admin/categories        # 카테고리 생성 (관리자)
PUT    /api/admin/categories/:id    # 카테고리 수정 (관리자)
DELETE /api/admin/categories/:id    # 카테고리 삭제 (관리자)
```

### 트랙 API 확장

```
GET    /api/tracks/search           # 통합 검색
       ?q={검색어}                   # 제목, 아티스트 검색
       &category={카테고리ID}        # 카테고리 필터
       &mood={분위기}                # 분위기 필터
       &language={언어}              # 언어 필터
       &sort={정렬기준}              # created_at, title, artist
       &order={정렬방향}             # asc, desc
       &page={페이지}                # 페이지네이션
       &limit={개수}                 # 페이지당 개수

POST   /api/admin/tracks            # 트랙 업로드 (카테고리 포함)
PUT    /api/admin/tracks/:id        # 트랙 수정 (카테고리 포함)
```

---

## 🎨 Frontend UI 설계

### 1. 트랙 업로드 폼 확장

```
기존 필드:
- 오디오 파일
- 제목 (필수)
- 아티스트 (필수)
- 앨범

추가 필드:
- 메인 카테고리 (필수, 드롭다운)
- 서브 카테고리 (선택, 드롭다운)
- 분위기 (선택, 드롭다운)
- 언어 (선택, 드롭다운)
- 태그 (선택, 다중 입력)
- 설명 (선택, 텍스트영역)
```

### 2. 음악 라이브러리 검색/필터 UI

```
┌─────────────────────────────────────────────────────────┐
│ 🔍 [검색어 입력...]                    [검색]            │
├─────────────────────────────────────────────────────────┤
│ 카테고리: [전체 ▼]  분위기: [전체 ▼]  언어: [전체 ▼]    │
│ 정렬: [최신순 ▼]                                        │
├─────────────────────────────────────────────────────────┤
│ 📂 팝 (12)  📂 힙합 (8)  📂 발라드 (15)  ...            │
└─────────────────────────────────────────────────────────┘
```

### 3. 카테고리 브라우징 UI

```
┌─────────────────────────────────────────────────────────┐
│ 카테고리 브라우저                                        │
├─────────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│ │ 🎵 팝   │ │ 🎤 힙합 │ │ 💜 R&B  │ │ 🎸 록   │        │
│ │ 12 곡   │ │ 8 곡    │ │ 6 곡    │ │ 4 곡    │        │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘        │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│ │ 🎹 EDM  │ │ 🎻 발라드│ │ 💃 댄스 │ │ 🎷 재즈 │        │
│ │ 5 곡    │ │ 15 곡   │ │ 7 곡    │ │ 3 곡    │        │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘        │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 구현 순서

### Phase 1: 데이터베이스 (1단계)
1. ✅ categories 테이블 생성
2. ✅ track_categories 테이블 생성
3. ✅ tracks 테이블 확장
4. ✅ 초기 카테고리 데이터 시드

### Phase 2: Backend API (2단계)
1. ✅ 카테고리 CRUD API
2. ✅ 트랙 업로드 API 수정 (카테고리 지원)
3. ✅ 검색 API 구현

### Phase 3: Frontend (3단계)
1. ✅ 업로드 폼에 카테고리 선택 추가
2. ✅ 검색/필터 UI 구현
3. ✅ 카테고리 브라우징 UI

### Phase 4: 사용자 페이지 (4단계)
1. ✅ 사용자용 검색 기능
2. ✅ 카테고리별 트랙 목록

---

## ✅ 예상 파일 변경

### Backend
- `backend/src/db/schema.sql` - 스키마 확장
- `backend/src/db/category-seed.sql` - 초기 데이터 (NEW)
- `backend/src/routes/admin.ts` - 트랙 업로드 수정
- `backend/src/routes/categories.ts` - 카테고리 API (NEW)
- `backend/src/routes/tracks.ts` - 검색 API 추가

### Frontend
- `frontend-music/src/types/index.ts` - 타입 확장
- `frontend-music/src/services/api.ts` - API 함수 추가
- `frontend-music/src/components/admin/UploadView.tsx` - 카테고리 선택 추가
- `frontend-music/src/components/admin/TracksView.tsx` - 검색/필터 추가
- `frontend-music/src/components/CategoryBrowser.tsx` - 카테고리 브라우저 (NEW)
- `frontend-music/src/components/SearchBar.tsx` - 검색바 (NEW)

---

## 🚀 예상 소요 시간

| 단계 | 예상 시간 |
|------|----------|
| Phase 1: DB 스키마 | 15분 |
| Phase 2: Backend API | 30분 |
| Phase 3: Frontend Admin | 45분 |
| Phase 4: User Pages | 30분 |
| **총 소요 시간** | **약 2시간** |

---

## ❓ 확인 사항

구현을 시작하기 전에 다음 사항을 확인해주세요:

1. **카테고리 개수**: 15개 메인 카테고리가 적당한가요?
2. **서브카테고리**: 서브카테고리도 필요한가요, 아니면 메인만?
3. **추가 메타데이터**: mood, language, bpm 등이 필요한가요?
4. **다중 카테고리**: 한 트랙에 여러 카테고리 허용?
5. **태그 시스템**: 자유 태그 입력 기능이 필요한가요?

---

**작성일**: 2024년 12월 23일
**작성자**: Claude (Architect Persona)
