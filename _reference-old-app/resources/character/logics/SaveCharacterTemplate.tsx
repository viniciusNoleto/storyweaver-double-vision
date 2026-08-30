'use client';

import { useMutation } from '@tanstack/react-query';
import { Avatar, Button, Group, Modal, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Icon } from '@iconify/react';
import { createCharacterTemplateService } from '../services/createCharacterTemplate';
import type { ECharacterKind } from '../enums/CharacterKind';

// Ver `.claude/rules/resources-logic.md` — Padrão 1 (ação de confirmação, sem
// formulário) adaptado: os campos vêm prontos do personagem recém-criado
// (nome, imagem, vida máxima, mana), não de um form próprio — é só uma
// pergunta de sim/não. Aberto pelo componente pai logo após
// `createCharacterMutate`/`createNpcMutate` ter sucesso (ver `mestre/page.tsx`).
export type SaveCharacterTemplateCandidate = {
  kind: `${ECharacterKind}`;
  name: string;
  image_url: string | null;
  hp_max: number;
  has_mana: boolean;
  mana_max: number;
};

export function useSaveCharacterTemplateLogicData({ onDone }: { onDone: () => void }) {
  const saveTemplateMutation = useMutation({
    mutationFn: (candidate: SaveCharacterTemplateCandidate) => createCharacterTemplateService({ body: candidate }),
    onSuccess: (res) => {
      notifications.show({ message: res.message['pt-br'], color: 'green' });

      onDone();
    },
    onError: (err: any) => {
      notifications.show({
        title: 'Erro',
        message: err?.data?.message?.['pt-br'] ?? 'Não foi possível salvar o personagem. Tente novamente.',
        color: 'red',
      });
    },
  });

  return {
    saveTemplateMutation,
  };
}

export function SaveCharacterTemplatePrompt({
  logicData,
  candidate,
  onSkip,
}: {
  logicData: ReturnType<typeof useSaveCharacterTemplateLogicData>;
  candidate: SaveCharacterTemplateCandidate | null;
  onSkip: () => void;
}) {
  const {
    saveTemplateMutation: {
      mutate: saveTemplate,
      isPending: saveTemplateIsPending,
    },
  } = logicData;

  return (
    <Modal
      opened={!!candidate}
      onClose={onSkip}
      title="Salvar para reutilização futura?"
      centered
    >
      {candidate ? (
        <Stack gap="md">
          <Group gap="sm">
            <Avatar
              src={candidate.image_url}
              size={48}
              radius="xl"
            >
              <Icon icon="lucide:user" />
            </Avatar>

            <Text fw={600}>
              {candidate.name}
            </Text>
          </Group>

          <Text
            size="sm"
            c="dimmed"
          >
            Guardar este personagem como um molde permite adicioná-lo de novo, em qualquer mesa
            futura, sem precisar preencher tudo outra vez.
          </Text>

          <Group justify="flex-end" gap="sm">
            <Button
              variant="subtle"
              color="gray"
              disabled={saveTemplateIsPending}
              onClick={onSkip}
            >
              Não, obrigado
            </Button>

            <Button
              loading={saveTemplateIsPending}
              onClick={() => saveTemplate(candidate)}
            >
              Sim, salvar
            </Button>
          </Group>
        </Stack>
      ) : null}
    </Modal>
  );
}
