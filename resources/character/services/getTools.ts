import { appClient } from '@/utils/app-client';
import { QueryFnCtx } from '@/shared/types/tanstack';
import type { ITool } from '../models/RulesContent';

export const GET_TOOLS_KEY = ['get-tools'];

export function getToolsService({ signal }: QueryFnCtx) {
  return appClient.get<ITool[]>('/api/tools', { signal });
}
