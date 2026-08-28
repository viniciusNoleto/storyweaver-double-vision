import { appClient } from '@/utils/app-client';
import { QueryFnCtx } from '@/shared/types/tanstack';
import type { ITable } from '../models/Table';

// Lista todas as Mesas já criadas (ver `GET /api/tables`). Usado pelas telas
// "Gerenciar Mesas" e "Exibir Mesa".
export const GET_TABLES_KEY = ['get-tables'];

export function getTablesService({ signal }: QueryFnCtx) {
  return appClient.get<ITable[]>('/api/tables', { signal });
}
