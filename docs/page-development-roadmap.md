# Page Development Roadmap

> 다음 세션에서 페이지를 하나씩 **실제 개발** (mock → 백엔드 wire-up + 누락 기능 보완)로 진행하기 위한 핸드오프 문서.
> 마지막 갱신: 2026-04-29

---

## 1. 프로젝트 현황 — UI-first 단계 완료

**스택:** Next.js 15 App Router · TypeScript · Tailwind v4 · Supabase (Auth + DB + Storage) · Drizzle ORM · BullMQ + Redis · Konva.js · next-intl (ko/en) · vitest

**디자인:** 글래스모피즘 다크 · 단일 mint #00E5A0 액센트 · 120ms 표준 transition · DESIGN.md 토큰 100% 재사용

**브랜치:** `feature/phase1-scaffold-providers`

**현재 상태:**
- ✅ 전체 페이지(29개)의 UI mock 완성
- ✅ DESIGN.md 토큰 + 컴포넌트 라이브러리 갖춤
- ✅ Supabase 스키마 11개 테이블 정의 (Drizzle)
- ✅ 일부 API 라우트 실제 작동: `/api/pixelate`, `/api/compositions/*`
- ✅ 워커 2개 스캐폴드: `assetWorker.ts`, `composition-seed.ts`
- ✅ 픽셀화 알고리즘 + AI 통합 + 수동 터치업 (image-q + Replicate mock) — 실제 동작
- ✅ vitest 인프라 + 142 passing tests

**미완:**
- 대부분 페이지가 `MOCK_*` 데이터 사용 — Supabase query/mutation 연결 필요
- 인증 가드 미비 — 일부만 보호됨
- Stripe 결제 disabled (per current-focus.md)
- Real-time 업데이트 (SSE / WebSocket) 미구현
- 워커 ↔ frontend 연동 (BullMQ job 결과 UI 반영) 미구현
- E2E 테스트 없음 (Playwright는 v6 TODOS)

---

## 2. 페이지 인벤토리 (29개) + 상태 평가

각 페이지에 대해: 현재 상태 / 백엔드 의존성 / 누락 기능 / 우선순위 점수(1-10).

### Tier S — Foundation (제품 동작 필수)

| # | 경로 | 줄수 | 상태 | 백엔드 의존 | 점수 |
|---|---|---|---|---|---|
| 1 | `/[locale]/auth/login` | 230 | UI 완성, Supabase auth 연결 (signInWithPassword) | Supabase Auth | 10 |
| 2 | `/[locale]/auth/signup` | — | UI 완성, signUp 연결 | Supabase Auth | 10 |
| 3 | `/[locale]/auth/forgot-password` | — | UI 완성 | Supabase Auth | 8 |
| 4 | `/[locale]/page.tsx` (landing) | — | UI 마케팅 페이지 | 없음 | 6 |
| 5 | `/[locale]/(app)/projects` | 104 | mock 프로젝트 목록 | `projects` 테이블 query | 10 |
| 6 | `/projects/[projectId]/page.tsx` | 10 | redirect → entities | 없음 | — |

### Tier A — Core creation flow (핵심 사용자 흐름)

| # | 경로 | 상태 | 백엔드 의존 | 점수 |
|---|---|---|---|---|
| 7 | `/projects/[projectId]/entities` | mock 그리드 + Create dialog (강화됨: 프롬프트/가이드/레퍼런스 통합) | `entities`, `entity_references` insert + Storage upload | 10 |
| 8 | `/projects/[projectId]/entities/[entityId]` | mock 라이브 캔버스 + 레이어 + 채팅 + Gallery + 픽셀변환 drawer + 애니메이션 만들기 dialog | 가장 복잡: composition seed worker, layer regeneration job, asset version chain | 10 |
| 9 | `/projects/[projectId]/entities/[entityId]/guide` | mock 가이드 시트 form | `entities.guide_data` update | 6 |
| 10 | `/projects/[projectId]/assets` | mock 그리드 + 리스트 + ANIM 뱃지 + 픽셀 변환 진입 | `assets` 테이블 query (필터링) | 10 |
| 11 | `/projects/[projectId]/assets/[assetId]` | mock 상세 + Tabs (Info/Edit/History) + 픽셀 변환 + Edit Frames/Layers | `assets` query + version history (`source_asset_id`) | 9 |
| 12 | `/projects/[projectId]/assets/[assetId]/animation` | sprite_sheet 프레임 편집기 (frame strip + DnD + ⌘재생성) — UI 완성 | sprite_sheet asset metadata + BullMQ regeneration job | 8 |
| 13 | `/projects/[projectId]/assets/[assetId]/layers` | mock 레이어 편집기 | composite + layer storage | 7 |

