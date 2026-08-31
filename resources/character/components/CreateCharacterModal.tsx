'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Check } from '@phosphor-icons/react';
import { Modal } from '@/components/vilgard/Modal';
import { Button } from '@/components/vilgard/Button';
import { Field } from '@/components/vilgard/Field';
import { ErrorBanner } from '@/components/vilgard/ErrorBanner';
import { ImageUploadInput } from './ImageUploadInput';
import { createCharacterService } from '../services/createCharacter';
import { ECharacterType } from '../enums/CharacterType';
import type { ICharacterMaster } from '../models/Character';

// Criação de Personagem: mesmo formulário reduzido do NPC (nome, foto, vida
// máxima), mais o campo extra de mana máxima (0 por padrão) — substitui o
// antigo wizard guiado por espécie/classe/origem/atributos.
export function CreateCharacterModal({
  code,
  opened,
  onCancel,
  onCreated,
}: {
  code: string;
  opened: boolean;
  onCancel: () => void;
  onCreated: (character: ICharacterMaster) => void;
}) {
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [hpMax, setHpMax] = useState(1);
  const [manaMax, setManaMax] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName('');
    setImageUrl('');
    setHpMax(1);
    setManaMax(0);
    setError(null);
  }

  function cancel() {
    reset();
    onCancel();
  }

  const createMutation = useMutation({
    mutationFn: () => createCharacterService({
      code,
      body: {
        name: name.trim(),
        image_url: imageUrl || null,
        type: ECharacterType.PC,
        hp_current: hpMax,
        hp_max: hpMax,
        has_mana: manaMax > 0,
        mana_current: manaMax,
        mana_max: manaMax,
      },
    }),
    onSuccess: (res) => {
      const created = res.data;

      reset();
      onCreated(created);
    },
    onError: (err: any) => {
      setError(err?.data?.message?.['pt-br'] ?? 'Não foi possível criar o personagem. Tente novamente.');
    },
  });

  return (
    <Modal
      open={opened}
      onClose={cancel}
      fullscreen
    >
      <p className="card-modal-title">
        Novo Personagem
      </p>

      {error ? (
        <ErrorBanner
          message={error}
          onDismiss={() => setError(null)}
        />
      ) : null}

      <Field
        placeholder="Nome do personagem *"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
      />

      <ImageUploadInput
        value={imageUrl}
        onChange={setImageUrl}
      />

      <label className="edit-lbl">
        Vida máxima

        <Field
          type="number"
          min={1}
          value={hpMax}
          onChange={(e) => setHpMax(Number(e.target.value) || 1)}
        />
      </label>

      <label className="edit-lbl">
        Mana máxima

        <Field
          type="number"
          min={0}
          value={manaMax}
          onChange={(e) => setManaMax(Number(e.target.value) || 0)}
        />
      </label>

      <Button
        variant="primary"
        disabled={!name.trim() || createMutation.isPending}
        onClick={() => createMutation.mutate()}
      >
        <Check weight="bold" />
        Criar
      </Button>
    </Modal>
  );
}
