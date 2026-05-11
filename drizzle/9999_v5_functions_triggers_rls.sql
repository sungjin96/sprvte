-- =============================================================================
-- Spryte v5 — Functions, Triggers, RLS, Storage policies
--
-- Run AFTER `pnpm db:push` (which creates the tables from schema.ts).
-- This file is the "everything Drizzle can't express" companion.
--
-- Idempotent: every statement uses IF NOT EXISTS, OR REPLACE, DROP+CREATE,
-- or a DO block that swallows duplicate_object — safe to re-run.
-- =============================================================================

-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ 0. Cross-schema FK constraints to auth.users                            │
-- │    (Drizzle can't reference Supabase's auth schema directly.)           │
-- └─────────────────────────────────────────────────────────────────────────┘

DO $$ BEGIN
  ALTER TABLE profiles
    ADD CONSTRAINT profiles_id_fkey
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
    NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE profiles VALIDATE CONSTRAINT profiles_id_fkey;

DO $$ BEGIN
  ALTER TABLE credit_balances
    ADD CONSTRAINT credit_balances_user_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
    NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE credit_balances VALIDATE CONSTRAINT credit_balances_user_fkey;

DO $$ BEGIN
  ALTER TABLE credit_transactions
    ADD CONSTRAINT credit_tx_user_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
    NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE credit_transactions VALIDATE CONSTRAINT credit_tx_user_fkey;

DO $$ BEGIN
  ALTER TABLE projects
    ADD CONSTRAINT projects_user_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
    NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE projects VALIDATE CONSTRAINT projects_user_fkey;

DO $$ BEGIN
  ALTER TABLE entities
    ADD CONSTRAINT entities_user_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
    NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE entities VALIDATE CONSTRAINT entities_user_fkey;

DO $$ BEGIN
  ALTER TABLE assets
    ADD CONSTRAINT assets_user_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
    NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE assets VALIDATE CONSTRAINT assets_user_fkey;

-- Coupon redemption FKs
DO $$ BEGIN
  ALTER TABLE coupon_redemptions
    ADD CONSTRAINT coupon_redemptions_coupon_fkey
      FOREIGN KEY (coupon_code) REFERENCES coupons(code) ON DELETE CASCADE
    NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE coupon_redemptions VALIDATE CONSTRAINT coupon_redemptions_coupon_fkey;

DO $$ BEGIN
  ALTER TABLE coupon_redemptions
    ADD CONSTRAINT coupon_redemptions_user_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
    NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE coupon_redemptions VALIDATE CONSTRAINT coupon_redemptions_user_fkey;

-- Asset_id FK on credit_transactions
DO $$ BEGIN
  ALTER TABLE credit_transactions
    ADD CONSTRAINT credit_tx_asset_fkey
      FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE SET NULL
    NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE credit_transactions VALIDATE CONSTRAINT credit_tx_asset_fkey;

