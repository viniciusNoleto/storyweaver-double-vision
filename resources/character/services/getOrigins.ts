import { appClient } from '@/utils/app-client';
import { QueryFnCtx } from '@/shared/types/tanstack';
import type { IOrigin } from '../models/RulesContent';

export const GET_ORIGINS_KEY = ['get-origins'];

export function getOriginsService({ signal }: QueryFnCtx) {
  return appClient.get<IOrigin[]>('/api/origins', { signal });
}
