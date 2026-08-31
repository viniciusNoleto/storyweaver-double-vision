'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PencilSimple, Check } from '@phosphor-icons/react';
import { Modal } from '@/components/vilgard/Modal';
import { Button } from '@/components/vilgard/Button';
import { Field, FieldSelect } from '@/components/vilgard/Field';
import { ErrorBanner } from '@/components/vilgard/ErrorBanner';
import { updateCharacterService } from '../services/updateCharacter';
import { GET_TABLE_KEY } from '@/resources/table/services/getTable';
import type { ICharacterMaster } from '../models/Character';
import type { ECharacterType } from '../enums/CharacterType';

export function CharacterEditModal({
  code,
  open,
  character,
  onClose,
}: {
  code: string;
  open: boolean;
  character: ICharacterMaster | null;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<`${ECharacterType}`>('PC');
  const [hpMax, setHpMax] = useState(1);
  const [hpCurrent, setHpCurrent] = useState(1);
  const [manaMax, setManaMax] = useState(0);
  const [manaCurrent, setManaCurrent] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (character) {
      setName(character.name);
      setType(character.type);
      setHpMax(character.hp_max);
      setHpCurrent(character.hp_current);
      setManaMax(character.mana_max);
      setManaCurrent(character.mana_current);
      setError(null);
    }
  }, [character?.id]);

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!character) return Promise.reject(new Error('sem personagem'));

      return updateCharacterService({
        code,
        characterId: character.id,
        body: { name, type, hp_max: hpMax, hp_current: hpCurrent, mana_max: manaMax, mana_current: manaCurrent },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GET_TABLE_KEY(code) });
      onClose();
    },
    onError: (err: any) => {
      setError(err?.data?.message?.['pt-br'] ?? 'Não foi possível salvar as alterações. Tente novamente.');
    },
  });

  if (!character) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      fullscreen
      wide
    >
      <p className="card-modal-title">
        <PencilSimple weight="bold" />
        {`Editar ${character.name}`}
      </p>

      {error ? (
        <ErrorBanner
          message={error}
          onDismiss={() => setError(null)}
        />
      ) : null}

      <span className="edit-section-label">
        Identidade
      </span>

      <label className="edit-lbl">
        Nome
        <Field
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <label className="edit-lbl">
        Tipo
        <FieldSelect
          value={type}
          onChange={(e) => setType(e.target.value as `${ECharacterType}`)}
        >
          <option value="PC">
            Jogador (PC)
          </option>

          <option value="NPC">
            NPC
          </option>

          <option value="Monstro">
            Monstro
          </option>
        </FieldSelect>
      </label>

      <div style={{ display: 'flex', gap: 8 }}>
        <label
          className="edit-lbl"
          style={{ flex: 1 }}
        >
          Vida atual
          <Field
            type="number"
            min={0}
            value={hpCurrent}
            onChange={(e) => setHpCurrent(Number(e.target.value) || 0)}
          />
        </label>

        <label
          className="edit-lbl"
          style={{ flex: 1 }}
        >
          Vida máx.
          <Field
            type="number"
            min={1}
            value={hpMax}
            onChange={(e) => setHpMax(Number(e.target.value) || 1)}
          />
        </label>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <label
          className="edit-lbl"
          style={{ flex: 1 }}
        >
          Mana atual
          <Field
            type="number"
            min={0}
            value={manaCurrent}
            onChange={(e) => setManaCurrent(Number(e.target.value) || 0)}
          />
        </label>

        <label
          className="edit-lbl"
          style={{ flex: 1 }}
        >
          Mana máx.
          <Field
            type="number"
            min={0}
            value={manaMax}
            onChange={(e) => setManaMax(Number(e.target.value) || 0)}
          />
        </label>
      </div>

      <Button
        variant="primary"
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
      >
        <Check weight="bold" />
        Salvar
      </Button>
    </Modal>
  );
}
