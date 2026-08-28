import { appClient } from '@/utils/app-client';
import type { ITableZone } from '../models/TableZone';

// Só o Mestre pode chamar. Cria uma nova divisão/zona no tabuleiro — teto de
// 6 zonas por Mesa (a rota devolve 422 se já houver 6).
export function createZoneService({ code }: { code: string }) {
  return appClient.post<ITableZone>(`/api/tables/${code}/zones`, { body: {} });
}
