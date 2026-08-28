import { boolean, integer, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';

// Personagem/NPC salvo pelo Mestre para reutilização futura (ver
// `.claude/rules/table-concept.md`) — global, não pertence a nenhuma Mesa
// específica. É um "molde" limpo: só os campos que fazem sentido reusar
// (nome, imagem, vida máxima, mana máxima) — nunca vida atual/dano,
// condições ou visibilidade, que são estado de uma sessão em jogo, não do
// personagem em si.
export const characterTemplates = pgTable('character_templates', {
  id: serial('id').primaryKey(),
  // `${ECharacterKind}` (ver resources/character/enums/CharacterKind.ts) —
  // filtra qual lista (Personagem/NPC) mostra este template.
  kind: varchar('kind', { length: 20 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  image_url: varchar('image_url', { length: 500 }),
  hp_max: integer('hp_max').notNull().default(1),
  has_mana: boolean('has_mana').notNull().default(false),
  mana_max: integer('mana_max').notNull().default(0),
  created_at: timestamp('created_at'),
});
