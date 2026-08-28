DROP TABLE "tools" CASCADE;--> statement-breakpoint
DROP TABLE "spells" CASCADE;--> statement-breakpoint
DROP TABLE "class_spells" CASCADE;--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN "known_spell_ids";--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN "custom_items";--> statement-breakpoint
ALTER TABLE "origins" DROP COLUMN "tool_choice";