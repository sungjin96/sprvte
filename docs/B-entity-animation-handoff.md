# B — 엔티티 단위 애니메이션 (핸드오프)

> 다른 Claude Code 세션에서 이 작업을 이어가기 위한 자체 완결 컨텍스트.
> 마지막 라운드: 2026-04-29.
> 직전 작업: 엔티티 워크스페이스 다듬기 + 애니메이션 편집 화면(에셋 단위) + 엔티티 생성 모달 강화.

---

## 1. 프로젝트 컨텍스트

**game-assets-maker (Spryte)** — 인디 게임 개발자용 AI 에셋 생성 SaaS.

**스택:**
- Next.js 15 (App Router) + Tailwind v4 + TypeScript
- Supabase (Postgres + Auth + Storage)
- BullMQ + Redis (워커 큐)
- Konva.js (캔버스)
- next-intl (ko/en, ko 기본)
- vitest (순수 함수 테스트)

**디자인:**
- 글래스모피즘 다크, mint #00E5A0 단일 액센트
- 토큰 100% 재사용 (`var(--neon)`, `var(--g0/g1/g2)`, `var(--border)`, `var(--text/text-2/text-3)`)
- 레퍼런스: [DESIGN.md](../DESIGN.md)

**모드:** UI-first (mock 데이터, 백엔드는 stub) — 점진적 backend 통합.

**브랜치:** `feature/phase1-scaffold-providers` (현재 작업 브랜치)

---

## 2. 사용자 비전 (B의 핵심)

직전 세션에서 사용자가 reframe 한 내용:

> 애니메이션 편집이 사실 모든 엔티티에 다 있을 수 있어. 그런데 전체 에셋에서만 볼 수 있는게 맞을까?
> 엔티티 페이지에서도 애니메이션을 프롬프트 받아서 AI 로 프레임마다 생성하는 기능과 애니메이션 편집 수정 기능, 미리 보기 기능,
> 그리고 그 기준점? 중앙? 그거 설정하는 것도 있던데 이 설정도, 각 이미지, 즉 프레임 별로 어느정도 영역?해상도?로 사용할지 설정하는것도 있어야 할 것 같은데?

**핵심 모델 변화:**
- 현재: `Asset.type === 'sprite_sheet'`인 단일 시트 (grid metadata) — 1 sprite_sheet asset = 1 animation
- 제안: `Entity → animations: Animation[]` — 1 entity = N animations (idle / walk / attack / die / ...), 각 animation = N frames

**추가 요구:**
- AI로 프레임마다 생성 (프롬프트 받아서)
- 애니메이션 편집 + 미리보기 (이미 에셋 단위는 만들어짐, 엔티티 단위 통합 필요)
- **앵커/피벗 포인트** 설정 (애니메이션 단위)
- **각 프레임별 영역/해상도** 설정

---

## 3. 직전 라운드에서 확정된 결정 (a/a/a/a)

**B-Q1. 데이터 모델 위치:** Entity 레벨 (`Entity.animations: Animation[]`)
- 이유: 엔티티가 캐릭터의 정체성 + 모든 상태(애니메이션) 컨테이너 → 자연스러움.
- 별도 Animation 테이블도 가능하나 entity 1:N 관계가 명확하므로 entity-embedded 또는 1:N 테이블 둘 다 OK. 구현 시 결정.

**B-Q2. sprite_sheet asset과의 관계:** Animation 편집 결과를 export 시 sprite_sheet asset으로 자동 변환
- 외부 export(Aseprite/Unity 등)는 sprite_sheet 형식 표준 → entity-level animation에서 export 트리거 시 sprite_sheet asset 생성.
- entity-level은 워킹 모델, sprite_sheet은 export artifact.

**B-Q3. Pivot/anchor 단위:** Animation 단위 (전 프레임 동일 pivot)
- 게임 엔진(Unity, Godot)도 보통 sprite per-pivot 1개. 단순함 우선.
- per-frame override는 v6+ 기능으로 보류.

**B-Q4. Frame 영역/해상도 단위:** Animation 단위 (모든 프레임 동일 크기)
- 게임 스프라이트 표준 (예: 64x64 모든 프레임).
- 가변 크기는 v6+.

