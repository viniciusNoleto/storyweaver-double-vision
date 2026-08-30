ALTER TABLE "characters" DROP CONSTRAINT "characters_zone_id_table_zones_id_fk";--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "type" varchar(20) DEFAULT 'PC' NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "position_x" integer DEFAULT 20 NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "position_y" integer DEFAULT 20 NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN "zone_id";--> statement-breakpoint
DROP TABLE "table_zones";
