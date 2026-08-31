'use client';

import { useState } from 'react';
import { Sword, Heart, ShieldPlus, Sparkle, PencilSimple, Skull, Radioactive } from '@phosphor-icons/react';
import type { ICharacterMaster } from '../models/Character';
import { healthColor, healthPercent } from '../models/HealthColor';
import { ATTRIBUTE_ORDER, ATTRIBUTE_LABEL, ATTRIBUTE_ABBR } from '../enums/Attribute';
import { EStatusEffect } from '../enums/StatusEffect';
import { STATUS_EFFECT_VISUAL } from '../models/StatusEffectVisual';
import { ManaCrystals } from './ManaCrystals';
import { StatusEffectBadge } from './StatusEffectBadge';
import { IconButton } from '@/components/vilgard/IconButton';
import { Switch } from '@/components/vilgard/Switch';
import type { IExtraResource } from '../models/RulesContent';

export interface CharacterCardFx {
  type: 'damage' | 'heal' | 'mana-gain' | 'mana-loss';
  token: number;
}

export interface CharacterCardProps {
  character: ICharacterMaster;
  fx: CharacterCardFx | null;
  // Recursos da classe do personagem (ex: "2d6 Dano curto") — mostrados como
  // abas ao lado da carta quando ela está virada e em hover. Vazio/ausente
  // simplesmente não mostra nada (personagem sem classe, ex: NPC).
  classResources?: IExtraResource[];
  onManaClick: (value: number) => void;
  onOpenDano: () => void;
  onOpenCura: () => void;
  onOpenVidaExtra: () => void;
  onOpenEstado: () => void;
  onOpenEdit: () => void;
  onToggleVisible: () => void;
  onRemove: () => void;
}

