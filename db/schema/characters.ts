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
  // Vida extra — pontos de vida "bônus" separados da vida normal, aplicados
  // pelo Mestre (a pedido do usuário). Dano é sempre abatido daqui primeiro,
  // só sobrando para hp_current quando extra_hp chega a 0. Sem coluna de
  // "máximo" própria: extra_hp entra tanto no numerador quanto no
  // denominador da fórmula de cor da carta (`HealthColor.ts`), então o
  // próprio valor atual já funciona como o "teto" que ele mesmo concede.
  // Mestre-only, nunca aparece em `ICharacterDisplay` — mesma regra do hp
  // normal (ver `.claude/rules/table-concept.md` seção 2).
  extra_hp: integer('extra_hp').notNull().default(0),
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
  // Only hp stays Mestre-only. See detailed comment in
  // resources/character/models/Character.ts.
  has_mana: boolean('has_mana').notNull().default(false),
  mana_current: integer('mana_current').notNull().default(0),
  mana_max: integer('mana_max').notNull().default(0),
  // Resultado do Wizard de criação (ver
  // docs/superpowers/specs/2026-08-28-character-creation-wizard-design.md) —
  // todos nullable: personagens antigos, criados pelo formulário simples, e
  // NPCs continuam sem esses campos preenchidos.
  class_id: integer('class_id'),
  species_id: integer('species_id'),
  origin_id: integer('origin_id'),
  level: integer('level').notNull().default(1),
  // Record<EAttribute, number> | null — ver resources/character/enums/Attribute.ts
  attributes: jsonb('attributes'),
  created_at: timestamp('created_at'),
  updated_at: timestamp('updated_at'),
});
