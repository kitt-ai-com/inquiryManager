# CS Manager (InquiryMaster) - 프로젝트 종합 문서

## 1. 프로젝트 개요

### 1.1 프로젝트명
**CS Manager** (코드명: InquiryMaster)

### 1.2 목적
CS(고객 상담) 내역을 효율적으로 등록/조회/수정/삭제하는 웹 기반 관리 시스템

### 1.3 핵심 가치
- 상담 내역의 빠른 등록과 조회
- 인라인 편집으로 즉각적인 데이터 수정
- 다양한 필터로 원하는 상담 빠르게 찾기
- 태그/카테고리 기반 분류 체계

---

## 2. 기술 스택

| 영역 | 기술 | 버전 |
|------|------|------|
| 프레임워크 | Next.js (App Router) | 16.1.6 |
| 언어 | TypeScript | 5.x |
| 런타임 | React | 19.x |
| 스타일링 | Tailwind CSS | v4 |
| UI 컴포넌트 | shadcn/ui (New York 스타일) | - |
| 아이콘 | Lucide React | 0.563.0 |
| 테이블 | TanStack Table | v8 |
| 서버 상태 관리 | TanStack React Query | v5 |
| DB/백엔드 | Supabase (PostgreSQL) | - |
| 검증 | Zod | v4 (zod/v4 import) |
| 날짜 처리 | date-fns (ko locale) | 4.x |
| 토스트 | Sonner | 2.x |
| 콤보박스 | cmdk | 1.x |
| 패키지 매니저 | pnpm | - |

### 2.1 주요 설정
- **Supabase URL**: `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정
- **shadcn/ui**: New York 스타일, `components.json` 참조
- **Tailwind CSS v4**: `@import "tailwindcss"` 방식, `globals.css`에 테마 변수 정의
- **Zod v4**: `import { z } from "zod/v4"` 형태로 import

---

## 3. 데이터베이스 스키마

### 3.1 ERD (Entity Relationship)

```
┌──────────┐     ┌──────────────────┐     ┌──────────┐
│ mediums  │     │  consultations   │     │ clients  │
│──────────│     │──────────────────│     │──────────│
│ id (PK)  │◄────│ medium_id (FK)   │     │ id (PK)  │
│ name     │     │ client_id (FK)   │────►│ name     │
│ is_active│     │ id (PK)          │     │ contact  │
│ created_at│    │ consulted_at     │     │ email    │
└──────────┘     │ content          │     │ address  │
                 │ status           │     │ created_at│
                 │ created_at       │     │ updated_at│
                 │ updated_at       │     └──────────┘
                 │ deleted_at       │
                 └───────┬──────┬──┘
                         │      │
            ┌────────────┘      └────────────┐
            │                                │
┌───────────┴──────────┐    ┌────────────────┴───────┐
│ consultation_tags    │    │ consultation_categories │
│──────────────────────│    │────────────────────────│
│ consultation_id (FK) │    │ consultation_id (FK)   │
│ tag_id (FK)          │    │ category_id (FK)       │
│ PK(consultation_id,  │    │ PK(consultation_id,    │
│    tag_id)           │    │    category_id)         │
└──────────┬───────────┘    └────────────┬───────────┘
           │                             │
     ┌─────┴─────┐              ┌────────┴────────┐
     │   tags    │              │ item_categories │
     │───────────│              │─────────────────│
     │ id (PK)   │              │ id (PK)         │
     │ name      │              │ name            │
     │ created_at│              │ is_active       │
     └───────────┘              │ created_at      │
                                └─────────────────┘