---

## 4. 현재 코드 상태 (참고할 기존 자산)

### 이미 만들어진 것

**에셋 단위 애니메이션 편집기** ([src/components/animation/](../src/components/animation/))
- `AnimationEditor.tsx` — 3-pane 레이아웃 (Preview ↕ Strip / Inspector), `requestAnimationFrame` 재생 루프, 가변 duration, ping-pong
- `FrameStrip.tsx` — 가로 스트립, HTML5 DnD reorder, 컨텍스트 메뉴, 재생 중 frame sync (mint glow), 클릭 = 일시정지+점프
- `FrameInspector.tsx` — fps / loop mode / per-frame duration / 재생성(disabled, "v6에 옴")
- 라우트: [src/app/[locale]/(app)/projects/[projectId]/assets/[assetId]/animation/page.tsx](../src/app/[locale]/(app)/projects/[projectId]/assets/[assetId]/animation/page.tsx)

**애니메이션 핵심 라이브러리** ([src/lib/animation/](../src/lib/animation/))
- `normalize.ts` — `normalizeAnimationMeta(raw)` + `readAnimationMeta(metadata)` — sparse data sanitize
- `operations.ts` — `addFrame / removeFrame / duplicateFrame / reorderFrame / setFrameDuration / setFps` (모두 순수 함수)
- `__tests__/` — 31개 테스트 통과

**타입** ([src/types/asset.ts](../src/types/asset.ts))
- `AnimationSettings { gridCols, gridRows, frameCount, fps, loop, frameOrder, frameDurations }`
- `AnimationLoopMode = 'loop' | 'once' | 'pingpong'`
- `MIN_FRAME_COUNT = 1`, `MAX_FRAME_COUNT = 64`

**엔티티 워크스페이스** ([src/app/[locale]/(app)/projects/[projectId]/entities/[entityId]/page.tsx](../src/app/[locale]/(app)/projects/[projectId]/entities/[entityId]/page.tsx))
- 좌측: 가이드 시트 + 레퍼런스 이미지 + LayerStack
- 우측: Live(LiveCanvas + LiveChat) / Gallery(스냅샷) tabs
- `LiveLayer` 트리 구조 (parentId, isGroup, expanded 등)

**엔티티 생성 모달 강화 (직전 라운드)** ([src/components/entity/EntityCreateForm.tsx](../src/components/entity/EntityCreateForm.tsx))
- 프롬프트, 모델, 출력 크기, 네거티브, quality 시 가이드 시트 + 레퍼런스 업로드 통합

**레이어 트리 헬퍼** ([src/types/liveLayer.ts](../src/types/liveLayer.ts))
- `getDescendantIds`, `wouldCreateCycle`, `buildLayerTree`, `flattenForDisplay`

**레이어 operations** ([src/lib/layers/operations.ts](../src/lib/layers/operations.ts)) — Entity Animation에 동일 패턴 차용 가능

### 재사용 가능한 패턴
- `ResizableSplit` (3-pane 레이아웃)
- `ContextMenu` (우클릭 메뉴)
- `Dialog` (모달, max-h + overflow-y-auto 적용됨)
- `OutputSizeSelector` (regular / 8~512 픽셀 사이즈)
- `templateToMockLayers(category)` 패턴 — 카테고리별 mock 데이터 생성기

---

## 5. B 작업 — 구현 outline (큰 그림)

### Phase 1 — 데이터 모델 + 마이그레이션 매핑

**새 타입 (안):**
```ts
// src/types/animation.ts (NEW)

export interface Animation {
  id: string;
  entityId: string;
  name: string;              // "idle", "walk", "attack" 등
  state: AnimationState;     // 표준 enum
  width: number;             // 모든 프레임 공통 크기 (B-Q4)
  height: number;
  pivot: { x: number; y: number };  // 0~1 정규화 (B-Q3, animation 단위)
  fps: number;
  loop: 'loop' | 'once' | 'pingpong';
  frames: AnimationFrame[];
}

export interface AnimationFrame {
  id: string;
  index: number;             // 재생 순서
  imageUrl: string | null;
  prompt: string;            // 이 프레임의 AI 생성 프롬프트
  duration: number;          // ms
  status: 'idle' | 'generating' | 'failed';
}

export type AnimationState = 'idle' | 'walk' | 'run' | 'attack' | 'jump' | 'die' | 'custom';
```

