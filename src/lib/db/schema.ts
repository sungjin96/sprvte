import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";

export const assetTypeEnum = pgEnum("asset_type", [
  "character",
  "background",
  "ui",
  "bgm",
  "sfx",
  "sprite_sheet",
]);

export const assetStatusEnum = pgEnum("asset_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  genre: text("genre").notNull(),
  artStyle: text("art_style").notNull(),
  colorPalette: jsonb("color_palette").$type<string[]>().default([]),
  basePrompt: text("base_prompt").notNull(),
  stylePrompt: text("style_prompt").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const assets = pgTable("assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  type: assetTypeEnum("type").notNull(),
  sourceAssetId: uuid("source_asset_id"),
  assetGroupId: uuid("asset_group_id"),
  generationParams: jsonb("generation_params").$type<Record<string, unknown>>().default({}),
  providerUsed: text("provider_used"),
  modelUsed: text("model_used"),
  status: assetStatusEnum("status").default("pending").notNull(),
  errorMessage: text("error_message"),
  fileUrl: text("file_url"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;
