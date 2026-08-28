import { appClient } from '@/utils/app-client';
import { PayloadBody } from '@/shared/types/api';
import type { ICharacterMaster } from '../models/Character';
import type { EStatusEffect } from '../enums/StatusEffect';

export type UpdateCharacterServicePayload = {
  name?: string;
  image_url?: string | null;
  zone_id?: number;
  hp_current?: number;
  hp_max?: number;
  stats?: Record<string, number>;
  status_effects?: EStatusEffect[];
  visible?: boolean;
  // Mana — se `mana_max` e/ou `mana_current` forem enviados, a rota clampa
  // `mana_current` entre 0 e o `mana_max` resultante. Ver exceção de
  // privacidade em `resources/character/models/Character.ts`.
  has_mana?: boolean;
  mana_current?: number;
  mana_max?: number;
};

// Só o Mestre pode chamar. Usado tanto pelo painel de edição de ficha quanto
// pelo `onDropCharacter` do `TableBoard` (arrastar entre zonas só altera
// `zone_id`).
export function updateCharacterService({ code, characterId, body }: PayloadBody<UpdateCharacterServicePayload> & { code: string; characterId: number }) {
  return appClient.patch<ICharacterMaster>(`/api/tables/${code}/characters/${characterId}`, { body });
}
