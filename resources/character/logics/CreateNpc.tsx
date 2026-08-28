'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { Avatar, Button, Group, Modal, NumberInput, Stack, TextInput } from '@mantine/core';
import { Icon } from '@iconify/react';
import { createCharacterService } from '../services/createCharacter';

// Ver `.claude/rules/resources-logic.md` — Padrão 2 (ação com formulário).
// Criação rápida de NPC: mesmo endpoint de `CreateCharacter.tsx`
// (`createCharacterService`), mas com um formulário reduzido a só 4 campos —
// nome, imagem, vida atual e vida máxima. Condições, mana e visibilidade
// ficam nos defaults da API; quem precisar ajustá-los usa "Editar ficha
// completa" depois que o NPC já estiver na mesa.
export interface INpcFormState {
  name: string;
  image_url: string;
  hp_current: number;
  hp_max: number;
}

export const NPC_FORM_DEFAULT_STATE: INpcFormState = {
  name: '',
  image_url: '',
  hp_current: 0,
  hp_max: 1,
};

function toNumber(value: number | string): number {
  return typeof value === 'number' ? value : Number(value) || 0;
}

export function useCreateNpcLogicData({ code, onSuccess }: { code: string; onSuccess: () => void }) {
  const [createNpcState, setCreateNpcState] = useState<INpcFormState>(NPC_FORM_DEFAULT_STATE);

  const createNpcMutation = useMutation({
    mutationFn: () => createCharacterService({
      code,
      body: {
        name: createNpcState.name.trim(),
        image_url: createNpcState.image_url.trim() || null,
        hp_current: createNpcState.hp_current,
        hp_max: createNpcState.hp_max,
      },
    }),
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

  function createNpcReset() {
    setCreateNpcState(NPC_FORM_DEFAULT_STATE);
  }

  return {
    createNpcState,
    setCreateNpcState,
    createNpcMutation,
    createNpcReset,
  };
}

export function CreateNpcLogicComponent({
  logicData,
  opened,
  onCancel,
}: {
  logicData: ReturnType<typeof useCreateNpcLogicData>;
  opened: boolean;
  onCancel: () => void;
}) {
  const {
    createNpcState,
    setCreateNpcState,
    createNpcMutation: {
      mutate: createNpcMutate,
      isPending: createNpcIsPending,
    },
  } = logicData;

  function updateField<K extends keyof INpcFormState>(key: K, value: INpcFormState[K]) {
    setCreateNpcState({ ...createNpcState, [key]: value });
  }

  function createNpc() {
    if (!createNpcState.name.trim()) {
      notifications.show({ title: 'Erro', message: 'Informe o nome do NPC.', color: 'red' });

      return;
    }

    createNpcMutate();
  }

  return (
    <Modal
      opened={opened}
      onClose={onCancel}
      title="Novo NPC"
      size="md"
      centered
    >
      <Stack gap="md">
        <Group
          align="flex-end"
          gap="sm"
        >
          <TextInput
            label="Nome"
            placeholder="Ex: Guarda da Cidade"
            required
            value={createNpcState.name}
            onChange={(event) => updateField('name', event.currentTarget.value)}
            className="flex-1"
          />

          <Avatar
            src={createNpcState.image_url.trim() || null}
            size={48}
            radius="xl"
          >
            <Icon
              icon="lucide:user"
              width={24}
              height={24}
            />
          </Avatar>
        </Group>

        <TextInput
          label="URL da imagem"
          placeholder="https://..."
          value={createNpcState.image_url}
          onChange={(event) => updateField('image_url', event.currentTarget.value)}
        />

        <Group grow>
          <NumberInput
            label="Vida máxima"
            min={1}
            value={createNpcState.hp_max}
            onChange={(value) => {
              const hp_max = toNumber(value);

              // Mesmo comportamento do `CharacterEditPanel` — ajustar a vida
              // máxima já iguala a vida atual a ela.
              setCreateNpcState({ ...createNpcState, hp_max, hp_current: hp_max });
            }}
          />

          <NumberInput
            label="Vida atual"
            min={0}
            value={createNpcState.hp_current}
            onChange={(value) => updateField('hp_current', toNumber(value))}
          />
        </Group>

        <Group
          justify="flex-end"
          gap="sm"
          mt="sm"
        >
          <Button
            variant="subtle"
            color="gray"
            disabled={createNpcIsPending}
            onClick={onCancel}
          >
            Cancelar
          </Button>

          <Button
            loading={createNpcIsPending}
            disabled={!createNpcState.name.trim()}
            onClick={createNpc}
          >
            Criar
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
