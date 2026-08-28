'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { createCharacterService } from '../services/createCharacter';
import {
  CHARACTER_FORM_DEFAULT_STATE,
  CharacterEditPanel,
  characterFormStateToPayload,
  ICharacterFormState,
} from '../components/CharacterEditPanel';
import type { ICharacterMaster } from '../models/Character';

// Ver `.claude/rules/resources-logic.md` — Padrão 2 (ação com formulário).
// Não há `useValidatedFormState`/Yup neste projeto ainda, então o estado do
// formulário é `useState` simples e a validação (só `name` é obrigatório) é
// feita na função de submit do componente, antes do `mutate()`.
// `onSuccess` recebe o personagem criado — o componente pai (`mestre/page.tsx`)
// usa isso para oferecer "salvar como template" logo em seguida.
export function useCreateCharacterLogicData({ code, onSuccess }: { code: string; onSuccess: (character: ICharacterMaster) => void }) {
  const [createCharacterState, setCreateCharacterState] = useState<ICharacterFormState>(CHARACTER_FORM_DEFAULT_STATE);

  const createCharacterMutation = useMutation({
    mutationFn: () => createCharacterService({ code, body: characterFormStateToPayload(createCharacterState) }),
    onSuccess: (res) => {
      notifications.show({ message: res.message['pt-br'], color: 'green' });

      onSuccess(res.data);
    },
    onError: (err: any) => {
      notifications.show({
        title: 'Erro',
        message: err?.data?.message?.['pt-br'] ?? 'Não foi possível completar a operação. Tente novamente.',
        color: 'red',
      });
    },
  });

  function createCharacterReset() {
    setCreateCharacterState(CHARACTER_FORM_DEFAULT_STATE);
  }

  return {
    createCharacterState,
    setCreateCharacterState,
    createCharacterMutation,
    createCharacterReset,
  };
}

export function CreateCharacterLogicComponent({
  logicData,
  opened,
  onCancel,
}: {
  logicData: ReturnType<typeof useCreateCharacterLogicData>;
  opened: boolean;
  onCancel: () => void;
}) {
  const {
    createCharacterState,
    setCreateCharacterState,
    createCharacterMutation: {
      mutate: createCharacterMutate,
      isPending: createCharacterIsPending,
    },
  } = logicData;

  function createCharacter() {
    if (!createCharacterState.name.trim()) {
      notifications.show({ title: 'Erro', message: 'Informe o nome do personagem.', color: 'red' });

      return;
    }

    createCharacterMutate();
  }

  return (
    <CharacterEditPanel
      opened={opened}
      title="Novo personagem"
      state={createCharacterState}
      onChange={setCreateCharacterState}
      onSubmit={createCharacter}
      onCancel={onCancel}
      isSubmitting={createCharacterIsPending}
      submitLabel="Criar"
    />
  );
}
