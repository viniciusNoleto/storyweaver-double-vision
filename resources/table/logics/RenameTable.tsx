'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button, Group, Modal, Stack, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { renameTableService } from '../services/renameTable';

// Ver `.claude/rules/resources-logic.md` — Padrão 2 (ação com formulário),
// simplificado (sem Yup/`useValidatedFormState` — biblioteca não portada, ver
// nota da etapa 4 em `table-concept.md`). O hook recebe `editingTableId`/
// `editingTableName` (não o registro inteiro) — mesmo espírito de
// `useUpdateCharacterLogicData`, adaptado porque aqui só existe um campo.
export function useRenameTableLogicData({
  code,
  onSuccess,
}: {
  code: string | null;
  onSuccess: () => void;
}) {
  const [name, setName] = useState('');

  const renameTableMutation = useMutation({
    mutationFn: () => {
      if (!code) return Promise.reject(new Error('Nenhuma mesa selecionada.'));

      return renameTableService({ code, body: { name: name.trim() } });
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
    name,
    setName,
    renameTableMutation,
  };
}

export function RenameTableLogicComponent({
  logicData,
  opened,
  onCancel,
}: {
  logicData: ReturnType<typeof useRenameTableLogicData>;
  opened: boolean;
  onCancel: () => void;
}) {
  const {
    name,
    setName,
    renameTableMutation: {
      mutate: renameTableMutate,
      isPending: renameTableIsPending,
    },
  } = logicData;

  function renameTable() {
    if (!name.trim()) {
      notifications.show({ title: 'Erro', message: 'Informe o nome da mesa.', color: 'red' });

      return;
    }

    renameTableMutate();
  }

  return (
    <Modal
      opened={opened}
      onClose={onCancel}
      title="Renomear mesa"
      centered
    >
      <Stack gap="md">
        <TextInput
          label="Nome da mesa"
          placeholder="Ex.: A Maldição de Strahd"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          autoFocus
        />

        <Group justify="flex-end" gap="sm">
          <Button
            variant="subtle"
            color="gray"
            onClick={onCancel}
            disabled={renameTableIsPending}
          >
            Cancelar
          </Button>

          <Button
            loading={renameTableIsPending}
            onClick={renameTable}
          >
            Salvar
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
