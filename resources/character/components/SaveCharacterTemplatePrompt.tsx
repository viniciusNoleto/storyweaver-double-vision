'use client';

import { useMutation } from '@tanstack/react-query';
import { Check } from '@phosphor-icons/react';
import { Modal } from '@/components/vilgard/Modal';
import { Button } from '@/components/vilgard/Button';
import { ErrorBanner } from '@/components/vilgard/ErrorBanner';
import { createCharacterTemplateService } from '../services/createCharacterTemplate';
import type { ECharacterKind } from '../enums/CharacterKind';
import { useState } from 'react';

export type SaveCharacterTemplateCandidate = {
  kind: `${ECharacterKind}`;
  name: string;
  image_url: string | null;
  hp_max: number;
  has_mana: boolean;
  mana_max: number;
};

// Pergunta de sim/não mostrada logo após criar um Personagem ou NPC do zero
// — os campos vêm prontos do personagem recém-criado, não de um form
// próprio. Guardar como molde permite adicioná-lo de novo em qualquer mesa
// futura sem preencher tudo outra vez.
export function SaveCharacterTemplatePrompt({
  candidate,
  onDone,
}: {
  candidate: SaveCharacterTemplateCandidate | null;
  onDone: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!candidate) return Promise.reject(new Error('sem candidato'));

      return createCharacterTemplateService({ body: candidate });
    },
    onSuccess: () => {
      setError(null);
      onDone();
    },
    onError: (err: any) => {
      setError(err?.data?.message?.['pt-br'] ?? 'Não foi possível salvar o personagem. Tente novamente.');
    },
  });

  return (
    <Modal
      open={!!candidate}
      onClose={onDone}
      fullscreen
    >
      {candidate ? (
        <>
          <p className="card-modal-title">
            Salvar para reutilização futura?
          </p>

          {error ? (
            <ErrorBanner
              message={error}
              onDismiss={() => setError(null)}
            />
          ) : null}

          <p>
            {`Guardar "${candidate.name}" como um molde permite adicioná-lo de novo, em qualquer mesa futura, sem preencher tudo outra vez.`}
          </p>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button
              variant="ghost"
              onClick={onDone}
              disabled={saveMutation.isPending}
            >
              Não, obrigado
            </Button>

            <Button
              variant="primary"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              <Check weight="bold" />
              Sim, salvar
            </Button>
          </div>
        </>
      ) : null}
    </Modal>
  );
}
