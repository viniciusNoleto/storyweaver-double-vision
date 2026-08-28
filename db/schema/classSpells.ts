import { integer, pgTable, serial, varchar } from 'drizzle-orm/pg-core';
import { classes } from './classes';
import { spells } from './spells';

// Join N:N entre classes e magias, com o ciclo em que a magia é conjurável
// por aquela classe ('truque' | '1' | '2') — a mesma magia pode estar em
// ciclos diferentes para classes diferentes, então o ciclo vive aqui, não em
// `spells`.
export const classSpells = pgTable('class_spells', {
  id: serial('id').primaryKey(),
  class_id: integer('class_id').notNull().references(() => classes.id),
  spell_id: integer('spell_id').notNull().references(() => spells.id),
  cycle: varchar('cycle', { length: 10 }).notNull(),
});