### Tier B — Secondary (제품 깊이)

| # | 경로 | 상태 | 백엔드 의존 | 점수 |
|---|---|---|---|---|
| 14 | `/projects/[projectId]/scenes` | mock 씬 마스터 + DnD reorder | `scenes` 테이블 신설 필요 | 6 |
| 15 | `/projects/[projectId]/scenes/[sceneId]` | mock 씬 에디터 (Konva) — cascade move 실시간 동작 | `scene_placements` 테이블 | 6 |
| 16 | `/projects/[projectId]/sounds` | mock DAW 마스터 + 생성 폼 | `sounds` 또는 `assets` 타입 분기 | 5 |
| 17 | `/projects/[projectId]/sounds/[soundId]` | mock 사운드 상세 + Waveform | 위 동일 + Tone.js 또는 wavesurfer 연동 | 5 |
| 18 | `/projects/[projectId]/tools/rembg` | mock 누끼따기 | API + Replicate (또는 자체) 호출 | 6 |
| 19 | `/projects/[projectId]/settings` | 317줄 mock 설정 | `projects.settings` update | 5 |
| 20 | `/[locale]/(app)/assets` | (전역 에셋 페이지) | 위 #10과 같은 query | 4 |
| 21 | `/[locale]/(app)/queue` | 135줄 mock 큐 + 실시간 진행 표시 | BullMQ 상태 polling 또는 SSE | 7 |

### Tier C — Monetization / Account

| # | 경로 | 상태 | 백엔드 의존 | 점수 |
|---|---|---|---|---|
| 22 | `/[locale]/(app)/credits` | 248줄 — 잔액/충전/이력 mock | `credit_balances` + `credit_transactions` + Stripe (현재 disabled) | 7 |
| 23 | `/[locale]/(app)/settings` | 10줄 stub | 사용자 prefs | 3 |
| 24 | `/[locale]/(app)/settings/providers` | mock 모델 설정 | `models` 테이블 + user preferences | 4 |

### Tier D — Admin back office

| # | 경로 | 상태 | 백엔드 의존 | 점수 |
|---|---|---|---|---|
| 25 | `/[locale]/(app)/admin` | 155줄 mock 대시보드 | 통계 집계 query | 4 |
| 26 | `/[locale]/(app)/admin/usage` | mock 사용 통계 | 위 동일 | 3 |
| 27 | `/[locale]/(app)/admin/users` | mock 사용자 목록 | `profiles` query (admin only) | 3 |
| 28 | `/[locale]/(app)/admin/coupons` | mock 쿠폰 관리 | `coupons` CRUD | 3 |
| 29 | `/[locale]/(app)/admin/models` | mock 모델 라인업 | `models` CRUD | 3 |

---

## 3. 개발 우선순위 (추천 순서)

### Phase 1 — Foundation (필수 기반, ~2-3일)
1. **Auth 3페이지** (login/signup/forgot) — 이미 부분 연결됨. wire-up 마무리 + 가드 점검
2. **`/projects`** — Supabase `projects` table CRUD + 사용자별 RLS
3. **`/entities` 목록** — `entities` query + create 시 Storage upload (references)

