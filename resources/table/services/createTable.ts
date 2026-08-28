import { appClient } from '@/utils/app-client';
import { PayloadBody } from '@/shared/types/api';

export type CreateTableServicePayload = {
  name?: string;
};

// Resposta única de `POST /api/tables` — `master_key` só existe aqui, o
// servidor nunca mais devolve esse valor em nenhuma outra rota.
export type CreateTableServiceResponse = {
  code: string;
  master_key: string;
};

export function createTableService({ body }: PayloadBody<CreateTableServicePayload>) {
  return appClient.post<CreateTableServiceResponse>('/api/tables', { body });
}
