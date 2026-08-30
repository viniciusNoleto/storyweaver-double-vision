import { EStatusEffect } from '../enums/StatusEffect';

export interface IStatusEffectVisual {
  label: string;
  color: string;
  iconName: 'Star' | 'Radioactive' | 'Link' | 'Drop' | 'MoonStars' | 'Sparkle';
}

export const STATUS_EFFECT_VISUAL: Record<EStatusEffect, IStatusEffectVisual> = {
  [EStatusEffect.ATORDOADO]: { label: 'Atordoado', color: '#d4b876', iconName: 'Star' },
  [EStatusEffect.ENVENENADO]: { label: 'Envenenado', color: '#7fa376', iconName: 'Radioactive' },
  [EStatusEffect.PRESO]: { label: 'Preso', color: '#a3927a', iconName: 'Link' },
  [EStatusEffect.SANGRANDO]: { label: 'Sangrando', color: '#b06868', iconName: 'Drop' },
  [EStatusEffect.DORMINDO]: { label: 'Dormindo', color: '#9088ab', iconName: 'MoonStars' },
  [EStatusEffect.ENFEITICADO]: { label: 'Enfeitiçado', color: '#b592ae', iconName: 'Sparkle' },
};
