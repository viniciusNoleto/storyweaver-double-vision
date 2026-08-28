import { pgTable, serial, text, varchar } from 'drizzle-orm/pg-core';

// Catálogo global de magias (ver db/seed/seedRules.ts:seedSpells e
// docs/superpowers/specs/2026-08-28-wizard-spells-and-redesign-design.md).
// Uma linha por magia ÚNICA — várias classes podem conjurar a mesma magia
// (ex: "Bênção" em Clérigo e Paladino); isso é resolvido por `class_spells`,
// não duplicando a linha aqui.
export const spells = pgTable('spells', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  cast_time: varchar('cast_time', { length: 100 }).notNull(),
  duration: varchar('duration', { length: 150 }).notNull(),
  restrictions: varchar('restrictions', { length: 100 }).notNull(),
  range: varchar('range', { length: 100 }).notNull(),
  cost: varchar('cost', { length: 20 }).notNull(),
  description: text('description').notNull(),
});
