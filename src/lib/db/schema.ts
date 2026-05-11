import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  pgEnum,
  varchar,
  integer,
  boolean,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ─────────────────────────────────────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────────────────────────────────────

export const assetTypeEnum = pgEnum("asset_type", [
  "character",
  "background",
  "ui",
  "bgm",
  "sfx",
  "sprite_sheet",
  "effect",
  "ambient",
  "reference",
]);

export const assetStatusEnum = pgEnum("asset_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);

export const entityCategoryEnum = pgEnum("entity_category", [
  "character",
  "map",
  "item",
  "ui",
  "audio",
  "effect",
]);

export const entityModeEnum = pgEnum("entity_mode", ["standard", "quality"]);

export const modelCategoryEnum = pgEnum("model_category", [
  "image",
  "audio",
  "animation",
]);

export const modelTierEnum = pgEnum("model_tier", [
  "budget",
  "balanced",
  "premium",
]);

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);

// ─────────────────────────────────────────────────────────────────────────────
// Auth-adjacent (Supabase manages auth.users; we extend in `profiles`)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 1:1 with auth.users. Created automatically via trigger on signup.
 * NOTE: cross-schema FK to auth.users is added in raw SQL migration
 * (Drizzle doesn't model the auth schema).
 */
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), // = auth.users.id
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  role: userRoleEnum("role").default("user").notNull(),
  locale: varchar("locale", { length: 8 }).default("ko"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  // Speed up admin lookup ("show me all admins")
  roleIdx: index("idx_profiles_role").on(t.role),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Credits (atomic deduction + idempotent refund — see SQL functions)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * One row per user. CHECK (balance >= 0) is added in raw SQL migration.
 */
export const creditBalances = pgTable("credit_balances", {
  userId: uuid("user_id").primaryKey(), // → auth.users.id (cross-schema)
  balance: integer("balance").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Append-only ledger. Reasons: 'purchase' | 'generation' | 'refund'
 *   | 'signup_bonus' | 'admin_grant' | 'coupon'
 */
export const creditTransactions = pgTable("credit_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  amount: integer("amount").notNull(), // negative = debit
  reason: varchar("reason", { length: 32 }).notNull(),
  assetId: uuid("asset_id"), // FK added separately to avoid circular dep
  paymentId: varchar("payment_id", { length: 255 }),
  paymentProvider: varchar("payment_provider", { length: 16 }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  userTimeIdx: index("idx_credit_tx_user_time").on(t.userId, t.createdAt),
  reasonIdx: index("idx_credit_tx_reason").on(t.reason),
  // Refund idempotency: at most one refund tx per asset (partial unique).
  // Defined as raw SQL in migration since Drizzle's partial unique is awkward.
}));

// ─────────────────────────────────────────────────────────────────────────────
// Models catalog (admin-managed, user-readable)
// ─────────────────────────────────────────────────────────────────────────────

export type LocalizedText = { en: string; ko: string };

export const models = pgTable("models", {
  id: varchar("id", { length: 64 }).primaryKey(),
  displayName: varchar("display_name", { length: 64 }).notNull(),
  description: jsonb("description").$type<LocalizedText>().notNull(),
  category: modelCategoryEnum("category").notNull(),
  tier: modelTierEnum("tier").notNull(),
  creditCost: integer("credit_cost").notNull(),
  provider: varchar("provider", { length: 32 }).notNull(),
  providerModelId: varchar("provider_model_id", { length: 128 }).notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  tags: jsonb("tags").$type<LocalizedText[]>().default([]),
  config: jsonb("config").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  catEnabledIdx: index("idx_models_cat_enabled").on(t.category, t.enabled),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Coupons (admin-issued credit codes)
// ─────────────────────────────────────────────────────────────────────────────

export const coupons = pgTable("coupons", {
  code: varchar("code", { length: 64 }).primaryKey(),
  creditAmount: integer("credit_amount").notNull(),
  maxRedemptions: integer("max_redemptions"), // null = unlimited
  redemptions: integer("redemptions").default(0).notNull(),
  expiresAt: timestamp("expires_at"),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const couponRedemptions = pgTable("coupon_redemptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  couponCode: varchar("coupon_code", { length: 64 }).notNull(),
  userId: uuid("user_id").notNull(),
  creditTxId: uuid("credit_tx_id"),
  redeemedAt: timestamp("redeemed_at").defaultNow().notNull(),
}, (t) => ({
  // 1 redemption per (coupon, user)
  uniqRedemption: uniqueIndex("uniq_coupon_user").on(t.couponCode, t.userId),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Stripe webhook idempotency (D3 from eng review)
// ─────────────────────────────────────────────────────────────────────────────

export const stripeWebhookEvents = pgTable("stripe_webhook_events", {
  eventId: varchar("event_id", { length: 128 }).primaryKey(),
  eventType: varchar("event_type", { length: 64 }).notNull(),
  payload: jsonb("payload").notNull(),
  processedAt: timestamp("processed_at"),
  receivedAt: timestamp("received_at").defaultNow().notNull(),
  errorMessage: text("error_message"),
}, (t) => ({
  // Partial index — only unprocessed rows. Speeds up "find stuck events" cron.
  unprocessedIdx: index("idx_stripe_unprocessed").on(t.receivedAt),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Existing (Phase A) — extended for v5
// ─────────────────────────────────────────────────────────────────────────────

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(), // v5: ownership
  name: text("name").notNull(),
  genre: text("genre"),
  artStyle: text("art_style"),
  colorPalette: jsonb("color_palette").$type<string[]>().default([]),
  basePrompt: text("base_prompt"),
  basePromptEn: text("base_prompt_en"),
  stylePrompt: text("style_prompt").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("idx_projects_user").on(t.userId),
}));

export const entities = pgTable("entities", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id").notNull(), // denormalized for RLS perf
  category: entityCategoryEnum("category").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  mode: entityModeEnum("mode").default("standard").notNull(),
  guideData: jsonb("guide_data").$type<Record<string, unknown>>().default({}),
  autoPrompt: text("auto_prompt"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  projectIdx: index("idx_entities_project").on(t.projectId),
  userIdx: index("idx_entities_user").on(t.userId),
}));

export const entityReferences = pgTable("entity_references", {
  id: uuid("id").defaultRandom().primaryKey(),
  entityId: uuid("entity_id")
    .references(() => entities.id, { onDelete: "cascade" })
    .notNull(),
  assetId: uuid("asset_id").notNull(), // FK to assets, set later
  referenceType: varchar("reference_type", { length: 16 }).notNull(),
});

export const assets = pgTable("assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id").notNull(), // v5: ownership (denormalized)
  entityId: uuid("entity_id"),
  name: varchar("name", { length: 128 }).default("").notNull(),
  type: assetTypeEnum("type").notNull(),
  status: assetStatusEnum("status").default("pending").notNull(),
  sourceAssetId: uuid("source_asset_id"),
  assetGroupId: uuid("asset_group_id"),
  generationParams: jsonb("generation_params").$type<Record<string, unknown>>().default({}),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  // v5 layer editor:
  layerData: jsonb("layer_data").$type<Record<string, unknown>>(),
  // v5 model + credits:
  modelId: varchar("model_id", { length: 64 }).references(() => models.id),
  creditsCharged: integer("credits_charged"),
  // v5 dead-letter watchdog (D2):
  processingStartedAt: timestamp("processing_started_at"),
  // Phase 1 fields:
  providerUsed: text("provider_used"),
  modelUsed: text("model_used"),
  fileUrl: text("file_url"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  projectIdx: index("idx_assets_project").on(t.projectId),
  userIdx: index("idx_assets_user").on(t.userId),
  entityIdx: index("idx_assets_entity").on(t.entityId),
  // Note: partial index `idx_assets_processing` (WHERE status='processing')
  // for watchdog cron is added in raw SQL migration — Drizzle's partial
  // index API doesn't yet support enum equality cleanly.
}));

// ─────────────────────────────────────────────────────────────────────────────
// Inferred types (for app code)
// ─────────────────────────────────────────────────────────────────────────────

export type Profile = typeof profiles.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Entity = typeof entities.$inferSelect;
export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;
export type Model = typeof models.$inferSelect;
export type CreditBalance = typeof creditBalances.$inferSelect;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type Coupon = typeof coupons.$inferSelect;
export type StripeWebhookEvent = typeof stripeWebhookEvents.$inferSelect;
