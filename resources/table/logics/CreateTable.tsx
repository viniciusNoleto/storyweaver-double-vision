'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button, Group, Modal, Stack, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { createTableService, CreateTableServiceResponse } from '../services/createTable';

// Ver `.claude/rules/resources-logic.md` — Padrão 2 (ação com formulário),
// simplificado (sem Yup/`useValidatedFormState`, mesmo espírito de
// `RenameTable.tsx`). `onSuccess` recebe a resposta inteira — quem consome
// decide o que fazer com `code` (ex: redirecionar pra Tela do Mestre, já
// autenticada pelo cookie que `POST /api/tables` seta).
export function useCreateTableLogicData({
  onSuccess,
}: {
  onSuccess: (data: CreateTableServiceResponse) => void;
}) {
  const [name, setName] = useState('');

  const createTableMutation = useMutation({
    mutationFn: () => createTableService({ body: { name: name.trim() || undefined } }),
    onSuccess: ({ data }) => onSuccess(data),
    onError: () => {
      notifications.show({
        title: 'Erro',
        message: 'Não foi possível criar a mesa. Tente novamente.',
        color: 'red',
      });
    },
  });

  function createTableReset() {
    setName('');
  }

  return {
    name,
    setName,
    createTableMutation,
    createTableReset,
  };
}

export function CreateTableLogicComponent({
  logicData,
  opened,
  onCancel,
}: {
  logicData: ReturnType<typeof useCreateTableLogicData>;
  opened: boolean;
  onCancel: () => void;
}) {
  const {
    name,
    setName,
    createTableMutation: {
      mutate: createTableMutate,
      isPending: createTableIsPending,
    },
  } = logicData;

  return (
    <Modal
      opened={opened}
      onClose={onCancel}
      title="Nova mesa"
      centered
    >
      <Stack gap="md">
        <TextInput
          label="Nome da mesa (opcional)"
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
            disabled={createTableIsPending}
          >
            Cancelar
          </Button>

          <Button
            loading={createTableIsPending}
            onClick={() => createTableMutate()}
          >
            Criar e entrar como Mestre
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