```

### 3.2 테이블 상세

#### consultations (상담 내역)
| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| id | UUID | PK, auto | 고유 ID |
| consulted_at | TIMESTAMPTZ | NOT NULL | 문의일자 |
| medium_id | UUID | FK → mediums | 상담매체 |
| client_id | UUID | FK → clients | 업체 |
| content | TEXT | NOT NULL, default '' | 상담내용 |
| status | TEXT | NOT NULL, default '접수' | 상태 (접수/진행/완료/보류) |
| created_at | TIMESTAMPTZ | auto | 생성일시 |
| updated_at | TIMESTAMPTZ | auto (trigger) | 수정일시 |
| deleted_at | TIMESTAMPTZ | nullable | 소프트 삭제일시 |

#### clients (업체)
| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| id | UUID | PK, auto | 고유 ID |
| name | TEXT | NOT NULL | 업체명 |
| contact | TEXT | nullable | 연락처 |
| email | TEXT | nullable | 이메일 |
| address | TEXT | nullable | 주소 |
| created_at | TIMESTAMPTZ | auto | 생성일시 |
| updated_at | TIMESTAMPTZ | auto (trigger) | 수정일시 |

#### mediums (상담매체)
| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| id | UUID | PK, auto | 고유 ID |
| name | TEXT | NOT NULL, UNIQUE | 매체명 |
| is_active | BOOLEAN | default true | 활성 여부 |
| created_at | TIMESTAMPTZ | auto | 생성일시 |

기본 데이터: 전화, 채널톡, 메일, 카카오톡, 기타

#### item_categories (문의품목)
| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| id | UUID | PK, auto | 고유 ID |
| name | TEXT | NOT NULL, UNIQUE | 품목명 |
| is_active | BOOLEAN | default true | 활성 여부 |
| created_at | TIMESTAMPTZ | auto | 생성일시 |

기본 데이터: 에어셀, 아이스팩, 에어완충재, 종이포장재, 에어쿠션, 보냉백, 박스, 테이프

#### tags (취급품목/태그)
| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| id | UUID | PK, auto | 고유 ID |
| name | TEXT | NOT NULL, UNIQUE | 태그명 |
| created_at | TIMESTAMPTZ | auto | 생성일시 |

#### consultation_tags (상담-태그 M:N)
| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| consultation_id | UUID | FK, ON DELETE CASCADE | 상담 ID |
| tag_id | UUID | FK, ON DELETE CASCADE | 태그 ID |

#### consultation_categories (상담-카테고리 M:N)
| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| consultation_id | UUID | FK, ON DELETE CASCADE | 상담 ID |
| category_id | UUID | FK, ON DELETE CASCADE | 카테고리 ID |

### 3.3 인덱스
- `idx_consultations_consulted_at` (consulted_at DESC)
- `idx_consultations_client_id` (client_id)
- `idx_consultations_status` (status)
- `idx_consultations_medium_id` (medium_id)
- `idx_consultations_deleted_at` (deleted_at)
- `idx_clients_name` (name)

### 3.4 트리거
- `trigger_consultations_updated_at` - consultations UPDATE 시 updated_at 자동 갱신
- `trigger_clients_updated_at` - clients UPDATE 시 updated_at 자동 갱신

---

## 4. API 설계

### 4.1 상담 내역 API

#### GET /api/consultations
- **설명**: 상담 목록 조회 (페이지네이션 + 필터)
- **쿼리 파라미터**:
  - `page` (기본: 1), `limit` (기본: 20, 최대: 100)
  - `search` - 업체명 또는 상담내용 텍스트 검색
  - `medium_id` - 매체 UUID 필터
  - `category_id` - 카테고리 UUID 필터 (해당 카테고리를 포함하는 상담)
  - `status` - 상태 필터 (접수/진행/완료/보류)
  - `date_from`, `date_to` - 날짜 범위 필터
- **응답**: `{ data: ConsultationWithRelations[], total, page, limit }`
- **조인**: medium, client, consultation_categories → item_categories, consultation_tags → tags

#### POST /api/consultations
- **설명**: 새 상담 등록
- **본문**: `{ consulted_at, medium_id, client_id, content, status?, category_ids?[], tag_ids?[] }`
- **처리**: 상담 생성 → 카테고리 링크 삽입 → 태그 링크 삽입
- **응답**: `{ data: ConsultationWithRelations }`

#### GET /api/consultations/[id]
- **설명**: 상담 단건 조회
- **응답**: `{ data: ConsultationWithRelations }`

#### PATCH /api/consultations/[id]
- **설명**: 상담 수정
- **본문**: 수정할 필드만 (모두 optional)
- **처리**: 상담 업데이트 → 태그 삭제/재삽입 → 카테고리 삭제/재삽입
- **응답**: `{ data: ConsultationWithRelations }`

#### DELETE /api/consultations/[id]
- **설명**: 소프트 삭제 (deleted_at 설정)
- **응답**: `{ message: "삭제되었습니다" }`

### 4.2 업체 API

#### GET /api/clients
- **설명**: 업체 목록 조회
- **쿼리**: `search` - 업체명 검색 (ilike)
- **응답**: `{ data: Client[] }`

#### POST /api/clients
- **설명**: 업체 등록
- **본문**: `{ name, contact?, address? }`
- **응답**: `{ data: Client }`

#### PATCH /api/clients
- **설명**: 업체 정보 수정 (연락처, 이메일 등)
- **본문**: `{ id, contact?, email? }`
- **응답**: `{ data: Client }`

### 4.3 카테고리 API

#### GET /api/categories
- **설명**: 활성 카테고리 목록 조회 (is_active = true)
- **응답**: `{ data: ItemCategory[] }`

#### POST /api/categories
- **설명**: 카테고리 생성
- **본문**: `{ name }`
- **응답**: `{ data: ItemCategory }`

#### DELETE /api/categories?id=...
- **설명**: 카테고리 비활성화 (is_active = false)

### 4.4 태그/매체 API

#### GET /api/tags / POST /api/tags
- 태그 목록 조회 및 생성

#### GET /api/mediums
- 활성 매체 목록 조회 (읽기 전용)

---

## 5. 프론트엔드 구조

### 5.1 파일 트리

```
src/
├── app/
│   ├── api/                          # API Route Handlers
│   │   ├── categories/route.ts
│   │   ├── clients/route.ts
│   │   ├── consultations/route.ts
│   │   ├── consultations/[id]/route.ts
│   │   ├── mediums/route.ts
│   │   └── tags/route.ts
│   ├── globals.css                   # Tailwind v4 + 테마 변수
│   ├── layout.tsx                    # 루트 레이아웃 (QueryProvider, TooltipProvider, Toaster)
│   └── page.tsx                      # 메인 페이지 (max-width: 1500px)
│
├── components/
│   ├── consultations/                # 비즈니스 컴포넌트
│   │   ├── category-manager.tsx      # 카테고리 관리 다이얼로그
│   │   ├── category-multi-select.tsx # 카테고리 다중 선택 (Command 기반)
│   │   ├── client-combobox.tsx       # 업체 검색/선택 콤보박스
│   │   ├── columns.tsx               # 테이블 컬럼 정의 (인라인 셀 포함)
│   │   ├── consultation-filters.tsx  # 필터 툴바
│   │   ├── consultation-form-dialog.tsx # 등록/수정 다이얼로그
│   │   ├── consultation-table.tsx    # 메인 테이블 (CRUD + 인라인 편집)
│   │   ├── delete-confirm-dialog.tsx # 삭제 확인 다이얼로그
│   │   ├── inline-cells.tsx          # 인라인 편집 셀 컴포넌트 (9종)
│   │   ├── status-badge.tsx          # 상태 배지
│   │   └── tag-multi-select.tsx      # 태그 다중 선택
│   └── ui/                           # shadcn/ui 기본 컴포넌트 (20종)
│
├── hooks/                            # React Query 기반 데이터 훅
│   ├── use-categories.ts
│   ├── use-clients.ts
│   ├── use-consultations.ts
│   ├── use-mediums.ts
│   └── use-tags.ts
│
├── lib/
│   ├── query-provider.tsx            # React Query 설정 (staleTime: 1분)
│   ├── supabase/
│   │   ├── client.ts                 # 브라우저용 Supabase 클라이언트
│   │   └── server.ts                 # 서버용 Supabase 클라이언트
│   ├── utils.ts                      # cn() 유틸 (clsx + tailwind-merge)
│   ├── utils/date.ts                 # formatDate, formatDateTime
│   └── validations/consultation.ts   # Zod 스키마 정의
│
└── types/
    └── database.ts                   # TypeScript 인터페이스 정의
