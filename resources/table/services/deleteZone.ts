import { appClient } from '@/utils/app-client';

// Remove uma divisão/zona — os personagens dela migram para a zona vizinha
// que sobrar. 422 se for a última zona da Mesa.
export function deleteZoneService({ code, zoneId }: { code: string; zoneId: number }) {
  return appClient.delete<null>(`/api/tables/${code}/zones/${zoneId}`, { body: {} });
}
