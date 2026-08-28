import { appClient } from '@/utils/app-client';
import { PayloadBody } from '@/shared/types/api';
import type { ITable } from '../models/Table';

export type AuthenticateMasterServicePayload = {
  key: string;
};

export type AuthenticateMasterServiceResponse = {
  table: ITable;
};

// POST /api/tables/[code]/master — valida a `master_key` e, se bater, seta o
// cookie httpOnly de sessão do Mestre. Chamado pela Tela do Mestre no primeiro
// acesso via `?key=...`.
export function authenticateMasterService({ code, body }: PayloadBody<AuthenticateMasterServicePayload> & { code: string }) {
  return appClient.post<AuthenticateMasterServiceResponse>(`/api/tables/${code}/master`, { body });
}
