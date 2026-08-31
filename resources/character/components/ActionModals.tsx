'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sword, Heart, ShieldPlus, Sparkle, Plus, Minus, Check } from '@phosphor-icons/react';
import { Modal } from '@/components/vilgard/Modal';
import { Button } from '@/components/vilgard/Button';
import { Field } from '@/components/vilgard/Field';
import { ErrorBanner } from '@/components/vilgard/ErrorBanner';
import { applyCharacterActionService } from '../services/applyCharacterAction';
import { updateCharacterService } from '../services/updateCharacter';
import { GET_TABLE_KEY } from '@/resources/table/services/getTable';
import { EStatusEffect } from '../enums/StatusEffect';
import { STATUS_EFFECT_VISUAL } from '../models/StatusEffectVisual';
import type { ICharacterMaster } from '../models/Character';

export type ActionModalKind = 'dano' | 'cura' | 'vida-extra' | 'estado' | null;

export interface ActionModalsProps {
  code: string;
  character: ICharacterMaster | null;
  open: ActionModalKind;
  onClose: () => void;
  onApplied: () => void;
}

export function ActionModals({ code, character, open, onClose, onApplied }: ActionModalsProps) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const actionMutation = useMutation({
    mutationFn: (body: { type: 'damage' | 'heal' | 'extra-add' | 'extra-remove'; amount: number }) => {
      if (!character) return Promise.reject(new Error('sem personagem'));

      return applyCharacterActionService({ code, characterId: character.id, body });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GET_TABLE_KEY(code) });
      setAmount('');
      onApplied();
    },
    onError: (err: any) => {
      setError(err?.data?.message?.['pt-br'] ?? 'Não foi possível aplicar a ação. Tente novamente.');
    },
  });

  const conditionMutation = useMutation({
    mutationFn: (status_effects: EStatusEffect[]) => {
      if (!character) return Promise.reject(new Error('sem personagem'));

      return updateCharacterService({ code, characterId: character.id, body: { status_effects } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GET_TABLE_KEY(code) });
    },
    onError: (err: any) => {
      setError(err?.data?.message?.['pt-br'] ?? 'Não foi possível atualizar os estados. Tente novamente.');
    },
  });

  if (!character) return null;

  function toggleCondition(effect: EStatusEffect) {
    if (!character) return;

    const has = character.status_effects.includes(effect);
    const next = has ? character.status_effects.filter((e) => e !== effect) : [...character.status_effects, effect];

    conditionMutation.mutate(next);
  }

  return (
    <>
      <Modal
        open={open === 'dano'}
        onClose={onClose}
        fullscreen
        accentColor="#a83f4a"
      >
        <p className="card-modal-title">
          <Sword weight="fill" />

          {`Aplicar dano em ${character.name}`}
        </p>

        {error ? (
          <ErrorBanner
            message={error}
            onDismiss={() => setError(null)}
          />
        ) : null}

        <Field
          type="number"
          min={0}
          placeholder="Quantidade"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          autoFocus
        />

        <Button
          variant="primary"
          onClick={() => actionMutation.mutate({ type: 'damage', amount: Number(amount) || 0 })}
          disabled={actionMutation.isPending}
        >
          Aplicar dano
        </Button>
      </Modal>

      <Modal
        open={open === 'cura'}
        onClose={onClose}
        fullscreen
        accentColor="#7a9b5c"
      >
        <p className="card-modal-title">
          <Heart weight="fill" />

          {`Curar ${character.name}`}
        </p>

        {error ? (
          <ErrorBanner
            message={error}
            onDismiss={() => setError(null)}
          />
        ) : null}

        <Field
          type="number"
          min={0}
          placeholder="Quantidade"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          autoFocus
        />

        <Button
          variant="primary"
          onClick={() => actionMutation.mutate({ type: 'heal', amount: Number(amount) || 0 })}
          disabled={actionMutation.isPending}
        >
          Aplicar cura
        </Button>
      </Modal>

      <Modal
        open={open === 'vida-extra'}
        onClose={onClose}
        fullscreen
        accentColor="#c9a227"
      >
        <p className="card-modal-title">
          <ShieldPlus weight="fill" />

          {`Vida extra de ${character.name}`}
        </p>

        {error ? (
          <ErrorBanner
            message={error}
            onDismiss={() => setError(null)}
          />
        ) : null}

        <Field
          type="number"
          min={0}
          placeholder="Quantidade"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          autoFocus
        />

        <Button
          variant="primary"
          onClick={() => actionMutation.mutate({ type: 'extra-add', amount: Number(amount) || 0 })}
          disabled={actionMutation.isPending}
        >
          <Plus weight="bold" />

          Adicionar
        </Button>

        <Button
          variant="ghost"
          onClick={() => actionMutation.mutate({ type: 'extra-remove', amount: Number(amount) || 0 })}
          disabled={actionMutation.isPending}
        >
          <Minus weight="bold" />

          Retirar
        </Button>
      </Modal>

      <Modal
        open={open === 'estado'}
        onClose={onClose}
        fullscreen
        accentColor="#b592ae"
      >
        <p className="card-modal-title">
          <Sparkle weight="fill" />

          {`Estados de ${character.name}`}
        </p>

        {error ? (
          <ErrorBanner
            message={error}
            onDismiss={() => setError(null)}
          />
        ) : null}

        <div className="cond-quick">
          {Object.values(EStatusEffect).map((effect) => {
            const visual = STATUS_EFFECT_VISUAL[effect];
            const active = character.status_effects.includes(effect);

            return (
              <button
                type="button"
                key={effect}
                className={`cond-chip-btn ${active ? 'active' : ''}`}
                style={{ '--cond-color': visual.color } as React.CSSProperties}
                onClick={() => toggleCondition(effect)}
              >
                {active ? <Check weight="bold" /> : null}

                {visual.label}
              </button>
            );
          })}
        </div>
      </Modal>
    </>
  );
}
