import { appClient } from '@/utils/app-client';

// Só o Mestre pode chamar (cookie de sessão da Mesa). Apaga a Mesa e tudo que
// pertence a ela (personagens, divisões).
export function deleteTableService({ code }: { code: string }) {
  return appClient.delete<null>(`/api/tables/${code}`, { body: {} });
}
