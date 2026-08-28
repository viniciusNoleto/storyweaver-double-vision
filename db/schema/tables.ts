import { pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';

export const tables = pgTable('tables', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 8 }).notNull().unique(),
  // sha256 hex digest of the master_key (see libs/tableAuth.ts `hashMasterKey`).
  // Never select/return this column to a client — use `tablePublicColumns` below
  // for every client-facing `db.select`/`.returning()`.
  master_key_hash: varchar('master_key_hash', { length: 64 }).notNull(),
  name: varchar('name', { length: 100 }),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  created_at: timestamp('created_at'),
});

// Never include master_key_hash in an API response — use this selection for every
// client-facing `db.select`/`.returning()`. Mirrors `roomPlayerPublicColumns` in
// the cross-poker reference project.
export const tablePublicColumns = {
  id: tables.id,
  code: tables.code,
  name: tables.name,
  status: tables.status,
  created_at: tables.created_at,
};
