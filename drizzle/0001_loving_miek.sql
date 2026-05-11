CREATE TYPE "public"."entity_category" AS ENUM('character', 'map', 'item', 'ui', 'audio', 'effect');--> statement-breakpoint
CREATE TYPE "public"."entity_mode" AS ENUM('standard', 'quality');--> statement-breakpoint
CREATE TYPE "public"."model_category" AS ENUM('image', 'audio', 'animation');--> statement-breakpoint
CREATE TYPE "public"."model_tier" AS ENUM('budget', 'balanced', 'premium');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
ALTER TYPE "public"."asset_type" ADD VALUE 'effect';--> statement-breakpoint
ALTER TYPE "public"."asset_type" ADD VALUE 'ambient';--> statement-breakpoint
CREATE TABLE "coupon_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coupon_code" varchar(64) NOT NULL,
	"user_id" uuid NOT NULL,
	"credit_tx_id" uuid,
	"redeemed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"code" varchar(64) PRIMARY KEY NOT NULL,
	"credit_amount" integer NOT NULL,
	"max_redemptions" integer,
	"redemptions" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_balances" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"reason" varchar(32) NOT NULL,
	"asset_id" uuid,
	"payment_id" varchar(255),
	"payment_provider" varchar(16),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"category" "entity_category" NOT NULL,
	"name" varchar(128) NOT NULL,
	"description" text,
	"mode" "entity_mode" DEFAULT 'standard' NOT NULL,
	"guide_data" jsonb DEFAULT '{}'::jsonb,
	"auto_prompt" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entity_references" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"reference_type" varchar(16) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "models" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"display_name" varchar(64) NOT NULL,
	"description" jsonb NOT NULL,
	"category" "model_category" NOT NULL,
	"tier" "model_tier" NOT NULL,
	"credit_cost" integer NOT NULL,
	"provider" varchar(32) NOT NULL,
	"provider_model_id" varchar(128) NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"config" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"display_name" text,
	"avatar_url" text,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"locale" varchar(8) DEFAULT 'ko',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stripe_webhook_events" (
	"event_id" varchar(128) PRIMARY KEY NOT NULL,
	"event_type" varchar(64) NOT NULL,
	"payload" jsonb NOT NULL,
	"processed_at" timestamp,
	"received_at" timestamp DEFAULT now() NOT NULL,
	"error_message" text
);
--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "genre" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "art_style" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "base_prompt" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "entity_id" uuid;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "name" varchar(128) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "layer_data" jsonb;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "model_id" varchar(64);--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "credits_charged" integer;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "processing_started_at" timestamp;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "entities" ADD CONSTRAINT "entities_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_references" ADD CONSTRAINT "entity_references_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_coupon_user" ON "coupon_redemptions" USING btree ("coupon_code","user_id");--> statement-breakpoint
CREATE INDEX "idx_credit_tx_user_time" ON "credit_transactions" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_credit_tx_reason" ON "credit_transactions" USING btree ("reason");--> statement-breakpoint
CREATE INDEX "idx_entities_project" ON "entities" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_entities_user" ON "entities" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_models_cat_enabled" ON "models" USING btree ("category","enabled");--> statement-breakpoint
CREATE INDEX "idx_profiles_role" ON "profiles" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_stripe_unprocessed" ON "stripe_webhook_events" USING btree ("received_at");--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_assets_project" ON "assets" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_assets_user" ON "assets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_assets_entity" ON "assets" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "idx_projects_user" ON "projects" USING btree ("user_id");