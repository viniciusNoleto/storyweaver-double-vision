import { appClient } from '@/utils/app-client';
import { PayloadBody } from '@/shared/types/api';
import type { ICharacterMaster } from '../models/Character';
import type { EStatusEffect } from '../enums/StatusEffect';

export type CreateCharacterServicePayload = {
  name: string;
  image_url?: string | null;
  // Zona/divisão do tabuleiro. Se omitido, a rota usa a zona de menor
  // `position` da Mesa como default.
  zone_id?: number;
  hp_current?: number;
  hp_max?: number;
  // Vida extra — bônus separado da vida normal (ver
  // `db/schema/characters.ts`). Default 0 na rota se ausente.
  extra_hp?: number;
  status_effects?: EStatusEffect[];
  visible?: boolean;
  // Mana — defaults na rota: has_mana=false, mana_current=0, mana_max=0 se
  // ausentes. Ver exceção de privacidade em
  // `resources/character/models/Character.ts`.
  has_mana?: boolean;
  mana_current?: number;
  mana_max?: number;
};

// Só o Mestre pode chamar (a rota valida via cookie — ver
// app/api/tables/[code]/characters/route.ts).
export function createCharacterService({ code, body }: PayloadBody<CreateCharacterServicePayload> & { code: string }) {
  return appClient.post<ICharacterMaster>(`/api/tables/${code}/characters`, { body });
}