### Phase 2 — Core creation (제품 핵심, ~4-5일)
4. **`/entities/[entityId]` 워크스페이스** — composition seed worker 실제 호출, 레이어 재생성 job queue, SSE로 진행 표시
5. **`/assets` 목록** — `assets` query + 필터 + 페이지네이션
6. **`/assets/[assetId]` 상세** — version history (`source_asset_id` chain) + 픽셀 변환 결과 영구 저장 (Storage)
7. **`/assets/[assetId]/animation`** — sprite_sheet asset metadata 업데이트 + 프레임 재생성 job

### Phase 3 — Operation (~2-3일)
8. **`/queue`** — BullMQ 상태 polling/SSE + 실시간 카드 업데이트
9. **`/credits`** — `credit_balances` 표시 + Stripe checkout (Stripe disabled면 mock 유지)
10. **Auth middleware 강화** — 모든 `(app)` 페이지 가드

### Phase 4 — Depth (~3-4일)
11. **`/scenes` + `/scenes/[sceneId]`** — `scenes` 테이블 신설 (마이그레이션) + composite asset 통합
12. **`/sounds` + `/sounds/[soundId]`** — `assets` 타입 audio 분기 + 재생/편집
13. **`/tools/rembg`** — 누끼 API 호출 + Storage 업로드

### Phase 5 — Settings / Admin (~2일)
14. **`/projects/[id]/settings`** — `projects.settings` update
15. **`/(app)/settings/providers`** — 사용자별 모델 prefs
16. **Admin 5페이지** — RLS admin role 검증 + 통계 집계 query

---

## 4. 페이지 개발 표준 흐름

각 페이지는 다음 패턴으로 진행 (다음 세션에서 페이지 진입할 때마다 반복):

### 단계 1 — Plan (`/plan-eng-review`)
- 페이지의 현재 mock 분석
- 백엔드 의존 매트릭스 (어떤 테이블/Storage/Worker/API)
- 데이터 플로우 ASCII 다이어그램
- 누락 기능 식별 + 스코프 결정
- 회귀 위험 (다른 페이지 영향)

### 단계 2 — Design Review (`/plan-design-review`, UI 변경 시)
- 누락 상태(빈/에러/로딩) 보완
- 디자인 토큰 매핑 확인

### 단계 3 — Implementation
- Supabase query 작성 (Drizzle)
- Server Component 또는 Client Component 결정
- Loading / Error boundary
- 단위 테스트 (순수 로직)
- 수동 QA

### 단계 4 — Verification
- `pnpm test` + `pnpm tsc --noEmit`
- 브라우저 시각 확인
- 다음 페이지 진행 여부 결정

---

## 5. 공통 인프라 / 우선 정비

페이지 개발 들어가기 전에 먼저 잡아야 할 횡단 사안:

1. **Supabase auth middleware** — `src/lib/supabase/middleware.ts` 점검. 보호되지 않은 페이지 식별.
2. **RLS 정책** — 마이그레이션 9999_v5_functions_triggers_rls.sql 실제 적용 상태 확인.
3. **Drizzle DB client** — `src/lib/db/index.ts` 사용 가능한지 확인. Server Component에서 직접 호출 패턴 정립.
4. **Storage 버킷** — `setup-storage.ts` 스크립트 실제 실행 여부.
5. **BullMQ 워커 deployment** — `pnpm worker` 로컬 실행 가능. Production 배포 전략은 후속.
6. **Error boundary 표준** — Next.js error.tsx / not-found.tsx 페이지별 누락 점검.

→ 이 6개를 페이지 진입 전에 **한 차례 점검**하면 페이지 개발 속도 ↑.

---

## 6. 위험 요소 / 주의 사항

