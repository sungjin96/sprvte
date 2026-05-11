# TODOS

Deferred work tracked across CEO/Eng reviews. Each item: priority, effort, why it's not in the active plan, and where to start.

Active plan: `~/.gstack/projects/game-assets-maker/ceo-plans/2026-04-28-spryte-v5.md`

---

## P1 — High value, low cost (do soon)

_None at the moment_ — v5 plan covers the immediate critical path.

---

## P2 — Medium value, defer until v5 ships

### v6: 픽셀화 — AI pixelator 옵션 (Replicate astropulse)
**Why deferred**: 비AI 알고리즘이 핵심 차별점. AI는 사용자가 명시 요청 시 보조.
**Effort**: S (human ~4h / CC ~30min) — `provider` 필드 placeholder 이미 있음.
**Start**: `pixelate.ts`에서 `provider === 'replicate'` 분기 + Replicate API 호출.

### v6: 픽셀화 — Preset 라이브러리
**Why deferred**: 기본값으로 80% 사용자 만족. Preset은 UX polish.
**Effort**: S (human ~3h / CC ~30min) — 정의 + UI dropdown.
**Start**: `Game Boy (4 colors green-tint)`, `NES (54 colors)`, `PICO-8 (16 colors fixed palette)`, `Modern (32 colors)`, `Custom`.

### v6: 픽셀화 — 결과 캐싱 (Supabase Storage)
**Why deferred**: 사용자 데이터 모은 후 cost/benefit 측정. 동일 요청 빈도 미지수.
**Effort**: M (human ~1일 / CC ~2h) — input SHA256 + options hash → Storage key.
**Start**: 사용자 월 100회+ 픽셀화 요청 패턴 분석 후.

### v6: 픽셀화 — BullMQ 비동기 처리 (4096²+)
**Why deferred**: 일단 2048² pre-resize로 회피. 사용자 큰 이미지 요청 패턴 본 후.
**Effort**: M (human ~1일 / CC ~2h)
**Start**: 사용자가 4096² 명시 요청 시.

### v6: 픽셀화 — Web Worker 격리 (preview)
**Why deferred**: 메인 스레드 + debounce 100ms로 실제 lag 측정 후 결정.
**Effort**: S (human ~6h / CC ~1h) — transferable ImageData 메시지 패스.
**Start**: 사용자 lag 피드백 또는 측정 시.

### v6: 픽셀화 — 디더링 strength slider
**Why deferred**: Floyd-Steinberg default + 4종 type 옵션으로 시작. strength는 power user 기능.
**Effort**: S (human ~3h / CC ~30min) — image-q error diffusion strength.
**Start**: 사용자가 "디더링 노이즈 줄이고 싶다" 피드백 시.

### v6: 픽셀 에디터 — 모바일 정밀 터치 (Apple Pencil 압력)
**Why deferred**: 데스크탑 우선 SaaS. 모바일 정밀 픽셀 작업 사용자 패턴 미파악.
**Effort**: M (human ~1주 / CC ~1일) — pointer events + pressure API.
**Start**: iOS 사용자 5명 이상 요청 시.

### v6: 픽셀 에디터 — 키보드 cheatsheet 모달 (?)
**Why deferred**: Inspector 인라인 단축키로 80% 사용자 충분. Power user는 직접 학습.
**Effort**: S (human ~3h / CC ~30min) — `?` 키 → Dialog 모달.
**Start**: 사용자가 "단축키 모름" 피드백 시.

### v6: 픽셀 에디터 — 색상 wheel + HEX 입력
**Why deferred**: HSL 슬라이더 3개로 v5 충분. wheel은 power user 폴리싱.
**Effort**: M (human ~1일 / CC ~2h) — Canvas wheel + drag + HEX input.
**Start**: 사용자가 "정확한 색 입력" 요청 시.

### v6: 픽셀 에디터 — 색 히스토리 (최근 사용 8개)
**Why deferred**: 팔레트 + free picker로 충분. 빈도 데이터 본 후 추가.
**Effort**: S (human ~4h / CC ~30min) — recent colors LRU, palette panel 위.
**Start**: 사용자가 "최근 색 다시 쓰기 어려움" 피드백 시.

### v6: 카카오 / 네이버 OAuth
**Why deferred**: Spryte 초기 타겟(인디 개발자, 바이브코더)은 GitHub/Google 친숙도 압도적. 한국 일반 사용자 비중 늘면 추가.
**Effort**: S (human ~4h / CC ~30min) — Supabase가 카카오 정식 지원 (Naver는 community provider).
**Start**: Supabase Auth → Providers → Kakao 활성화 + redirect URL 등록.

