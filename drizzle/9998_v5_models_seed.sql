-- =============================================================================
-- Spryte v5 — Models seed (9 models: 3 tiers × 3 categories)
--
-- Idempotent: ON CONFLICT DO UPDATE so re-running adjusts pricing/desc.
-- Run AFTER 9999_v5_functions_triggers_rls.sql (which sets up RLS).
-- =============================================================================

INSERT INTO models (id, display_name, description, category, tier, credit_cost,
                    provider, provider_model_id, enabled, tags, config)
VALUES
  -- ── Image ──────────────────────────────────────────────────────────────
  ('replicate-sdxl-lightning', 'SDXL Lightning',
   '{"en":"Fast SDXL model. Great for quick iteration and large batches. Lower fidelity than premium tiers.","ko":"빠른 SDXL 모델. 빠른 반복 작업과 대량 생성에 적합. 프리미엄 대비 충실도는 낮음."}'::jsonb,
   'image', 'budget', 4,
   'replicate', 'bytedance/sdxl-lightning-4step', TRUE,
   '[{"en":"Fast","ko":"빠름"},{"en":"Cheap","ko":"가성비"}]'::jsonb,
   '{"steps":4,"width":1024,"height":1024}'::jsonb),

  ('replicate-flux-schnell', 'FLUX.1 [schnell]',
   '{"en":"Balanced quality and speed. Strong prompt adherence, ideal for character art and detailed sprites.","ko":"품질과 속도의 균형. 프롬프트 추종성이 좋아 캐릭터·세밀 스프라이트에 적합."}'::jsonb,
   'image', 'balanced', 8,
   'replicate', 'black-forest-labs/flux-schnell', TRUE,
   '[{"en":"Balanced","ko":"균형"},{"en":"Recommended","ko":"추천"}]'::jsonb,
   '{"go_fast":true,"output_format":"png"}'::jsonb),

  -- NOTE: GPT-Image-2 starts disabled; flip to true once OpenAI access confirmed.
  -- Contingency: swap provider_model_id to 'imagen-3' on Vertex AI if access blocked.
  ('openai-gpt-image-2', 'GPT-Image-2',
   '{"en":"OpenAI flagship (released 2026.04). Best-in-class composition and prompt understanding. Premium pricing.","ko":"OpenAI 최신 플래그십 (2026.04 출시). 구도와 프롬프트 이해도 최상급. 프리미엄 가격."}'::jsonb,
   'image', 'premium', 30,
   'openai', 'gpt-image-2', FALSE,
   '[{"en":"Best quality","ko":"최고 품질"},{"en":"New","ko":"신규"}]'::jsonb,
   '{"size":"1024x1024","quality":"high"}'::jsonb),

  -- ── Audio ──────────────────────────────────────────────────────────────
  ('mubert-bgm', 'Mubert',
   '{"en":"AI BGM with genre, mood, and BPM control. Loop-friendly outputs ideal for game background music.","ko":"장르·분위기·BPM 조절 가능한 AI BGM. 루프 친화적이라 게임 배경음악에 적합."}'::jsonb,
   'audio', 'budget', 6,
   'mubert', 'mubert-v3', TRUE,
   '[{"en":"BGM","ko":"BGM"},{"en":"Loops","ko":"루프"}]'::jsonb,
   '{"duration":30,"format":"mp3"}'::jsonb),

  ('elevenlabs-sfx', 'ElevenLabs SFX',
   '{"en":"Text-to-sound effect. Best for short, unique SFX (impacts, UI clicks, ambient one-shots).","ko":"텍스트로 효과음 생성. 짧고 독특한 SFX (타격감·UI 클릭·앰비언트)에 최적."}'::jsonb,
   'audio', 'balanced', 3,
   'elevenlabs', 'eleven_sfx_v1', TRUE,
   '[{"en":"SFX","ko":"효과음"},{"en":"Short","ko":"짧음"}]'::jsonb,
   '{"max_duration":10}'::jsonb),

  -- D7 from eng review: Suno v4 swapped for Stability Audio (no official Suno API).
  ('stability-audio', 'Stability Audio 2',
   '{"en":"Full-song BGM with vocals/instruments. Premium tier — use for theme songs and key moments.","ko":"보컬·악기까지 포함된 풀 송 BGM. 프리미엄 티어 — 테마송이나 주요 장면용."}'::jsonb,
   'audio', 'premium', 25,
   'stability', 'stable-audio-2.0', FALSE,
   '[{"en":"Full song","ko":"풀 송"},{"en":"Premium","ko":"프리미엄"}]'::jsonb,
   '{"duration":47}'::jsonb),

  -- ── Animation ──────────────────────────────────────────────────────────
  ('autosprite', 'AutoSprite',
   '{"en":"Algorithmic sprite-sheet generation from a base image. No AI cost — fastest, cheapest path.","ko":"기준 이미지로 알고리즘 기반 스프라이트 시트 생성. AI 호출 없음 — 가장 빠르고 저렴."}'::jsonb,
   'animation', 'budget', 5,
   'autosprite', 'autosprite-v1', TRUE,
   '[{"en":"Algorithm","ko":"알고리즘"},{"en":"Cheapest","ko":"최저가"}]'::jsonb,
   '{}'::jsonb),

  ('replicate-animatediff', 'AnimateDiff',
   '{"en":"AI-driven sprite animation from a single frame. Better motion variety than AutoSprite.","ko":"한 장의 프레임으로 AI 기반 스프라이트 애니메이션. AutoSprite보다 동작 다양성 우수."}'::jsonb,
   'animation', 'balanced', 15,
   'replicate', 'lucataco/animate-diff', TRUE,
   '[{"en":"AI motion","ko":"AI 모션"},{"en":"Versatile","ko":"다용도"}]'::jsonb,
   '{"frames":16,"fps":8}'::jsonb),

  ('runway-gen3-turbo', 'Runway Gen-3 Turbo',
   '{"en":"Premium video model adapted for sprite cycles. Highest fidelity — use for hero animations.","ko":"스프라이트 사이클로 활용한 프리미엄 비디오 모델. 최고 충실도 — 히어로 애니메이션용."}'::jsonb,
   'animation', 'premium', 40,
   'runway', 'gen3a_turbo', FALSE,
   '[{"en":"Top fidelity","ko":"최상 품질"},{"en":"Slow","ko":"느림"}]'::jsonb,
   '{"duration":5}'::jsonb)

ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  tier = EXCLUDED.tier,
  credit_cost = EXCLUDED.credit_cost,
  provider = EXCLUDED.provider,
  provider_model_id = EXCLUDED.provider_model_id,
  tags = EXCLUDED.tags,
  config = EXCLUDED.config,
  updated_at = NOW();
