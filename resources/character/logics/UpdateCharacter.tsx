'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { updateCharacterService } from '../services/updateCharacter';
import {
  CHARACTER_FORM_DEFAULT_STATE,
  CharacterEditPanel,
  characterFormStateToPayload,
  ICharacterFormState,
} from '../components/CharacterEditPanel';

// Ver `.claude/rules/resources-logic.md` — Padrão 2 (ação com formulário),
// variante "update": o hook recebe `editingCharacterId` (não o registro
// inteiro) e o componente pai é quem popula `setUpdateCharacterState` com
// `characterToFormState(character)` antes de abrir o modal (mesmo padrão do
// exemplo de `updateDiscipline` na regra, adaptado porque este projeto ainda
// não tem `useValidatedFormState`/Yup).
export function useUpdateCharacterLogicData({
  code,
  editingCharacterId,
  onSuccess,
}: {
  code: string;
  editingCharacterId: number | null;
  onSuccess: () => void;
}) {
  const [updateCharacterState, setUpdateCharacterState] = useState<ICharacterFormState>(CHARACTER_FORM_DEFAULT_STATE);

  const updateCharacterMutation = useMutation({
    mutationFn: () => {
      if (editingCharacterId === null) return Promise.reject(new Error('Nenhum personagem selecionado.'));

      return updateCharacterService({
        code,
        characterId: editingCharacterId,
        body: characterFormStateToPayload(updateCharacterState),
      });
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
    updateCharacterState,
    setUpdateCharacterState,
    updateCharacterMutation,
  };
}

export function UpdateCharacterLogicComponent({
  logicData,
  opened,
  onCancel,
  onDelete,
}: {
  logicData: ReturnType<typeof useUpdateCharacterLogicData>;
  opened: boolean;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const {
    updateCharacterState,
    setUpdateCharacterState,
    updateCharacterMutation: {
      mutate: updateCharacterMutate,
      isPending: updateCharacterIsPending,
    },
  } = logicData;

  function updateCharacter() {
    if (!updateCharacterState.name.trim()) {
      notifications.show({ title: 'Erro', message: 'Informe o nome do personagem.', color: 'red' });

      return;
    }

    updateCharacterMutate();
  }

  return (
    <CharacterEditPanel
      opened={opened}
      title="Editar personagem"
      state={updateCharacterState}
      onChange={setUpdateCharacterState}
      onSubmit={updateCharacter}
      onCancel={onCancel}
      onDelete={onDelete}
      isSubmitting={updateCharacterIsPending}
      submitLabel="Salvar"
    />
  );
}