**Entity 확장:**
```ts
// src/types/entity.ts
export interface Entity {
  // ... 기존 필드
  animations?: Animation[];  // optional, audio entity는 비어있음
}
```

### Phase 2 — UI 통합

**엔티티 워크스페이스에 새 탭 또는 섹션:**
- 옵션 A: 우측 Tabs에 "Animations" 추가 (Live / Gallery / Animations)
- 옵션 B: 좌측 LayerStack 아래 "Animations" Accordion
- 옵션 C: 별도 라우트 `/projects/[id]/entities/[id]/animations`

→ Plan eng review에서 결정. **추천: A** (Live/Gallery와 같은 위계, 사용자가 모드 전환 명확)

**컴포넌트:**
- `AnimationsList` — 이 엔티티의 애니메이션 목록 (idle/walk/attack 등 카드)
- `AnimationEditor` — 기존 에셋 단위 에디터 재사용 가능 (단, sprite_sheet metadata 대신 Animation 객체)
- 새 Animation 생성 모달 — name + state + width/height + fps + 첫 프레임 프롬프트

**프레임별 AI 생성:**
- `FrameInspector`에 프롬프트 입력 + "재생성" 버튼 활성화 (현재 disabled)
- `LiveChat`처럼 프롬프트 → mock 시뮬레이션 → frame.imageUrl 업데이트

**Pivot 설정 UI:**
- AnimationEditor preview 영역에 pivot 마커 (mint dot, 드래그 가능)
- 또는 inspector에 x/y 슬라이더 (0~1)
- 게임 엔진처럼 보조선(crosshair)으로 시각 표시

### Phase 3 — sprite_sheet export

**Animation → sprite_sheet asset 변환:**
- "Export as Sprite Sheet" 버튼
- 백엔드 워커: 모든 frames imageUrl → 단일 시트 합성 (server-side Canvas/sharp)
- 결과를 새 Asset 생성 (`type: 'sprite_sheet'`, `metadata.animation = AnimationSettings 변환`)
- 외부 import 시 grid 레이아웃 그대로

### Phase 4 — 애니메이션 발견성

직전 라운드에서 일부 처리됨 (에셋 카드 ANIM 뱃지, hover 시 ▶ 버튼). 추가 가능:
- 사이드바 Workspace 섹션에 "Animations" 메뉴 (= 모든 엔티티의 애니메이션 합쳐서 보기)
- 엔티티 카드에 애니메이션 카운트 ("3 animations") 표시

---

## 6. 열려있는 질문 (다음 세션에서 결정)

1. Animation을 Entity 안에 embed (JSONB) vs 별도 `animations` 테이블 (1:N)?
   - JSONB: 단순, but 쿼리 어려움
   - 별도 테이블: 정규화, "fps>20 애니메이션 모두 보기" 같은 쿼리 가능
   - **추천: 별도 테이블** (Spryte 확장성 우선 워크스타일과 일치)

2. AnimationEditor 컴포넌트를 sprite_sheet/animation 둘 다 지원하게 generic하게 만들지 vs 별도 컴포넌트?
   - sprite_sheet은 시트 1장 + grid, animation은 N개 프레임 imageUrl
   - 데이터 모양 차이 큼 → **추천: 별도 컴포넌트** (`AnimationEditor.tsx` 기존 = SpriteSheetEditor로 rename, 새 컴포넌트 신설)
   - 또는 internal adapter 함수로 둘 다 frame[] 형태로 변환 후 같은 view 컴포넌트 사용

3. Pivot UI: drag dot vs slider vs 둘 다?
   - drag dot이 직관적, slider가 정밀
   - **추천: drag dot 메인 + 우클릭 메뉴 "정확한 값 입력"**

4. 엔티티 카테고리별 default animations:
   - character: idle / walk / attack 자동 생성?
   - effect: 단일 "play" 애니메이션?
   - **추천: 사용자가 "+ 새 애니메이션" 클릭 시 selectedState만 빈 상태로 시작** (auto-creation은 v6+)

