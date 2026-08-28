import { jsonb, pgTable, serial, text, varchar } from 'drizzle-orm/pg-core';

export const species = pgTable('species', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description').notNull(),
  // Ícone Iconify (ex: "lucide:axe") — nullable: origens customizadas do
  // usuário (`is_custom: true` em origins) ou dados antigos ficam sem ícone,
  // a UI usa um fallback (ver Task 5). Ver
  // docs/superpowers/specs/2026-08-28-wizard-spells-and-redesign-design.md.
  icon: varchar('icon', { length: 60 }),
  // { attribute: string, amount: number }[] — vazio ([]) para todas as 8
  // espécies do manual atual (nenhuma delas concede bônus numérico de
  // atributo, só habilidades textuais) — campo existe para espécies futuras.
  attribute_bonuses: jsonb('attribute_bonuses').notNull().default([]),
  // { name: string, description: string }[] — só referência
  racial_abilities: jsonb('racial_abilities').notNull().default([]),
});
