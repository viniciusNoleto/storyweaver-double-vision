import { appClient } from '@/utils/app-client';
import { PayloadBody } from '@/shared/types/api';
import type { ECharacterKind } from '../enums/CharacterKind';
import type { ICharacterTemplate } from '../models/CharacterTemplate';

export type CreateCharacterTemplateServicePayload = {
  kind: `${ECharacterKind}`;
  name: string;
  image_url?: string | null;
  hp_max?: number;
  has_mana?: boolean;
  mana_max?: number;
};

export function createCharacterTemplateService({ body }: PayloadBody<CreateCharacterTemplateServicePayload>) {
  return appClient.post<ICharacterTemplate>('/api/character-templates', { body });
}