-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ 1. CHECK constraints + partial indexes (Drizzle doesn't model these)    │
-- └─────────────────────────────────────────────────────────────────────────┘

-- Balance never negative (safety net for race-condition bugs)
DO $$ BEGIN
  ALTER TABLE credit_balances
    ADD CONSTRAINT chk_balance_nonneg CHECK (balance >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Refund idempotency: at most ONE refund tx per asset
CREATE UNIQUE INDEX IF NOT EXISTS idx_refund_per_asset
  ON credit_transactions(asset_id)
  WHERE reason = 'refund';

-- Watchdog cron — partial index for stuck assets only (not full table scan)
CREATE INDEX IF NOT EXISTS idx_assets_processing
  ON assets(processing_started_at)
  WHERE status = 'processing';

-- Coupon redemption count check
DO $$ BEGIN
  ALTER TABLE coupons
    ADD CONSTRAINT chk_coupon_redemptions_nonneg CHECK (redemptions >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ 2. Auth trigger — new user → profile + 100cr signup bonus               │
-- └─────────────────────────────────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
  -- Welcome bonus
  INSERT INTO public.credit_balances (user_id, balance)
    VALUES (NEW.id, 100);
  INSERT INTO public.credit_transactions (user_id, amount, reason)
    VALUES (NEW.id, 100, 'signup_bonus');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ 3. Atomic credit operations                                             │
-- └─────────────────────────────────────────────────────────────────────────┘

-- D1: Race-safe deduction. Single UPDATE with row lock + balance check.
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user UUID,
  p_amount INT,
  p_reason TEXT,
  p_asset_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_tx_id UUID;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'amount must be positive' USING ERRCODE = '22023';
  END IF;

  -- Atomic: WHERE clause checks balance, UPDATE locks row.
  -- Two concurrent calls: only one passes the WHERE → only one debit.
  UPDATE public.credit_balances
    SET balance = balance - p_amount,
        updated_at = NOW()
    WHERE user_id = p_user AND balance >= p_amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INSUFFICIENT_FUNDS' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.credit_transactions (user_id, amount, reason, asset_id)
    VALUES (p_user, -p_amount, p_reason, p_asset_id)
    RETURNING id INTO v_tx_id;
  RETURN v_tx_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- D2: Idempotent refund. Guarded by uniq index — duplicate calls return NULL.
CREATE OR REPLACE FUNCTION public.refund_credits_for_asset(p_asset_id UUID)
RETURNS UUID AS $$
DECLARE
  v_user   UUID;
  v_amount INT;
  v_tx_id  UUID;
BEGIN
  SELECT user_id, credits_charged INTO v_user, v_amount
    FROM public.assets WHERE id = p_asset_id;

  IF v_amount IS NULL OR v_amount <= 0 THEN RETURN NULL; END IF;

  -- Already refunded? Skip silently (idempotency).
  IF EXISTS (
    SELECT 1 FROM public.credit_transactions
      WHERE asset_id = p_asset_id AND reason = 'refund'
  ) THEN
    RETURN NULL;
  END IF;

  UPDATE public.credit_balances
    SET balance = balance + v_amount,
        updated_at = NOW()
    WHERE user_id = v_user;

  INSERT INTO public.credit_transactions (user_id, amount, reason, asset_id)
    VALUES (v_user, v_amount, 'refund', p_asset_id)
    RETURNING id INTO v_tx_id;
  RETURN v_tx_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ 4. Watchdog — auto-fail stuck "processing" assets + refund              │
-- │    Requires pg_cron extension (enabled in Supabase Dashboard).          │
-- └─────────────────────────────────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION public._watchdog_assets()
RETURNS VOID AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    UPDATE public.assets
      SET status = 'failed',
          error_message = 'Worker timeout (auto-failed by watchdog)',
          processing_started_at = NULL
      WHERE status = 'processing'
        AND processing_started_at < NOW() - INTERVAL '5 minutes'
      RETURNING id
  LOOP
    PERFORM public.refund_credits_for_asset(r.id);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Manual schedule — uncomment after enabling pg_cron extension.
-- SELECT cron.schedule('asset-watchdog', '* * * * *', $$ SELECT public._watchdog_assets(); $$);

-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ 5. Row-Level Security                                                   │
-- └─────────────────────────────────────────────────────────────────────────┘

-- Helper: is the current request from an admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- profiles: own row + admin-readable
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_profiles_self ON profiles;
CREATE POLICY p_profiles_self ON profiles
  FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());
DROP POLICY IF EXISTS p_profiles_admin_read ON profiles;
CREATE POLICY p_profiles_admin_read ON profiles
  FOR SELECT USING (public.is_admin());

-- credit_balances: own balance only (admin reads via is_admin())
ALTER TABLE credit_balances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_credit_balances_self ON credit_balances;
CREATE POLICY p_credit_balances_self ON credit_balances
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
-- INSERT/UPDATE/DELETE: SECURITY DEFINER functions only (deduct/refund).
-- No direct policy → no direct mutation possible.

-- credit_transactions: read own + admin
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_credit_tx_self ON credit_transactions;
CREATE POLICY p_credit_tx_self ON credit_transactions
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

-- projects/entities/assets: own only
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_projects_owner ON projects;
CREATE POLICY p_projects_owner ON projects
  FOR ALL USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid());

ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_entities_owner ON entities;
CREATE POLICY p_entities_owner ON entities
  FOR ALL USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid());

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_assets_owner ON assets;
CREATE POLICY p_assets_owner ON assets
  FOR ALL USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid());

