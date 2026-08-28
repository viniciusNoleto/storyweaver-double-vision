'use client';

import { useMutation } from '@tanstack/react-query';
import { Button, Group, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { deleteCharacterService } from '../services/deleteCharacter';

// Ver `.claude/rules/resources-logic.md` — Padrão 1 (ação de confirmação, sem
// formulário). `characterId` segue o mesmo pressuposto do exemplo de
// `disableDiscipline`: só é lido de fato quando o componente pai realmente
// chama `deleteCharacterMutate()`, o que só acontece com o modal de
// confirmação aberto (ou seja, com um personagem selecionado de verdade).
export function useDeleteCharacterLogicData({
  code,
  characterId,
  onSuccess,
}: {
  code: string;
  characterId: number;
  onSuccess: () => void;
}) {
  const deleteCharacterMutation = useMutation({
    mutationFn: () => deleteCharacterService({ code, characterId }),
    onSuccess: (res) => {
      notifications.show({ message: res.message['pt-br'], color: 'green' });

      onSuccess();
    },
    onError: (err: any) => {
      notifications.show({
        title: 'Erro',
        message: err?.data?.message?.['pt-br'] ?? 'Não foi possível completar a operação. Tente novamente.',
        color: 'red',
      });
    },
  });

  return {
    deleteCharacterMutation,
  };
}

export function DeleteCharacterLogicComponent({
  logicData,
  characterName,
  onCancel,
}: {
  logicData: ReturnType<typeof useDeleteCharacterLogicData>;
  characterName: string;
  onCancel: () => void;
}) {
  const {
    deleteCharacterMutation: {
      mutate: deleteCharacter,
      isPending: deleteCharacterIsPending,
    },
  } = logicData;

  return (
    <div className="flex flex-col gap-4">
      <Text
        size="sm"
        c="dimmed"
      >
        {`Tem certeza que deseja remover o personagem "${characterName}"? Esta ação não pode ser desfeita.`}
      </Text>

      <Group justify="flex-end" gap="sm">
        <Button
          variant="subtle"
          color="gray"
          onClick={onCancel}
          disabled={deleteCharacterIsPending}
        >
          Cancelar
        </Button>

        <Button
          color="red"
          loading={deleteCharacterIsPending}
          onClick={() => deleteCharacter()}
        >
          Remover
        </Button>
      </Group>
    </div>
  );
}
