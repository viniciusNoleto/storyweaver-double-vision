-- Custom migration: adiciona o sistema de mana (has_mana/mana_current/mana_max)
-- a `characters`. Ver `.claude/rules/table-concept.md`. `status_effects`
-- continua sendo a mesma coluna jsonb — só o SHAPE dos valores muda (de
-- `{key,icon}[]` livre para `EStatusEffect[]`, string[]), sem alteração de
-- schema SQL necessária para isso.
--
-- Aplicada manualmente via psql (não via `drizzle-kit push`, que trava sem TTY
-- em `docker compose exec -T` — mesma limitação já documentada na migration
-- 0001). Banco de dev efêmero, sem dado real a preservar.
ALTER TABLE "characters" ADD COLUMN "has_mana" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "mana_current" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "mana_max" integer DEFAULT 0 NOT NULL;
