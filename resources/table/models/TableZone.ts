// Espelha `db/schema/table_zones.ts`. Seguro em ambos os payloads de
// `GET /api/tables/[code]` (Mestre e Exibição) — não carrega nenhum número de
// jogo, só a organização visual das divisões do tabuleiro.
export interface ITableZone {
  id: number;
  table_id: number;
  position: number;
}
