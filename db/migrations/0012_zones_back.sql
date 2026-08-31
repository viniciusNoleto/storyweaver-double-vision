CREATE TABLE "table_zones" (
	"id" serial PRIMARY KEY NOT NULL,
	"table_id" integer NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "table_zones" ADD CONSTRAINT "table_zones_table_id_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "zone_id" integer;
--> statement-breakpoint
INSERT INTO "table_zones" ("table_id", "position", "created_at")
SELECT "id", 0, now() FROM "tables";
--> statement-breakpoint
UPDATE "characters" c
SET "zone_id" = z."id"
FROM "table_zones" z
WHERE z."table_id" = c."table_id";
--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "zone_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_zone_id_table_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."table_zones"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN "position_x";
--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN "position_y";
