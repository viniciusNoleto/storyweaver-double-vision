CREATE TABLE "tables" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(8) NOT NULL,
	"master_key_hash" varchar(64) NOT NULL,
	"name" varchar(100),
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp,
	CONSTRAINT "tables_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "characters" (
	"id" serial PRIMARY KEY NOT NULL,
	"table_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"image_url" varchar(500),
	"position_x" real DEFAULT 0 NOT NULL,
	"position_y" real DEFAULT 0 NOT NULL,
	"hp_current" integer DEFAULT 0 NOT NULL,
	"hp_max" integer DEFAULT 1 NOT NULL,
	"stats" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status_effects" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_table_id_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") ON DELETE no action ON UPDATE no action;