- **Stripe disabled** — credits 페이지 결제 흐름은 mock 유지. 백엔드 wire-up 시 Stripe 사용 X (사용자 stated).
- **B 핸드오프 (엔티티 단위 애니메이션)** — `docs/B-entity-animation-handoff.md`. 이 작업 따로 진행 또는 페이지 개발 중 마주칠 시 deferred.
- **AI provider 비용** — Replicate `astropulse/pixelator` mock 중. 실제 호출 wire-up 시 비용 모니터링 필요.
- **사용자 워크스타일** — 후보+추천+이유 형식, 한국어, "engineered enough" (과한 추상화 X), 애매하면 질문.
- **세션 압축 위험** — 페이지 1개씩 단일 세션 권장. 큰 페이지(`entities/[entityId]`)는 2 세션 분할 가능.
- **Pre-existing 타입 에러** — `pnpm tsc --noEmit` 시 Tabs 등 일부 사전 에러 있음. 변경 영역만 클린하면 OK.

---

## 7. 다음 세션 시작용 프롬프트 (복사 붙여넣기)

```
프로젝트: game-assets-maker (Spryte) — 인디 게임 개발자용 AI 에셋 생성 SaaS.
브랜치: feature/phase1-scaffold-providers (또는 페이지별 신규 브랜치 권장 — 예: feature/auth-wire-up, feature/entities-real, ...)
모드: 실제 백엔드 개발 (UI-first → Supabase + BullMQ wire-up)

읽을 문서:
1. docs/page-development-roadmap.md — 페이지 인벤토리 + 우선순위 + 표준 흐름 (이 작업의 모든 컨텍스트)
2. docs/B-entity-animation-handoff.md — 엔티티 단위 애니메이션 별도 작업 (필요 시)
3. CLAUDE.md — 개인 메모리 + workstyle
4. DESIGN.md — 디자인 토큰
5. src/lib/db/schema.ts — DB 스키마
6. TODOS.md — deferred 작업

진행 방식:
1. 먼저 docs/page-development-roadmap.md §5 "공통 인프라 정비" 6항목 빠르게 점검 (15분)
2. Phase 1부터 시작 — 첫 페이지: Auth 3개 (login/signup/forgot)
3. 각 페이지마다:
   - /plan-eng-review 호출 → 백엔드 wire-up plan
   - 필요 시 /plan-design-review (UI 변경 시)
   - 구현 + 단위 테스트
   - 검증 (pnpm test + tsc + 브라우저)
   - 다음 페이지로
4. 큰 페이지(entities 워크스페이스 등)는 단일 세션 한 페이지만 권장

확정된 결정 (현재 세션):
- UI-first 단계 완료. 이제 페이지별 실제 개발
- 우선순위: Phase 1 (Auth + Projects + Entities 목록) → Phase 2 (Core creation) → Phase 3 (Operation) → Phase 4 (Depth) → Phase 5 (Admin)
- Stripe 결제 disabled (mock 유지)
- 각 페이지별 단일 세션 권장
- 페이지별 신규 브랜치 권장

사용자 워크스타일 (반드시):
- 후보 + 추천 + 추천 이유 형식으로 선택지 제시
- 애매하면 가정 말고 사용자에게 질문
- "engineered enough" — 과한 추상화 X, 모자란 구현 X
- 한국어 응답 (코드 식별자는 영문)
- 작업마다 memory.md 업데이트 (자율)

첫 시작:
1. roadmap §5 인프라 6항목 1줄씩 점검 (어디가 어떻게 셋업됐는지)
2. Phase 1 페이지 3개 중 어디부터 갈지 결정
3. /plan-eng-review 호출
```

---

## 8. 현재 세션에서 마무리되지 않은 항목

- Drawer 슬라이드 애니메이션 280ms — 사용자 시각 검증 미완 (다음 세션 첫 시각 확인 시 같이)
- CreateAnimationDialog mock → 다음 세션에서 BullMQ job 큐로 wire-up
- 픽셀 터치업 wheel zoom 민감도 ×1.05 — 다음 세션 사용자 피드백 따라 미세 조정
- 엔티티 워크스페이스 액션 툴바 위치 — 사용자 시각 검증 후 조정

이 4개는 페이지 개발 진행 중 자연스럽게 다듬어집니다 (별도 작업 불필요).
