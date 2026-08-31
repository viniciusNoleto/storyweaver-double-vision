DROP TABLE "classes" CASCADE;--> statement-breakpoint
DROP TABLE "species" CASCADE;--> statement-breakpoint
DROP TABLE "origins" CASCADE;--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN "class_id";--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN "species_id";--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN "origin_id";--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN "level";--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN "attributes";