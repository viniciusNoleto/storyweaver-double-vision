CREATE TABLE "character_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"kind" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"image_url" varchar(500),
	"hp_max" integer DEFAULT 1 NOT NULL,
	"has_mana" boolean DEFAULT false NOT NULL,
	"mana_max" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp
);
