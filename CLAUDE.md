# CS Manager (InquiryMaster) - Claude Context

## 프로젝트
CS(고객 상담) 내역 관리 웹 시스템. 상담 등록/조회/수정/삭제 + 인라인 셀 편집 지원.

## 기술 스택
- **Next.js 16.1.6** (App Router) + **TypeScript** + **React 19**
- **Tailwind CSS v4** (`@import "tailwindcss"` 방식) + **shadcn/ui** (New York 스타일)
- **TanStack Query v5** (서버 상태) + **TanStack Table v8** (테이블)
- **Supabase** (PostgreSQL) - `.env.local`에 URL/KEY 설정
- **Zod v4** - `import { z } from "zod/v4"` (v3과 import 경로 다름!)
- **pnpm** 패키지 매니저

## 핵심 명령어
```bash
pnpm dev      # 개발 서버 (localhost:3000)
pnpm build    # 프로덕션 빌드
```

## 프로젝트 구조
- `src/app/api/` - API Route Handlers (consultations, clients, categories, tags, mediums)
- `src/components/consultations/` - 비즈니스 컴포넌트 (테이블, 폼, 인라인 셀, 필터 등)
- `src/components/ui/` - shadcn/ui 기본 컴포넌트
- `src/hooks/` - React Query 기반 데이터 훅 (use-consultations, use-clients 등)
- `src/lib/validations/` - Zod 검증 스키마
- `src/types/database.ts` - 모든 TypeScript 인터페이스
- `supabase/migrations/` - DB 마이그레이션 SQL (001~004)

## 주의사항
- **Zod v4**: `import { z } from "zod/v4"` 사용 (v3 아님)
- **Tailwind v4**: `@import "tailwindcss"` 방식
- **소프트 삭제**: 상담 조회 시 항상 `is("deleted_at", null)` 필터
- **연락처/이메일 수정**: consultations가 아닌 clients 테이블 대상 (`"client_contact"`, `"client_email"` 필드명)
- **인라인 편집**: TanStack Table `meta` → `updateField(id, field, value)` 콜백 패턴

## 상세 문서
전체 기획서, 요구사항, DB 스키마, API 설계, 컴포넌트 구조, 작업 내역, 향후 계획은 `docs/PROJECT_SPECIFICATION.md` 참조.
