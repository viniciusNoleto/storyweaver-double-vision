import { appClient } from '@/utils/app-client';
import { QueryFnCtx } from '@/shared/types/tanstack';
import type { ECharacterKind } from '../enums/CharacterKind';
import type { ICharacterTemplate } from '../models/CharacterTemplate';

export const GET_CHARACTER_TEMPLATES_KEY = (kind: `${ECharacterKind}`) => ['get-character-templates', kind];

export function getCharacterTemplatesService({ signal, kind }: QueryFnCtx & { kind: `${ECharacterKind}` }) {
  return appClient.get<ICharacterTemplate[]>(`/api/character-templates?kind=${kind}`, { signal });
}
