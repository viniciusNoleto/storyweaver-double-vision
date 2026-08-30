import { appClient } from '@/utils/app-client';
import { PayloadBody } from '@/shared/types/api';
import type { ICharacterMaster } from '../models/Character';
import type { ECharacterType } from '../enums/CharacterType';
import type { EStatusEffect } from '../enums/StatusEffect';

export type UpdateCharacterServicePayload = {
  name?: string;
  image_url?: string | null;
  position_x?: number;
  position_y?: number;
  type?: `${ECharacterType}`;
  hp_current?: number;
  hp_max?: number;
  // Vida extra — bônus separado da vida normal (ver
  // `db/schema/characters.ts`). Nunca vai abaixo de 0.
  extra_hp?: number;
  status_effects?: EStatusEffect[];
  visible?: boolean;
  // Mana — se `mana_max` e/ou `mana_current` forem enviados, a rota clampa
  // `mana_current` entre 0 e o `mana_max` resultante. Ver exceção de
  // privacidade em `resources/character/models/Character.ts`.
  has_mana?: boolean;
  mana_current?: number;
  mana_max?: number;
  attributes?: import('../models/RulesContent').ICharacterAttributes | null;
};

// Só o Mestre pode chamar. Usado tanto pelo painel de edição de ficha quanto
// pelo drag livre no tabuleiro (arrastar só altera `position_x`/`position_y`).
export function updateCharacterService({ code, characterId, body }: PayloadBody<UpdateCharacterServicePayload> & { code: string; characterId: number }) {
  return appClient.patch<ICharacterMaster>(`/api/tables/${code}/characters/${characterId}`, { body });
}
