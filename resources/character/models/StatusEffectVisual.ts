import { EStatusEffect } from '../enums/StatusEffect';

// Única fonte de verdade para ícone + label pt-br de cada estado fixo. Usada
// por `StatusEffectBadge.tsx` (que soma a animação em loop própria de cada
// estado) — Mestre e Exibição importam o MESMO badge, então ícone/label
// nunca devem ser reimplementados em outro lugar.
export interface IStatusEffectVisual {
  icon: string; // string Iconify (`prefixo:nome`)
  label: string; // texto pt-br exibido em tooltip/legenda
}

export const STATUS_EFFECT_VISUAL: Record<EStatusEffect, IStatusEffectVisual> = {
  [EStatusEffect.ATORDOADO]: {
    icon: 'lucide:sparkles',
    label: 'Atordoado',
  },
  [EStatusEffect.ENVENENADO]: {
    icon: 'lucide:flask-conical',
    label: 'Envenenado',
  },
  [EStatusEffect.PRESO]: {
    icon: 'lucide:link-2',
    label: 'Preso',
  },
  [EStatusEffect.SANGRANDO]: {
    icon: 'lucide:droplet',
    label: 'Sangrando',
  },
};
