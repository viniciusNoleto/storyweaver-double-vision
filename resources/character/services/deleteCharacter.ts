import { appClient } from '@/utils/app-client';

// Só o Mestre pode chamar.
export function deleteCharacterService({ code, characterId }: { code: string; characterId: number }) {
  return appClient.delete<null>(`/api/tables/${code}/characters/${characterId}`, { body: {} });
}