```

### 5.2 컴포넌트 계층도

```
page.tsx
└── ConsultationTable
    ├── ConsultationFiltersToolbar
    │   ├── Input (검색, 디바운스 300ms)
    │   ├── Select (매체 필터)
    │   ├── Select (카테고리 필터) + CategoryManager
    │   ├── Select (상태 필터)
    │   ├── DatePickerFilter × 2 (시작일/종료일)
    │   └── Button (필터 초기화)
    │
    ├── Button (+ 새 상담)
    │
    ├── 일괄 작업 바 (선택 시 표시)
    │   └── Button (일괄 삭제)
    │
    ├── DataTable
    │   ├── Checkbox (행 선택)
    │   ├── InlineStatusCell (Popover → 상태 선택)
    │   ├── InlineDateCell (Popover → Calendar)
    │   ├── InlineMediumCell (Popover → 매체 선택)
    │   ├── InlineTagsCell (Popover → Command 다중 선택)
    │   ├── InlineCategoryCell (Popover → Command 다중 선택)
    │   ├── InlineContentCell (Popover → Textarea)
    │   ├── InlineClientCell (Popover → Command 콤보박스)
    │   ├── InlineContactCell (Popover → Input)
    │   ├── InlineEmailCell (Popover → Input)
    │   ├── DropdownMenu (수정/삭제)
    │   └── DataTablePagination
    │
    ├── ConsultationFormDialog
    │   ├── Select (상태)
    │   ├── Calendar (문의일자)
    │   ├── Select (상담매체)
    │   ├── TagMultiSelect (취급품목)
    │   ├── CategoryMultiSelect (문의품목)
    │   ├── ClientCombobox (업체명)
    │   ├── Input (연락처)
    │   ├── Input (이메일)
    │   └── Textarea (상담내용)
    │
    ├── DeleteConfirmDialog (단건 삭제)
    └── DeleteConfirmDialog (일괄 삭제)
