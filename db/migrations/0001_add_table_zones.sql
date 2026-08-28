-- Custom migration: substitui o posicionamento livre (position_x/position_y)
-- por divisões/zonas do tabuleiro (table_zones + characters.zone_id). Ver
-- `.claude/rules/table-concept.md`.
--
-- Aplicada manualmente via psql (não via `drizzle-kit push`) neste ambiente —
-- ver justificativa no relatório da etapa. Banco de dev efêmero: não havia
-- dado real a preservar, então characters/tables foram truncadas antes do
-- ALTER (evita o passo de backfill de zone_id em linhas existentes).
TRUNCATE TABLE "characters" CASCADE;
--> statement-breakpoint
TRUNCATE TABLE "tables" CASCADE;
--> statement-breakpoint
CREATE TABLE "table_zones" (
	"id" serial PRIMARY KEY NOT NULL,
	"table_id" integer NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN IF EXISTS "position_x";
--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN IF EXISTS "position_y";
--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "zone_id" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "table_zones" ADD CONSTRAINT "table_zones_table_id_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_zone_id_table_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."table_zones"("id") ON DELETE no action ON UPDATE no action;
