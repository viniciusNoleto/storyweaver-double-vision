CREATE TABLE "classes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"primary_attributes" jsonb NOT NULL,
	"attribute_bonuses" jsonb NOT NULL,
	"skill_proficiency_choice" jsonb,
	"knowledge_proficiency_choice" jsonb,
	"equipment_choice" jsonb,
	"fixed_equipment" jsonb,
	"hp_base" integer NOT NULL,
	"mana_base" integer DEFAULT 0 NOT NULL,
	"evasion" integer NOT NULL,
	"extra_resources" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "species" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"attribute_bonuses" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"racial_abilities" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "origins" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"attribute_bonus_options" jsonb NOT NULL,
	"granted_proficiency" varchar(200),
	"proficiency_choice" jsonb,
	"starting_items" text NOT NULL,
	"starting_money" varchar(50) NOT NULL,
	"is_custom" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "class_id" integer;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "species_id" integer;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "origin_id" integer;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "level" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "attributes" jsonb;