### v6: Frame export (PNG / GIF / APNG)
**Why deferred**: 사용자 export 패턴 요청 전엔 우선순위 낮음. Sheet 1장 다운로드는 이미 가능.
**Effort**: M (human ~1일 / CC ~2h) — Canvas drawImage + `gif.js` or `apng-encoder`.
**Start**: `src/lib/animation/extractor.ts` 신설, `<a download>` 트리거. 사용자 5명 이상 요청 시.

### v6: Onion skin overlay (애니메이션 정밀 편집)
**Why deferred**: 픽셀 단위 정밀 편집은 인디 개발자 핵심 워크플로 아님. AI 생성이 우선.
**Effort**: S (human ~6h / CC ~1h) — 이전/다음 프레임을 반투명 overlay로 합성.
**Start**: `FrameInspector`에 toggle, 미리보기에 prev+1/next-1 alpha 0.3 layer.

### v6: Component 단위 테스트 인프라 (testing-library + jsdom + DnD mock)
**Why deferred**: 순수 함수 테스트(vitest)는 도입함. 컴포넌트 테스트는 jsdom의 HTML5 DnD 한계로 cost↑. Playwright 도입 시점에 통합.
**Effort**: M (human ~1일 / CC ~2h)
**Start**: `@testing-library/react` 추가, jsdom 환경, DnD는 별도 e2e.

### v6: Atlas 모드 (sprite_sheet 단일 프레임 재생성)
**Why deferred**: 시트 1장 grid 모델로 v5 충분. 단일 프레임 재생성은 사용자 명시 요청 시.
**Effort**: L (human ~1주 / CC ~1일) — `metadata.animation.atlas: { frameId, x, y, w, h, sourceAssetId }[]`.
**Start**: FrameInspector "재생성" 버튼 활성화. 현재 disabled + tooltip "Coming in v6".

### v6: Subscription 옵션 (월 무제한)
**Why deferred**: 크레딧 패턴이 인디 개발자의 *간헐적* 사용 패턴에 더 잘 맞음. 데이터 모은 후 결정.
**Effort**: M (human ~2일 / CC ~3h) — Stripe Subscription + 별도 entitlements 컬럼.
**Start**: 활성 사용자 50명 이상 + 월 100회 이상 사용자 패턴 분석.

### v6: Playwright e2e 테스트 자동화 (CI)
**Why deferred**: 1인 운영 단계에서는 수동 QA로 충분. 첫 동료 합류 시점에 도입.
**Effort**: M (human ~1일 / CC ~1h)
**Start**: GitHub Actions + Playwright + 4가지 critical path (가입 / 생성 / 결제 / 환불).

---

## P3 — Long-term vision (v7+)

### v7: 마켓플레이스 (스타일 가이드 공유)
**Why deferred**: 사용자 100명 이상 + 자체 가이드 만든 사용자 30명 이상부터 의미. 그 전엔 콘텐츠 부족.
**Effort**: L (human ~2주 / CC ~2일)
**Start**: 사용자 가이드 시트 공유 → 다른 사용자가 import → 크레딧 일부 가이드 작성자에게 분배 (revenue share).

### v7: 팀 협업 / 공유 프로젝트
**Why deferred**: Solo dev 우선 타겟. B2B 인콰이어리 들어오면 그때.
**Effort**: L (human ~3주 / CC ~3일) — `team_members` 테이블 + project share + RLS 재설계.
**Start**: 첫 팀 인콰이어리 + 최소 3명 이상 멤버 시.

### v7: 자체 fine-tune 모델
**Why deferred**: 데이터 (사용자 생성 에셋 + 평점) 충분히 쌓여야 의미. 라이센싱 검토 필요.
**Effort**: XL (human ~1개월 / CC ~1주)
**Start**: 사용자가 "좋아요" 누른 에셋 10k개 도달 시.

### v8: 인게임 미리보기
**Why deferred**: "에셋을 게임에 배치한 모습" 보여주는 기능. 별도 미니 게임 엔진 필요.
**Effort**: XL (human ~1.5개월 / CC ~10일)
**Start**: 사용자가 "이 에셋 어떻게 보일지 모르겠다" 피드백 다수 시.

### v8: Unity / Godot 패키지 export
**Why deferred**: 실제 게임 엔진 import 시점에 사용자가 더 큰 가치를 느끼는 기능.
**Effort**: M (human ~1주 / CC ~1일) — `.unitypackage` / `.tres` 포맷 spec 따라 출력.
**Start**: ZIP export 후 사용자가 수동으로 import 하는 단계 데이터 보고.

---

## Decision log

- **2026-04-28**: v4 plan → v5 plan 피벗. Self-hosted DB → Supabase, BYO API key → 크레딧 모델, 사용자 모델 설정 페이지 → admin 통계 페이지로 전환.
- **2026-04-28**: 카카오/네이버 OAuth 보류 (타겟 사용자층이 GitHub/Google 친숙).
- **2026-04-28**: 모델 9개 (3티어 × 3카테고리) 라인업 확정. 출시 후 admin 통계로 조정.
