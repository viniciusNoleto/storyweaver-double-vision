import { boolean, integer, jsonb, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { tables } from './tables';
import { tableZones } from './table_zones';

export const characters = pgTable('characters', {
  id: serial('id').primaryKey(),
  table_id: integer('table_id').notNull().references(() => tables.id),
  name: varchar('name', { length: 100 }).notNull(),
  image_url: varchar('image_url', { length: 500 }),
  // Divisão/zona do tabuleiro em que o personagem está — substitui o antigo
  // posicionamento livre (position_x/position_y). Ver `db/schema/table_zones.ts`.
  zone_id: integer('zone_id').notNull().references(() => tableZones.id),
  hp_current: integer('hp_current').notNull().default(0),
  hp_max: integer('hp_max').notNull().default(1),
  // Free-form extra numeric attributes (defesa, etc). Mestre-only — never
  // sent in the Exibição payload. See .claude/rules/table-concept.md section 3.
  // Note: mana is NOT stored here — it has its own dedicated columns below
  // (has_mana/mana_current/mana_max) because, unlike other stats, mana is an
  // explicit exception allowed on the Exibição payload too (see
  // resources/character/models/Character.ts).
  stats: jsonb('stats').notNull().default({}),
  // Array of EStatusEffect string slugs (see
  // resources/character/enums/StatusEffect.ts) — fixed set of 4 states
  // (atordoado/envenenado/preso/sangrando), each with its own icon/animation
  // in StatusEffectBadge.tsx. No numbers inside — safe to expose on the
  // Exibição payload. Shape changed from the old free-form {key,icon}[] in
  // this same migration that added the mana columns below.
  status_effects: jsonb('status_effects').notNull().default([]),
  visible: boolean('visible').notNull().default(true),
  // Mana — DELIBERATE exception to the "no game numbers on Exibição" rule
  // (decided with the user in this session): has_mana/mana_current/mana_max
  // are sent as raw numbers in BOTH ICharacterMaster and ICharacterDisplay.
  // Only hp/stats stay Mestre-only. See detailed comment in
  // resources/character/models/Character.ts.
  has_mana: boolean('has_mana').notNull().default(false),
  mana_current: integer('mana_current').notNull().default(0),
  mana_max: integer('mana_max').notNull().default(0),
  created_at: timestamp('created_at'),
  updated_at: timestamp('updated_at'),
});
