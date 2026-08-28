// Slugs fixos de condição/estado persistidos em `characters.status_effects`
// (jsonb, array de strings deste enum — ver `db/schema/characters.ts`). Antes
// desta etapa o shape era `{ key, icon }[]` livre; agora é um conjunto fechado
// de 4 estados, cada um com visual/animação próprios (ver
// `resources/character/models/StatusEffectVisual.ts` e
// `resources/character/components/StatusEffectBadge.tsx`).
export enum EStatusEffect {
  ATORDOADO = 'atordoado',
  ENVENENADO = 'envenenado',
  PRESO = 'preso',
  SANGRANDO = 'sangrando',
}