5. AI 프레임 생성의 일관성 (frame N→N+1 자연스러운 흐름):
   - 단순 prompt: 프레임마다 다 따로 생성 → 시각 불일치
   - reference frame: 이전 프레임 이미지를 reference로 (img2img)
   - **추천: 첫 프레임은 prompt only, 이후 프레임은 prev frame as reference** (UI는 단순 prompt 받고 internal로 처리)

---

## 7. NOT in scope (B 작업에서 제외할 것)

- Per-frame pivot/area override (v6+)
- 외부 imports (.psd, .ase) → animation 변환 (별도 후속)
- AI 자동 카테고리 감지로 default 애니메이션 생성 (v6+)
- Animation 단위 export 옵션 다양화 (GIF, APNG, MP4) — sprite_sheet만 우선
- entity-level animation의 layer 통합 (entity-level은 layered, animation도 layered하면 복잡도 폭발 → animation은 flat frames 우선)

---

## 8. 검증 기준 (acceptance)

이 라운드 완료 시:
- [ ] Animation 데이터 모델 + 단위 테스트
- [ ] 엔티티 워크스페이스에서 애니메이션 목록 확인 + 새 애니메이션 생성 가능 (mock)
- [ ] 애니메이션 에디터에서 프레임별 프롬프트 입력 → mock 재생성 → 새 프레임 표시
- [ ] Pivot 시각화 + 변경 가능
- [ ] 에셋 단위 애니메이션 에디터 (sprite_sheet)는 그대로 동작 (regression 없음)
- [ ] `pnpm test` 모두 통과
- [ ] `pnpm tsc --noEmit` 변경 영역 클린

---

## 9. 다른 세션 시작용 프롬프트 (복사 붙여넣기)

```
프로젝트: game-assets-maker (Spryte) — 인디 게임 개발자용 AI 에셋 생성 SaaS.
브랜치: feature/phase1-scaffold-providers (또는 새 브랜치 feature/entity-animation 생성).
모드: UI-first (mock OK).
참고: docs/B-entity-animation-handoff.md 를 먼저 읽어주세요. 위 문서가 작업의 모든 컨텍스트를 담고 있습니다.

작업 명: 엔티티 단위 애니메이션 (B)

핵심 요청:
1. Entity → Animation[] 데이터 모델 신설 (handoff 문서 §5 Phase 1 참고)
2. 엔티티 워크스페이스에 애니메이션 편집/생성 통합
3. 프레임별 AI 생성 (프롬프트 입력)
4. Pivot/anchor (animation 단위) 설정 UI
5. 모든 프레임 동일 영역/해상도 (animation 단위)
6. sprite_sheet export 변환

진행 방식:
1. handoff 문서 §6 의 열려있는 질문 5개를 먼저 사용자에게 후보+추천+이유 형식으로 제시 후 결정 받기
2. /plan-eng-review 호출하여 데이터 모델 / 컴포넌트 분리 / 마이그레이션 / 성능 검토
3. 작은 단위로 점진 구현 (handoff 문서 §5 Phase 1→4 순서)
4. 각 단계마다 vitest로 순수 함수 테스트, dev 서버에서 시각 확인
5. 사용자 메모리 규칙 준수: 후보+추천+이유, 애매하면 가정 말고 질문, 한국어 응답

확정된 결정 (직전 세션):
- 데이터 모델: Entity 레벨 (B-Q1.a)
- sprite_sheet 관계: animation export → sprite_sheet asset 자동 생성 (B-Q2.a)
- Pivot 단위: animation 단위 (B-Q3.a)
- Frame 영역 단위: animation 단위 (B-Q4.a)

다른 디자인 리뷰 미처리 항목 (S2/A1/A2/B2)도 같은 영역에 있으니 자연스럽게 포함 가능 (별도 결정).

스타일 가이드:
- DESIGN.md 토큰 100% 재사용 (mint #00E5A0 단일 액센트)
- 글래스모피즘 다크
- ko/en i18n (ko 기본)
- 사용자 워크스타일: 확장성 우선, 모듈화, AI 협업, 테스트 중요시

먼저 §6 질문부터 검토하고 시작해주세요.
```
