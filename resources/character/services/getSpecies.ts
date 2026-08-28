import { appClient } from '@/utils/app-client';
import { QueryFnCtx } from '@/shared/types/tanstack';
import type { ISpecies } from '../models/RulesContent';

export const GET_SPECIES_KEY = ['get-species'];

export function getSpeciesService({ signal }: QueryFnCtx) {
  return appClient.get<ISpecies[]>('/api/species', { signal });
}
