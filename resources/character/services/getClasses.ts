import { appClient } from '@/utils/app-client';
import { QueryFnCtx } from '@/shared/types/tanstack';
import type { IClass } from '../models/RulesContent';

export const GET_CLASSES_KEY = ['get-classes'];

export function getClassesService({ signal }: QueryFnCtx) {
  return appClient.get<IClass[]>('/api/classes', { signal });
}
