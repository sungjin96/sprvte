CREATE TYPE "public"."asset_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."asset_type" AS ENUM('character', 'background', 'ui', 'bgm', 'sfx', 'sprite_sheet');--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"type" "asset_type" NOT NULL,
	"source_asset_id" uuid,
	"asset_group_id" uuid,
	"generation_params" jsonb DEFAULT '{}'::jsonb,
	"provider_used" text,
	"model_used" text,
	"status" "asset_status" DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"file_url" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"genre" text NOT NULL,
	"art_style" text NOT NULL,
	"color_palette" jsonb DEFAULT '[]'::jsonb,
	"base_prompt" text NOT NULL,
	"style_prompt" text DEFAULT '',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;