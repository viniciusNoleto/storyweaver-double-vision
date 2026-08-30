'use client';

import { useState } from 'react';
import { Button, Modal, Stack, Text } from '@mantine/core';
import { Icon } from '@iconify/react';
import { ECharacterKind } from '../enums/CharacterKind';

// Substitui os antigos botões "Novo NPC"/"Novo personagem" (ver
// `.claude/rules/table-concept.md`) — um único botão "Adicionar" que guia o
// Mestre por 2 passos: qual tipo (Personagem/NPC), depois qual ação (criar
// do zero ou reusar um Personagem Salvo). Componente puramente de navegação
// — quem realmente abre o formulário de criação ou o `CharacterTemplatePicker`
// é o componente pai, via `onCreateNew`/`onUseSaved`.
export function AddCharacterMenu({
  onCreateNew,
  onUseSaved,
}: {
  onCreateNew: (kind: ECharacterKind) => void;
  onUseSaved: (kind: ECharacterKind) => void;
}) {
  const [opened, setOpened] = useState(false);
  const [kind, setKind] = useState<ECharacterKind | null>(null);

  function close() {
    setOpened(false);
    setKind(null);
  }

  function pickKind(value: ECharacterKind) {
    setKind(value);
  }

  function pickAction(action: 'new' | 'saved') {
    if (!kind) return;

    if (action === 'new') onCreateNew(kind);
    else onUseSaved(kind);

    close();
  }

  return (
    <>
      <Button
        leftSection={(
          <Icon icon="lucide:plus" />
        )}
        onClick={() => setOpened(true)}
        className="uppercase tracking-[0.06em]"
      >
        Adicionar
      </Button>

      <Modal
        opened={opened}
        onClose={close}
        title={kind ? `Adicionar ${kind === ECharacterKind.NPC ? 'NPC' : 'Personagem'}` : 'Adicionar'}
        centered
      >
        {!kind ? (
          <Stack gap="sm">
            <Text
              size="sm"
              c="dimmed"
            >
              O que você quer adicionar à mesa?
            </Text>

            <Button
              variant="light"
              leftSection={(
                <Icon icon="lucide:user" />
              )}
              onClick={() => pickKind(ECharacterKind.CHARACTER)}
              fullWidth
            >
              Personagem
            </Button>

            <Button
              variant="light"
              leftSection={(
                <Icon icon="lucide:ghost" />
              )}
              onClick={() => pickKind(ECharacterKind.NPC)}
              fullWidth
            >
              NPC
            </Button>
          </Stack>
        ) : (
          <Stack gap="sm">
            <Button
              leftSection={(
                <Icon icon="lucide:sparkles" />
              )}
              onClick={() => pickAction('new')}
              fullWidth
            >
              Criar novo
            </Button>

            <Button
              variant="light"
              leftSection={(
                <Icon icon="lucide:archive" />
              )}
              onClick={() => pickAction('saved')}
              fullWidth
            >
              Usar um personagem salvo
            </Button>

            <Button
              variant="subtle"
              color="gray"
              size="xs"
              onClick={() => setKind(null)}
            >
              Voltar
            </Button>
          </Stack>
        )}
      </Modal>
    </>
  );
}
