import { appClient } from '@/utils/app-client';
import { QueryFnCtx } from '@/shared/types/tanstack';
import type { ICharacterDisplay, ICharacterMaster } from '@/resources/character/models/Character';
import type { ITable } from '../models/Table';
import type { ITableZone } from '../models/TableZone';

// Shape exato de `GET /api/tables/[code]` — única rota de snapshot. `characters`
// já vem no formato certo por papel (`ICharacterMaster[]` para o Mestre,
// `ICharacterDisplay[]` para a Exibição), decidido no servidor a partir de
// `you.is_master`. `zones` é igual nos dois papéis — não carrega nenhum
// número de jogo, só a organização visual das divisões do tabuleiro.
export type GetTableServiceResponse = {
  table: ITable;
  you: { is_master: boolean };
  zones: ITableZone[];
  characters: ICharacterMaster[] | ICharacterDisplay[];
};

// `forceDisplay` inclui `?view=display` na chamada — ver
// `.claude/rules/table-concept.md` seção 3 ("Redação de privacidade"). A chave
// de query inclui o modo para nunca reaproveitar cache entre a Tela do Mestre
// e a Tela de Exibição num mesmo navegador.
export const GET_TABLE_KEY = (code: string, forceDisplay = false) => [
  'get-table',
  code,
  forceDisplay ? 'display' : 'auto',
];

export function getTableService({
  signal,
  code,
  forceDisplay = false,
}: QueryFnCtx & { code: string; forceDisplay?: boolean }) {
  const query = forceDisplay ? '?view=display' : '';

  return appClient.get<GetTableServiceResponse>(`/api/tables/${code}${query}`, { signal });
}
