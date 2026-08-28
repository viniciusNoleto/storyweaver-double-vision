import { appClient } from '@/utils/app-client';
import { PayloadBody } from '@/shared/types/api';
import type { ICharacterMaster } from '../models/Character';

export type ApplyCharacterActionServicePayload = {
  type: 'damage' | 'heal' | 'mana-spend' | 'mana-restore' | 'extra-add' | 'extra-remove';
  amount: number;
};

// Só o Mestre pode chamar. Aplica dano/cura (hp_current, clamp 0..hp_max),
// gasto/restauração de mana (mana_current, clamp 0..mana_max), ou
// adição/remoção de vida extra (extra_hp, nunca abaixo de 0) ao personagem —
// ações de mana exigem `has_mana: true` no personagem, senão a rota retorna
// 422. `damage` abate primeiro de `extra_hp`, só o excedente desconta de
// `hp_current`. Publica um evento realtime com payload (`character-action`)
// para a Tela de Exibição animar (ver `libs/realtime.ts` e
// `resources/table/hooks/useTableStream.ts`).
export function applyCharacterActionService({ code, characterId, body }: PayloadBody<ApplyCharacterActionServicePayload> & { code: string; characterId: number }) {
  return appClient.post<ICharacterMaster>(`/api/tables/${code}/characters/${characterId}/actions`, { body });
}
