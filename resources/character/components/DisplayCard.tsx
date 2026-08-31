'use client';

import { Skull, Radioactive } from '@phosphor-icons/react';
import { EStatusEffect } from '../enums/StatusEffect';
import { ManaCrystals } from './ManaCrystals';
import { StatusEffectBadge } from './StatusEffectBadge';
import type { ICharacterDisplay } from '../models/Character';

// Frente travada da carta — subconjunto do `CharacterCard` (Tela do Mestre)
// sem flip, sem ícones de ação e sem hover. Recebe SOMENTE `ICharacterDisplay`
// (nunca `ICharacterMaster`) — `hp_color`/`is_defeated` já vêm calculados do
// servidor, então este componente nunca vê nem calcula um número de HP. Ver
// `.claude/rules/table-concept.md` seção 2 ("nenhum número de jogo na
// Exibição").
export function DisplayCard({ character: c }: { character: ICharacterDisplay }) {
  const conditionClass = (condition: EStatusEffect) => c.status_effects.includes(condition);

  return (
    <div
      className="rpg-face rpg-front"
      style={{ position: 'relative', width: 220, height: 315, borderColor: c.hp_color, boxShadow: `0 0 0 1px rgba(0,0,0,.4), 0 12px 26px rgba(0,0,0,.5), 0 0 18px ${c.hp_color}55` }}
    >
      <div className={`rpg-portrait-fill ${c.is_defeated ? 'dead' : ''} ${conditionClass(EStatusEffect.ATORDOADO) ? 'dizzy' : ''} ${conditionClass(EStatusEffect.PRESO) ? 'trapped' : ''} ${conditionClass(EStatusEffect.ENFEITICADO) ? 'enchanted' : ''} ${conditionClass(EStatusEffect.DORMINDO) ? 'asleep' : ''}`}>
        {c.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={c.image_url}
            alt={c.name}
          />
        ) : null}
      </div>

      {conditionClass(EStatusEffect.PRESO) ? <div className="chain-border" /> : null}
      {conditionClass(EStatusEffect.SANGRANDO) ? (
        <div className="blood-fx">
          <span className="blood-drip bd1" />
          <span className="blood-drip bd3" />
          <span className="blood-drip bd5" />
        </div>
      ) : null}
      {conditionClass(EStatusEffect.ATORDOADO) ? (
        <div className="stun-orbit">
          <span className="stun-star s1">✦</span>
          <span className="stun-star s2">✧</span>
          <span className="stun-star s3">✦</span>
        </div>
      ) : null}
      {conditionClass(EStatusEffect.ENVENENADO) ? (
        <>
          <div className="toxic-gas">
            <span className="gas-blob g1" />
            <span className="gas-blob g2" />
            <span className="gas-blob g3" />
            <span className="gas-blob g4" />
          </div>

          <div className="toxic-icons">
            <Skull
              weight="fill"
              size="1em"
              className="gi gi1"
            />

            <Radioactive
              weight="fill"
              size="1em"
              className="gi gi2"
            />
          </div>
        </>
      ) : null}
      {conditionClass(EStatusEffect.DORMINDO) ? (
        <div className="zzz-fx">
          <span className="zzz z1">Zzz</span>
          <span className="zzz z2">Zz</span>
          <span className="zzz z3">Zzz</span>
        </div>
      ) : null}
      {conditionClass(EStatusEffect.ENFEITICADO) ? <div className="enchant-fx" /> : null}

      <span className={`type-tag rpg-type-badge type-${c.type}`}>
        {c.type}
      </span>

      <ManaCrystals
        current={c.mana_current}
        max={c.mana_max}
      />

      {c.status_effects.length > 0 ? (
        <div className="cond-badge-row">
          {c.status_effects.map((effect) => (
            <StatusEffectBadge
              key={effect}
              effect={effect}
              size={23}
            />
          ))}
        </div>
      ) : null}

      <div className="rpg-name-bar">
        <span className="nm">
          {c.name}
        </span>
      </div>
    </div>
  );
}
