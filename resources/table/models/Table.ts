import type { ETableStatus } from '../enums/TableStatus';

// Espelha as colunas públicas de `tables` (ver db/schema/tables.ts,
// `tablePublicColumns`). NUNCA inclua `master_key_hash` aqui — é um segredo de
// servidor, nunca exposto ao cliente. Se algum código interno (server-side)
// precisar do registro completo com o hash, use `ITableRecord` abaixo, nunca
// `ITable`.
export interface ITable {
  id: number;
  code: string;
  name: string | null;
  status: `${ETableStatus}`;
  created_at: string | null;
}

// Uso exclusivamente server-side (ex. libs/tableAuth.ts, services de criação da
// Mesa) — inclui `master_key_hash`. Nunca serializar este tipo diretamente numa
// resposta de API; sempre projetar para `ITable` (ou `tablePublicColumns`) antes.
export interface ITableRecord extends ITable {
  master_key_hash: string;
}
