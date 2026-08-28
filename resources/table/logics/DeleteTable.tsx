'use client';

import { useMutation } from '@tanstack/react-query';
import { Button, Group, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { deleteTableService } from '../services/deleteTable';

// Ver `.claude/rules/resources-logic.md` — Padrão 1 (ação de confirmação, sem
// formulário). Mesmo espírito de `useDeleteCharacterLogicData`: `code` só é
// lido de fato quando o componente pai chama `deleteTableMutate()`, o que só
// acontece com o modal de confirmação aberto (mesa selecionada de verdade).
export function useDeleteTableLogicData({
  code,
  onSuccess,
}: {
  code: string | null;
  onSuccess: () => void;
}) {
  const deleteTableMutation = useMutation({
    mutationFn: () => {
      if (!code) return Promise.reject(new Error('Nenhuma mesa selecionada.'));

      return deleteTableService({ code });
    },
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
    deleteTableMutation,
  };
}

export function DeleteTableLogicComponent({
  logicData,
  tableName,
  onCancel,
}: {
  logicData: ReturnType<typeof useDeleteTableLogicData>;
  tableName: string;
  onCancel: () => void;
}) {
  const {
    deleteTableMutation: {
      mutate: deleteTable,
      isPending: deleteTableIsPending,
    },
  } = logicData;

  return (
    <div className="flex flex-col gap-4">
      <Text
        size="sm"
        c="dimmed"
      >
        {`Tem certeza que deseja excluir a mesa "${tableName}"? Todos os personagens e divisões dela serão apagados. Esta ação não pode ser desfeita.`}
      </Text>

      <Group justify="flex-end" gap="sm">
        <Button
          variant="subtle"
          color="gray"
          onClick={onCancel}
          disabled={deleteTableIsPending}
        >
          Cancelar
        </Button>

        <Button
          color="red"
          loading={deleteTableIsPending}
          onClick={() => deleteTable()}
        >
          Excluir
        </Button>
      </Group>
    </div>
  );
}
