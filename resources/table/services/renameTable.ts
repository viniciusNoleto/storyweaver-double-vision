import { appClient } from '@/utils/app-client';
import { PayloadBody } from '@/shared/types/api';
import type { ITable } from '../models/Table';

export type RenameTableServicePayload = {
  name: string;
};

// Só o Mestre pode chamar (cookie de sessão da Mesa).
export function renameTableService({ code, body }: PayloadBody<RenameTableServicePayload> & { code: string }) {
  return appClient.patch<ITable>(`/api/tables/${code}`, { body });
}
