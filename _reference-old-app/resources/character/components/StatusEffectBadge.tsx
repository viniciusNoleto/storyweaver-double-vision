'use client';

import { motion } from 'motion/react';
import { Icon } from '@iconify/react';
import { EStatusEffect } from '../enums/StatusEffect';
import { STATUS_EFFECT_VISUAL } from '../models/StatusEffectVisual';

export interface StatusEffectBadgeProps {
  effect: EStatusEffect;
  size?: number;
}

// Peça compartilhada (ver `.claude/rules/table-concept.md` seção 4) — importada
// sem alteração tanto pela Tela do Mestre quanto pela Tela de Exibição, para
// que a animação "de estar naquele estado" seja idêntica nas duas telas e
// nunca reimplementada duas vezes. Cada estado tem uma animação CONTÍNUA em
// loop (`repeat: Infinity`) própria, escolhida para sugerir a condição sem
// nenhum número associado (`status_effects` nunca carrega valor — só slug de
// `EStatusEffect`, ver `db/schema/characters.ts`):
// - Atordoado: rotação contínua leve + oscilação vertical ("estrelinhas
//   girando" sobre a cabeça).
// - Envenenado: pulso de escala + glow verde (`drop-shadow`) oscilando.
// - Preso: tremor/jitter horizontal curto, como "puxando corrente".
// - Sangrando: gota transladando pra baixo com fade, simulando pingar.
export function StatusEffectBadge({ effect, size = 20 }: StatusEffectBadgeProps) {
  const visual = STATUS_EFFECT_VISUAL[effect];

  if (effect === EStatusEffect.ATORDOADO) {
    return (
      <motion.div
        className="inline-flex text-gold-light"
        title={visual.label}
        animate={{ rotate: 360, y: [0, -2, 0, 2, 0] }}
        transition={{
          rotate: { duration: 2.2, repeat: Infinity, ease: 'linear' },
          y: { duration: 1.1, repeat: Infinity, ease: 'easeInOut' },
        }}
      >
        <Icon
          icon={visual.icon}
          width={size}
          height={size}
        />
      </motion.div>
    );
  }

  if (effect === EStatusEffect.ENVENENADO) {
    return (
      <motion.div
        className="inline-flex text-[#27AE60]"
        title={visual.label}
        animate={{
          scale: [1, 1.18, 1],
          filter: [
            'drop-shadow(0 0 0px #27AE60)',
            'drop-shadow(0 0 5px #27AE60)',
            'drop-shadow(0 0 0px #27AE60)',
          ],
        }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Icon
          icon={visual.icon}
          width={size}
          height={size}
        />
      </motion.div>
    );
  }

  if (effect === EStatusEffect.PRESO) {
    return (
      <motion.div
        className="inline-flex text-secondary-300"
        title={visual.label}
        animate={{ x: [0, -2, 2, -2, 2, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.4 }}
      >
        <Icon
          icon={visual.icon}
          width={size}
          height={size}
        />
      </motion.div>
    );
  }

  // SANGRANDO
  return (
    <motion.div
      className="inline-flex text-[#C0392B]"
      title={visual.label}
      animate={{ y: [0, size * 0.35, 0], opacity: [1, 0.3, 1] }}
      transition={{ duration: 1.1, repeat: Infinity, ease: 'easeIn' }}
    >
      <Icon
        icon={visual.icon}
        width={size}
        height={size}
      />
    </motion.div>
  );
}