```

### 5.3 데이터 흐름

```
[사용자 액션]
     │
     ▼
[React 컴포넌트] ──── onUpdate/onSubmit ────►  [React Query Mutation]
     │                                              │
     │                                              ▼
     │                                      [fetch() → API Route]
     │                                              │
     │                                              ▼
     │                                      [Zod 검증]
     │                                              │
     │                                              ▼
     │                                      [Supabase Client → PostgreSQL]
     │                                              │
     │                                              ▼
     │                                      [응답 → flattenRelations()]
     │                                              │
     ◄──── invalidateQueries ──── onSuccess ────────┘
     │
     ▼
[자동 refetch → UI 업데이트]
```

---

## 6. 주요 기능 상세

### 6.1 상담 CRUD

#### 등록
1. "새 상담" 버튼 클릭 → 다이얼로그 오픈
2. 필수: 상담매체, 업체명, 상담내용
3. 선택: 상태(기본 "접수"), 문의일자(기본 오늘), 취급품목, 문의품목, 연락처, 이메일
4. 등록 시 consultation + consultation_tags + consultation_categories 동시 생성
5. toast 성공/실패 알림

#### 조회
- 페이지네이션 (기본 20건/페이지)
- 복합 필터: 텍스트 검색, 매체, 카테고리, 상태, 날짜 범위
- 검색은 업체명 + 상담내용 대상, 디바운스 300ms

#### 수정 (2가지 방식)
1. **다이얼로그 수정**: actions 메뉴 → "수정" → 폼 다이얼로그
2. **인라인 수정**: 셀 클릭 → Popover 에디터 → 즉시 저장

#### 삭제
- 단건 삭제: actions 메뉴 → "삭제" → 확인 다이얼로그
- 일괄 삭제: 체크박스 선택 → "일괄 삭제" → 확인 다이얼로그
- 모두 소프트 삭제 (deleted_at 설정)

### 6.2 인라인 편집 (9종)

| 셀 | 에디터 | 저장 시점 |
|----|--------|----------|
| 상태 | Popover → 버튼 목록 | 선택 즉시 |
| 문의일자 | Popover → Calendar | 날짜 선택 즉시 |
| 상담매체 | Popover → 버튼 목록 | 선택 즉시 |
| 취급품목 | Popover → Command 다중 선택 | 토글 즉시 |
| 문의품목 | Popover → Command 다중 선택 | 토글 즉시 |
| 상담내용 | Popover → Textarea | 저장 버튼 / Ctrl+Enter |
| 업체명 | Popover → Command 콤보박스 | 선택 즉시 |
| 연락처 | Popover → Input | Enter / 저장 버튼 / Popover 닫힘 |
| 이메일 | Popover → Input | Enter / 저장 버튼 / Popover 닫힘 |

**구현 패턴**:
- TanStack Table의 `meta` 옵션으로 `updateField(id, field, value)` 콜백 전달
- 각 컬럼의 `cell` 함수에서 `table.options.meta.updateField` 호출
- 연락처/이메일은 `"client_contact"` / `"client_email"` 필드명으로 구분하여 clients 테이블 업데이트

### 6.3 필터 시스템

```
┌─────────────────────────────────────────────────────────┐
│ [🔍 검색...] [매체 ▾] [품목 ▾ ⚙] [상태 ▾] [시작일] [종료일] [초기화] │
└─────────────────────────────────────────────────────────┘
```

- 검색: 디바운스 300ms, 업체명 + 상담내용 대상
- 매체/카테고리/상태: Select 드롭다운
- 날짜: Calendar Popover
- 필터 변경 시 page=1로 리셋
- "초기화" 버튼으로 모든 필터 해제

### 6.4 카테고리/태그 관리
- **인라인 생성**: 검색 후 없으면 "새로 추가" 옵션 표시
- **카테고리 관리**: 필터 옆 설정 아이콘 → 별도 관리 다이얼로그
- **삭제**: 카테고리는 소프트 삭제 (is_active=false)

---

## 7. 작업 완료 내역

### Step 1: 프로젝트 초기 설정
- [x] Next.js 16 + TypeScript 프로젝트 생성
- [x] Supabase 연동 설정 (.env.local)
- [x] shadcn/ui 설치 및 설정 (New York 스타일)
- [x] TanStack Query/Table 설치
- [x] Zod v4 설치
- [x] 기본 레이아웃 구성

### Step 2: DB 스키마 + API + 기본 UI
- [x] 초기 DB 스키마 (001_initial_schema.sql)
- [x] 매체/카테고리/태그/업체/상담 테이블 생성
- [x] 시드 데이터 삽입
- [x] 모든 API Route 구현
- [x] TypeScript 인터페이스 정의
- [x] Zod 검증 스키마 정의
- [x] React Query 훅 구현
- [x] 상담 테이블 (DataTable + 페이지네이션)
- [x] 필터 툴바 구현
- [x] 업체 콤보박스 (검색 + 인라인 생성)
- [x] 태그 다중 선택
- [x] 카테고리 관리

### Step 3: 상담 등록/수정 다이얼로그
- [x] ConsultationFormDialog 구현
- [x] 등록/수정 모드 전환
- [x] 폼 검증 + 에러 처리
- [x] 삭제 확인 다이얼로그
- [x] 일괄 삭제 기능

### Step 4: 문의품목 다대다 변환 + 인라인 편집
- [x] 카테고리 1:N → M:N 마이그레이션 (003_category_many_to_many.sql)
- [x] CategoryMultiSelect 컴포넌트 생성
- [x] API 수정 (consultation_categories 조인 테이블)
- [x] 인라인 셀 컴포넌트 9종 구현
- [x] DataTable meta prop 추가
- [x] columns.tsx 인라인 셀 연결
- [x] consultation-table.tsx updateField 콜백

### Step 5: 이메일 + 연락처 버그 수정 + 화면 확장
- [x] 연락처 인라인 저장 버그 수정 (useRef로 stale closure 해결)
- [x] 이메일 컬럼 추가 (004_add_client_email.sql)
- [x] Client 타입에 email 필드 추가
- [x] InlineEmailCell 구현
- [x] 폼 다이얼로그에 이메일 입력 추가
- [x] 화면 최대 너비 1500px 확장

---

## 8. 향후 작업 (미구현)

### 8.1 우선순위 높음
- [ ] **인증/권한**: Supabase Auth 연동 (로그인/로그아웃, RLS 정책)
- [ ] **업체 관리 페이지**: 별도 페이지에서 업체 CRUD (현재는 상담 등록 시 인라인 생성만 가능)
- [ ] **데이터 내보내기**: 상담 목록 Excel/CSV 다운로드
- [ ] **대시보드**: 상담 통계 (일별/월별 건수, 상태별 분포, 매체별 비율)

### 8.2 우선순위 중간
- [ ] **다크 모드**: next-themes 이미 설치되어 있으나 토글 UI 미구현
- [ ] **정렬 기능**: 컬럼 헤더 클릭 시 정렬 (현재 서버 기본 정렬만)
- [ ] **상담 상세 보기**: 상담 클릭 시 상세 페이지 또는 사이드 패널
- [ ] **파일 첨부**: 상담에 이미지/문서 첨부 기능
- [ ] **이력 관리**: 상담 수정 이력 추적 (audit log)
- [ ] **업체별 상담 이력**: 특정 업체의 과거 상담 내역 조회

### 8.3 우선순위 낮음
- [ ] **알림**: 특정 상태 변경 시 알림 (이메일/슬랙)
- [ ] **다국어**: i18n 지원
- [ ] **모바일 최적화**: 현재 데스크톱 중심 레이아웃
- [ ] **키보드 단축키**: 빠른 등록/검색/네비게이션
- [ ] **중복 업체 병합**: 같은 업체 중복 등록 시 병합 기능

---

## 9. 환경 설정 가이드

### 9.1 로컬 개발 환경 세팅

```bash
# 1. 의존성 설치
pnpm install

