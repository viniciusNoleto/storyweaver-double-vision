import { pgTable, serial, text, varchar } from 'drizzle-orm/pg-core';

// Catálogo de Ferramentas do manual (ver .claude/rules/table-concept.md).
// Referenciada por `origins.tool_choice` (e futuramente classes, se alguma
// vier a oferecer escolha de ferramenta) — nunca texto solto.
export const tools = pgTable('tools', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  // Texto livre — a maioria é um valor fixo em "cg", mas "Kit de Jogos" é
  // "valor variável em cg" no manual, então não dá pra usar integer aqui.
  price: varchar('price', { length: 50 }).notNull(),
  // ${EAttribute} — atributo usado ao aplicar a ferramenta.
  attribute: varchar('attribute', { length: 30 }).notNull(),
  description: text('description').notNull(),
});
