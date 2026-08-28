import { boolean, jsonb, pgTable, serial, text, varchar } from 'drizzle-orm/pg-core';

export const origins = pgTable('origins', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description').notNull(),
  // Ícone Iconify (ex: "lucide:axe") — nullable: origens customizadas do
  // usuário (`is_custom: true` em origins) ou dados antigos ficam sem ícone,
  // a UI usa um fallback (ver Task 5). Ver
  // docs/superpowers/specs/2026-08-28-wizard-spells-and-redesign-design.md.
  icon: varchar('icon', { length: 60 }),
  // { attribute: string, amount: number }[][] — lista de alternativas; o
  // jogador escolhe UMA linha inteira (ex: [[{Destreza,2}], [{Destreza,1},{Inteligência,1}]])
  attribute_bonus_options: jsonb('attribute_bonus_options').notNull(),
  // Perícia fixa concedida (sem escolha), ex: "Conhecimento religioso" — null
  // se a origem usa proficiency_choice no lugar.
  granted_proficiency: varchar('granted_proficiency', { length: 200 }),
  // { options: string[] } | null — perícia com escolha (ex: blefe ou furtividade)
  proficiency_choice: jsonb('proficiency_choice'),
  // { count: number, tool_ids: number[] } | null — escolha de Ferramenta,
  // referenciando IDs reais de `tools` (nunca texto solto). Mutuamente
  // exclusivo com granted_proficiency/proficiency_choice na prática (uma
  // origem concede OU perícia OU ferramenta), mas o schema não força isso.
  tool_choice: jsonb('tool_choice'),
  starting_items: text('starting_items').notNull(),
  starting_money: varchar('starting_money', { length: 50 }).notNull(),
  // Reservado para quando a criação de Origem customizada pela interface
  // existir (fora de escopo deste plano) — evita uma migration futura.
  is_custom: boolean('is_custom').notNull().default(false),
});
