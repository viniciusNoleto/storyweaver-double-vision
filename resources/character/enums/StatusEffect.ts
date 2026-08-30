// Slugs fixos de condição/estado persistidos em `characters.status_effects`
// (jsonb, array de strings deste enum). 6 estados — cada um com
// ícone/animação próprios (ver StatusEffectVisual.ts / StatusEffectBadge.tsx),
// espelhando as 6 condições do canvas `Storyweaver.dc.html` (CONDITIONS,
// linhas 1075-1082).
export enum EStatusEffect {
  ATORDOADO = 'atordoado',
  ENVENENADO = 'envenenado',
  PRESO = 'preso',
  SANGRANDO = 'sangrando',
  DORMINDO = 'dormindo',
  ENFEITICADO = 'enfeiticado',
}
