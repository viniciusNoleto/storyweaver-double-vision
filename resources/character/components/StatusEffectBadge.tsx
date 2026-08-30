'use client';

import { Star, Radioactive, Link, Drop, MoonStars, Sparkle } from '@phosphor-icons/react';
import { EStatusEffect } from '../enums/StatusEffect';
import { STATUS_EFFECT_VISUAL } from '../models/StatusEffectVisual';

const ICONS = { Star, Radioactive, Link, Drop, MoonStars, Sparkle };

export function StatusEffectBadge({ effect, size = 20 }: { effect: EStatusEffect; size?: number }) {
  const visual = STATUS_EFFECT_VISUAL[effect];
  const IconComponent = ICONS[visual.iconName];

  return (
    <span
      className="cond-badge"
      style={{ '--cb-color': visual.color, width: size, height: size } as React.CSSProperties}
      title={visual.label}
    >
      <IconComponent
        weight="fill"
        size={size * 0.6}
      />
    </span>
  );
}
