CREATE TABLE "spells" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"cast_time" varchar(100) NOT NULL,
	"duration" varchar(150) NOT NULL,
	"restrictions" varchar(100) NOT NULL,
	"range" varchar(100) NOT NULL,
	"cost" varchar(20) NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_spells" (
	"id" serial PRIMARY KEY NOT NULL,
	"class_id" integer NOT NULL,
	"spell_id" integer NOT NULL,
	"cycle" varchar(10) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "known_spell_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "custom_items" text;--> statement-breakpoint
ALTER TABLE "classes" ADD COLUMN "icon" varchar(60);--> statement-breakpoint
ALTER TABLE "species" ADD COLUMN "icon" varchar(60);--> statement-breakpoint
ALTER TABLE "origins" ADD COLUMN "icon" varchar(60);--> statement-breakpoint
ALTER TABLE "class_spells" ADD CONSTRAINT "class_spells_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_spells" ADD CONSTRAINT "class_spells_spell_id_spells_id_fk" FOREIGN KEY ("spell_id") REFERENCES "public"."spells"("id") ON DELETE no action ON UPDATE no action;