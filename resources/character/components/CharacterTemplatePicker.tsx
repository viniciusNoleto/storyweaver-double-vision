'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { User, Trash } from '@phosphor-icons/react';
import { Modal } from '@/components/vilgard/Modal';
import { IconButton } from '@/components/vilgard/IconButton';
import { ErrorBanner } from '@/components/vilgard/ErrorBanner';
import { getCharacterTemplatesService, GET_CHARACTER_TEMPLATES_KEY } from '../services/getCharacterTemplates';
import { deleteCharacterTemplateService } from '../services/deleteCharacterTemplate';
import { createCharacterService } from '../services/createCharacter';
import { ECharacterKind } from '../enums/CharacterKind';
import { ECharacterType } from '../enums/CharacterType';
import type { ICharacterTemplate } from '../models/CharacterTemplate';
import type { ICharacterMaster } from '../models/Character';
import { useState } from 'react';

// Lista de Personagens Salvos de um tipo (Personagem/NPC) — clicar num item
// já cria a ficha na Mesa atual, na posição padrão (canto superior esquerdo
// do tabuleiro livre).
export function CharacterTemplatePicker({
  code,
  kind,
  opened,
  onCancel,
  onCreated,
}: {
  code: string;
  kind: `${ECharacterKind}`;
  opened: boolean;
  onCancel: () => void;
  onCreated: (character: ICharacterMaster) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: GET_CHARACTER_TEMPLATES_KEY(kind),
    queryFn: ({ signal }) => getCharacterTemplatesService({ signal, kind }),
    enabled: opened,
  });

  const useTemplateMutation = useMutation({
    mutationFn: (template: ICharacterTemplate) => createCharacterService({
      code,
      body: {
        name: template.name,
        image_url: template.image_url,
        type: kind === ECharacterKind.NPC ? ECharacterType.NPC : ECharacterType.PC,
        hp_current: template.hp_max,
        hp_max: template.hp_max,
        has_mana: template.has_mana,
        mana_current: template.mana_max,
        mana_max: template.mana_max,
      },
    }),
    onSuccess: (res) => {
      onCreated(res.data);
    },
    onError: (err: any) => {
      setError(err?.data?.message?.['pt-br'] ?? 'Não foi possível adicionar o personagem. Tente novamente.');
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (templateId: number) => deleteCharacterTemplateService({ templateId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: GET_CHARACTER_TEMPLATES_KEY(kind) }),
    onError: (err: any) => {
      setError(err?.data?.message?.['pt-br'] ?? 'Não foi possível remover o personagem salvo.');
    },
  });

  const templates = data?.data ?? [];

  return (
    <Modal
      open={opened}
      onClose={onCancel}
      fullscreen
      contentClassName="wiz-box"
    >
      <div className="wiz-head">
        <div>
          <p className="wiz-eyebrow">
            Cantos e Contos
          </p>

          <p className="wiz-title">
            Personagens salvos
          </p>
        </div>

        <IconButton
          icon="✕"
          onClick={onCancel}
        />
      </div>

      <div className="wiz-divider" />

      {error ? (
        <ErrorBanner
          message={error}
          onDismiss={() => setError(null)}
        />
      ) : null}

      {isLoading ? (
        <p className="wiz-empty">
          Carregando...
        </p>
      ) : null}

      {!isLoading && templates.length === 0 ? (
        <p className="wiz-empty">
          Nenhum personagem salvo ainda.
        </p>
      ) : null}

      {!isLoading && templates.length > 0 ? (
        <div className="wiz-opt-wrap">
          {templates.map((template) => (
            <div
              key={template.id}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <button
                type="button"
                className="wiz-opt"
                disabled={useTemplateMutation.isPending}
                onClick={() => useTemplateMutation.mutate(template)}
              >
                <span className="wiz-opt-badge">
                  <User weight="fill" />
                </span>

                <span className="wiz-opt-txt">
                  <span>
                    {template.name}
                  </span>

                  <span className="wiz-opt-sub">
                    {`Vida: ${template.hp_max}${template.has_mana ? ` · Mana: ${template.mana_max}` : ''}`}
                  </span>
                </span>
              </button>

              <IconButton
                icon={<Trash weight="bold" />}
                disabled={deleteTemplateMutation.isPending}
                onClick={() => deleteTemplateMutation.mutate(template.id)}
                title="Remover dos salvos"
              />
            </div>
          ))}
        </div>
      ) : null}
    </Modal>
  );
}