# 2. 환경 변수 설정 (.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 3. Supabase에서 마이그레이션 실행 (순서대로)
# SQL Editor에서 실행:
# - supabase/migrations/001_initial_schema.sql
# - supabase/migrations/002_update_categories.sql
# - supabase/migrations/003_category_many_to_many.sql
# - supabase/migrations/004_add_client_email.sql

# 4. 개발 서버 시작
pnpm dev
# → http://localhost:3000

# 5. 빌드 확인
pnpm build
```

### 9.2 Supabase 프로젝트 설정
1. https://supabase.com 에서 새 프로젝트 생성
2. Settings → API에서 URL과 anon key 복사
3. SQL Editor에서 마이그레이션 SQL 순서대로 실행
4. Authentication은 현재 미사용 (공개 접근)

---

## 10. 코드 컨벤션 및 패턴

### 10.1 파일/폴더 규칙
- 컴포넌트: `kebab-case.tsx` (예: `consultation-table.tsx`)
- 훅: `use-kebab-case.ts` (예: `use-consultations.ts`)
- 타입: `database.ts`에 인터페이스 중앙 관리
- API: Next.js App Router 규칙 (`route.ts`)

### 10.2 상태 관리 패턴
- **서버 상태**: React Query (쿼리 키 기반 캐시 + 자동 재요청)
- **UI 상태**: React useState (필터, 다이얼로그 열림/닫힘, 선택 상태)
- **폼 상태**: React useState + useEffect로 초기화

### 10.3 인라인 편집 패턴
```
DataTable meta={{ updateField: handleInlineUpdate }}
    ↓
