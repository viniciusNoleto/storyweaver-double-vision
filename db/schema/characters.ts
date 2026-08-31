import { boolean, integer, jsonb, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { tables } from './tables';
import { tableZones } from './table_zones';

export const characters = pgTable('characters', {
  id: serial('id').primaryKey(),
  table_id: integer('table_id').notNull().references(() => tables.id),
  name: varchar('name', { length: 100 }).notNull(),
  image_url: varchar('image_url', { length: 500 }),
  // Tipo do personagem — replica o campo único do canvas (PC/NPC/Monstro em
  // vez do antigo par kind character/npc). Puramente organizacional/visual
  // (badge de tipo), sem regra de jogo diferente entre os 3 valores.
  type: varchar('type', { length: 20 }).notNull().default('PC'),
  // Divisão/zona do tabuleiro à qual o personagem pertence — as fichas de
  // uma mesma zona se auto-organizam centralizadas (flex-wrap), sem
  // posicionamento livre por pixel.
  zone_id: integer('zone_id').notNull().references(() => tableZones.id),
  hp_current: integer('hp_current').notNull().default(0),
  hp_max: integer('hp_max').notNull().default(1),
  extra_hp: integer('extra_hp').notNull().default(0),
  // Array of EStatusEffect string slugs — 6 estados fixos (ver
  // resources/character/enums/StatusEffect.ts).
  status_effects: jsonb('status_effects').notNull().default([]),
  visible: boolean('visible').notNull().default(true),
  has_mana: boolean('has_mana').notNull().default(false),
  mana_current: integer('mana_current').notNull().default(0),
  mana_max: integer('mana_max').notNull().default(0),
  created_at: timestamp('created_at'),
  updated_at: timestamp('updated_at'),
});
