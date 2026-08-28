import { appClient } from '@/utils/app-client';
import { QueryFnCtx } from '@/shared/types/tanstack';
import type { IClassSpell, ISpell } from '../models/RulesContent';

export const GET_SPELLS_KEY = ['get-spells'];
export const GET_CLASS_SPELLS_KEY = (classId: number) => ['get-spells', classId];

// Sem `classId`: catálogo completo (ISpell[]) — pro modal "Ver Magias".
export function getSpellsService({ signal }: QueryFnCtx) {
  return appClient.get<ISpell[]>('/api/spells', { signal });
}

// Com `classId`: só as magias daquela classe, já com o ciclo (IClassSpell[])
// — pra etapa Magias do wizard.
export function getClassSpellsService({ signal, classId }: QueryFnCtx & { classId: number }) {
  return appClient.get<IClassSpell[]>(`/api/spells?class_id=${classId}`, { signal });
}