columns.tsx → getUpdateField(table.options.meta)
    ↓
InlineXxxCell → onUpdate(field, value)
    ↓
handleInlineUpdate(id, field, value) → mutation.mutate()
```

### 10.4 API 응답 패턴
- 성공: `{ data: ... }` (상태 200/201)
- 오류: `{ error: "메시지" }` (상태 400/404/409/500)
- 목록: `{ data: [], total, page, limit }`

### 10.5 Zod v4 사용법
```typescript
import { z } from "zod/v4";  // v4 전용 import 경로
z.uuid()                       // UUID 검증
z.iso.datetime()               // ISO 날짜 검증
z.coerce.number()              // 쿼리 파라미터 숫자 변환
```

---

## 11. 알려진 이슈 및 주의사항

### 11.1 해결된 이슈
- ~~연락처 인라인 저장 안됨~~: useRef로 stale closure 해결 (valueRef 패턴)
- ~~카테고리 단일 선택~~: M:N 조인 테이블로 다중 선택 변환 완료

### 11.2 주의사항
- Zod는 v4를 사용: `import { z } from "zod/v4"` (v3과 import 경로 다름)
- Tailwind CSS v4: `@import "tailwindcss"` 방식 (v3의 @tailwind 지시자 아님)
- 소프트 삭제: 모든 조회에서 `is("deleted_at", null)` 조건 필수
- 카테고리 필터(`category_id`)는 consultation_categories 조인 테이블을 통해 필터링
- 연락처/이메일 수정은 consultations가 아닌 clients 테이블 대상 (별도 PATCH)

---

## 12. 마이그레이션 히스토리

| 번호 | 파일 | 설명 | 상태 |
|------|------|------|------|
| 001 | `001_initial_schema.sql` | 전체 스키마 초기 생성 | 실행 완료 |
| 002 | `002_update_categories.sql` | 카테고리 시드 데이터 변경 | 실행 완료 |
| 003 | `003_category_many_to_many.sql` | 카테고리 1:N → M:N 변환 | 실행 완료 |
| 004 | `004_add_client_email.sql` | clients에 email 컬럼 추가 | 실행 완료 |
