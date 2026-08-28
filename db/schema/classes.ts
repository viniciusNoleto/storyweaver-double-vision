import { integer, jsonb, pgTable, serial, text, varchar } from 'drizzle-orm/pg-core';

// Uma "ficha de classe" por linha (Bárbaro, Caçador, etc. — ver seed em
// db/seed/seedRules.ts). O wizard (resources/character/components/CharacterWizard.tsx)
// lê essas colunas genericamente — nenhuma lógica específica de classe no
// código, só nos dados desta tabela. Ver spec:
// docs/superpowers/specs/2026-08-28-character-creation-wizard-design.md
export const classes = pgTable('classes', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description').notNull(),
  // string[] — 1 ou 2 atributos primários (ex: Caçador tem 2: mágico e físico)
  primary_attributes: jsonb('primary_attributes').notNull(),
  // { attribute: string, amount: number }[]
  attribute_bonuses: jsonb('attribute_bonuses').notNull(),
  // { count: number, options: string[], fixed?: string[] } | null
  skill_proficiency_choice: jsonb('skill_proficiency_choice'),
  knowledge_proficiency_choice: jsonb('knowledge_proficiency_choice'),
  // { options: { label: string, description: string }[] } | null
  equipment_choice: jsonb('equipment_choice'),
  // string[] | null — itens que a classe sempre concede, sem escolha
  fixed_equipment: jsonb('fixed_equipment'),
  hp_base: integer('hp_base').notNull(),
  mana_base: integer('mana_base').notNull().default(0),
  evasion: integer('evasion').notNull(),
  // { label: string, value: string }[] — só referência, nunca rastreado
  extra_resources: jsonb('extra_resources').notNull().default([]),
});