ALTER TABLE entity_references ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_entity_refs_via_entity ON entity_references;
CREATE POLICY p_entity_refs_via_entity ON entity_references
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM entities e
        WHERE e.id = entity_references.entity_id
          AND (e.user_id = auth.uid() OR public.is_admin())
    )
  );

-- models: read-only for users, full for admins
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_models_read ON models;
CREATE POLICY p_models_read ON models FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS p_models_admin_write ON models;
CREATE POLICY p_models_admin_write ON models FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS p_models_admin_update ON models;
CREATE POLICY p_models_admin_update ON models FOR UPDATE USING (public.is_admin());
DROP POLICY IF EXISTS p_models_admin_delete ON models;
CREATE POLICY p_models_admin_delete ON models FOR DELETE USING (public.is_admin());

-- coupons: only admins see them; redemption is handled via SECURITY DEFINER func
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_coupons_admin ON coupons;
CREATE POLICY p_coupons_admin ON coupons FOR ALL USING (public.is_admin());

ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_coupon_redemptions_self ON coupon_redemptions;
CREATE POLICY p_coupon_redemptions_self ON coupon_redemptions
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

-- stripe_webhook_events: admin-only read (no user touches this directly)
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_stripe_webhook_admin ON stripe_webhook_events;
CREATE POLICY p_stripe_webhook_admin ON stripe_webhook_events
  FOR SELECT USING (public.is_admin());

-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ 6. Storage buckets + RLS                                                │
-- │    Bucket creation must happen in Supabase Dashboard or via the JS SDK. │
-- │    The policies below assume buckets exist with these IDs.              │
-- │    Folder convention: <user_id>/<...filename>                            │
-- └─────────────────────────────────────────────────────────────────────────┘

-- Generic owner-policy template (apply per bucket):
DROP POLICY IF EXISTS "storage_assets_owner_select" ON storage.objects;
CREATE POLICY "storage_assets_owner_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'assets' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin()));

DROP POLICY IF EXISTS "storage_assets_owner_insert" ON storage.objects;
CREATE POLICY "storage_assets_owner_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'assets' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "storage_assets_owner_update" ON storage.objects;
CREATE POLICY "storage_assets_owner_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'assets' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "storage_assets_owner_delete" ON storage.objects;
CREATE POLICY "storage_assets_owner_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'assets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Repeat above pattern for buckets: references, layers (private)
-- avatars bucket is public read; INSERT/UPDATE/DELETE require ownership:
DROP POLICY IF EXISTS "storage_references_owner_all" ON storage.objects;
CREATE POLICY "storage_references_owner_all"
  ON storage.objects FOR ALL
  USING (bucket_id = 'references' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin()))
  WITH CHECK (bucket_id = 'references' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "storage_layers_owner_all" ON storage.objects;
CREATE POLICY "storage_layers_owner_all"
  ON storage.objects FOR ALL
  USING (bucket_id = 'layers' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin()))
  WITH CHECK (bucket_id = 'layers' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "storage_avatars_public_read" ON storage.objects;
CREATE POLICY "storage_avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "storage_avatars_owner_write" ON storage.objects;
CREATE POLICY "storage_avatars_owner_write"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "storage_avatars_owner_update" ON storage.objects;
CREATE POLICY "storage_avatars_owner_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