export function CharacterCard({
  character: c,
  fx,
  classResources = [],
  onManaClick,
  onOpenDano,
  onOpenCura,
  onOpenVidaExtra,
  onOpenEstado,
  onOpenEdit,
  onToggleVisible,
  onRemove,
}: CharacterCardProps) {
  const [flipped, setFlipped] = useState(false);

  const hpPct = healthPercent(c.hp_current, c.hp_max, c.extra_hp);
  const hpColor = healthColor(c.hp_current, c.hp_max, c.extra_hp);
  const manaPct = c.mana_max ? Math.round((c.mana_current / c.mana_max) * 100) : 0;
  const isNearDeath = hpPct > 0 && hpPct <= 20;
  const isDead = hpPct <= 0;

  const conditionClass = (condition: EStatusEffect) => c.status_effects.includes(condition);

  const fxClass = fx ? `fx-${fx.type}` : '';

  return (
    <>
    <div className="rpg-flip-viewport">
      <div className={`rpg-flip-inner ${flipped ? 'flipped' : ''}`}>
        {/* FRENTE */}
        <div
          key={fx?.token}
          className={`rpg-face rpg-front ${isNearDeath ? 'danger' : ''} ${conditionClass(EStatusEffect.SANGRANDO) ? 'bleed-flash' : ''} ${fxClass}`}
          style={{ borderColor: hpColor, '--hp-glow-a': `${hpColor}66`, '--hp-glow-b': `${hpColor}aa` } as React.CSSProperties}
          onClick={() => setFlipped(true)}
        >
          <div className={`rpg-portrait-fill ${isDead ? 'dead' : ''} ${conditionClass(EStatusEffect.ATORDOADO) ? 'dizzy' : ''} ${conditionClass(EStatusEffect.PRESO) ? 'trapped' : ''} ${conditionClass(EStatusEffect.ENFEITICADO) ? 'enchanted' : ''} ${conditionClass(EStatusEffect.DORMINDO) ? 'asleep' : ''}`}>
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

          {isNearDeath ? (
            <span className="danger-badge">
              <Skull weight="fill" />
            </span>
          ) : null}

          <span className={`type-tag rpg-type-badge type-${c.type}`}>
            {c.type}
          </span>

          <ManaCrystals
            current={c.mana_current}
            max={c.mana_max}
            onPipClick={onManaClick}
            className={fx?.type === 'mana-gain' ? 'fx-mana-gain' : fx?.type === 'mana-loss' ? 'fx-mana-loss' : ''}
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

          <div className="rpg-bottom-stack">
            <span className="nm">
              {c.name}
            </span>

            <div className="rpg-hover-icons">
              <button
                type="button"
                className="hover-icon"
                style={{ '--act-color': '#a83f4a' } as React.CSSProperties}
                onClick={(e) => { e.stopPropagation(); onOpenDano(); }}
                title="Dano"
              >
                <Sword weight="fill" />
              </button>

              <button
                type="button"
                className="hover-icon"
                style={{ '--act-color': '#7a9b5c' } as React.CSSProperties}
                onClick={(e) => { e.stopPropagation(); onOpenCura(); }}
                title="Curar"
              >
                <Heart weight="fill" />
              </button>

              <button
                type="button"
                className="hover-icon"
                style={{ '--act-color': '#c9a227' } as React.CSSProperties}
                onClick={(e) => { e.stopPropagation(); onOpenVidaExtra(); }}
                title="Vida extra"
              >
                <ShieldPlus weight="fill" />
              </button>

              <button
                type="button"
                className="hover-icon"
                style={{ '--act-color': '#b592ae' } as React.CSSProperties}
                onClick={(e) => { e.stopPropagation(); onOpenEstado(); }}
                title="Estado"
              >
                <Sparkle weight="fill" />
              </button>
            </div>
          </div>
        </div>

        {/* VERSO */}
        <div
          className="rpg-face rpg-face-back"
          style={{ borderColor: hpColor, boxShadow: `0 0 14px ${hpColor}66` }}
          onClick={() => setFlipped(false)}
        >
          <div className="rpg-back-head">
            <span className="rpg-back-name">
              {c.name}
            </span>

            <span className={`type-tag type-${c.type}`}>
              {c.type}
            </span>

            <IconButton
              className="edit-btn"
              icon={<PencilSimple weight="bold" />}
              onClick={(e) => { e.stopPropagation(); onOpenEdit(); }}
              title="Editar personagem"
            />
          </div>

          <div className="stat-row-pair">
            <div className="stat-row">
              <div className="stat-label">
                <span>Vida</span>
                <span className="stat-nums">
                  {c.hp_current}/{c.hp_max}
                  {c.extra_hp > 0 ? <span style={{ color: 'var(--gold-light)' }}> +{c.extra_hp}</span> : null}
                </span>
              </div>

              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${hpPct}%`, background: hpColor }}
                />
              </div>
            </div>

            <div className="stat-row">
              <div className="stat-label">
                <span>Mana</span>
                <span className="stat-nums">{c.mana_current}/{c.mana_max}</span>
              </div>

              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${manaPct}%`, background: 'var(--mana-blue)' }}
                />
              </div>
            </div>
          </div>

          <div className="attr-grid">
            {c.attributes ? ATTRIBUTE_ORDER.map((attribute) => (
              <div
                key={attribute}
                className="attr-cell"
                title={ATTRIBUTE_LABEL[attribute]}
              >
                <span className="al">
                  {ATTRIBUTE_ABBR[attribute]}
                </span>

                <span className="av">
                  {c.attributes![attribute]}
                </span>
              </div>
            )) : null}
          </div>

          <div className="chips">
            {c.status_effects.map((effect) => {
              const visual = STATUS_EFFECT_VISUAL[effect];

              return (
                <span
                  key={effect}
                  className="chip"
                  style={{ '--cond-color': visual.color } as React.CSSProperties}
                >
                  <span>{visual.label}</span>
                </span>
              );
            })}
          </div>

          <div className="card-foot">
            <div
              className="back-hover-icons"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="hover-icon"
                style={{ '--act-color': '#a83f4a' } as React.CSSProperties}
                onClick={onOpenDano}
                title="Dano"
              >
                <Sword weight="fill" />
              </button>

              <button
                type="button"
                className="hover-icon"
                style={{ '--act-color': '#7a9b5c' } as React.CSSProperties}
                onClick={onOpenCura}
                title="Curar"
              >
                <Heart weight="fill" />
              </button>

              <button
                type="button"
                className="hover-icon"
                style={{ '--act-color': '#c9a227' } as React.CSSProperties}
                onClick={onOpenVidaExtra}
                title="Vida extra"
              >
                <ShieldPlus weight="fill" />
              </button>

              <button
                type="button"
                className="hover-icon"
                style={{ '--act-color': '#b592ae' } as React.CSSProperties}
                onClick={onOpenEstado}
                title="Estado"
              >
                <Sparkle weight="fill" />
              </button>
            </div>

            <div onClick={(e) => e.stopPropagation()}>
              <Switch
                checked={c.visible}
                onChange={onToggleVisible}
              />
            </div>

            <IconButton
              icon="🗑"
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              title="Remover"
            />
          </div>
        </div>
      </div>
    </div>

    {classResources.length > 0 ? (
      <div className="class-tabs">
        {classResources.map((resource) => (
          <div
            key={resource.label}
            className="class-tab"
            title={resource.label}
          >
            <Sparkle weight="fill" />

            <span>
              {resource.value}
            </span>
          </div>
        ))}
      </div>
    ) : null}
    </>
  );
}
