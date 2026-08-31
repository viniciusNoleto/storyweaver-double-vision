import { integer, pgTable, serial, timestamp } from 'drizzle-orm/pg-core';
import { tables } from './tables';

// Divisão/zona do tabuleiro (Tela do Mestre e Tela de Exibição). Todo
// personagem pertence a exatamente uma zona (`characters.zone_id`); as zonas
// de uma Mesa são exibidas lado a lado, sempre com a mesma largura entre si.
export const tableZones = pgTable('table_zones', {
  id: serial('id').primaryKey(),
  table_id: integer('table_id').notNull().references(() => tables.id),
  // Ordem 0-based, esquerda→direita. Renumerada para ficar contígua sempre
  // que uma zona é removida — ver app/api/tables/[code]/zones/[id]/route.ts.
  position: integer('position').notNull(),
  created_at: timestamp('created_at'),
});
