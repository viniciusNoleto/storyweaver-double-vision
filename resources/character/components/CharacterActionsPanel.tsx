'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button, Divider, Group, Modal, NumberInput, Progress, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Icon } from '@iconify/react';
import { applyCharacterActionService } from '../services/applyCharacterAction';
import { healthColor } from '../models/HealthColor';
import { ManaCrystals } from './ManaCrystals';
import type { ICharacterMaster } from '../models/Character';

function toNumber(value: number | string): number {
  return typeof value === 'number' ? value : Number(value) || 0;
}

// Ação rápida de dano/cura — não é um Logic completo de `resources-logic.md`
// (não é create/update de um recurso, é uma ação pontual disparada várias
// vezes seguidas numa sessão de RPG), mas mantém a mutation fora do JSX,
// dentro de um hook nomeado, mesmo espírito da regra. `characterId` pode ser
// `null` enquanto o painel está fechado (mesmo padrão de
// `useUpdateCharacterLogicData`/`editingCharacterId`).
export function useApplyCharacterActionLogicData({ code, characterId }: { code: string; characterId: number | null }) {
  const applyCharacterActionMutation = useMutation({
    mutationFn: ({ type, amount }: { type: 'damage' | 'heal' | 'mana-spend' | 'mana-restore'; amount: number }) => {
      if (characterId === null) return Promise.reject(new Error('Nenhum personagem selecionado.'));

      return applyCharacterActionService({ code, characterId, body: { type, amount } });
    },
    onError: (err: any) => {
      notifications.show({
        title: 'Erro',
        message: err?.data?.message?.['pt-br'] ?? 'Não foi possível aplicar a ação. Tente novamente.',
        color: 'red',
      });
    },
  });

  return {
    applyCharacterActionMutation,
  };
}

type CharacterActionsPanelProps = {
  logicData: ReturnType<typeof useApplyCharacterActionLogicData>;
  character: ICharacterMaster | null;
  opened: boolean;
  onClose: () => void;
  onEditFull: () => void;
};

// Painel aberto ao clicar numa ficha na Tela do Mestre — dano/cura rápidos
// (várias vezes seguidas, sem fechar) + atalho para o modal de edição
// completo já existente (`UpdateCharacterLogicComponent`). Nunca usado pela
// Tela de Exibição (essa não tem números — ver `.claude/rules/table-concept.md`
// seção 2).
export function CharacterActionsPanel({
  logicData,
  character,
  opened,
  onClose,
  onEditFull,
}: CharacterActionsPanelProps) {
  const [damageAmount, setDamageAmount] = useState<number>(0);
  const [healAmount, setHealAmount] = useState<number>(0);
  const [manaSpendAmount, setManaSpendAmount] = useState<number>(0);
  const [manaRestoreAmount, setManaRestoreAmount] = useState<number>(0);

  const {
    applyCharacterActionMutation: {
      mutate: applyCharacterActionMutate,
      isPending: applyCharacterActionIsPending,
      variables: applyCharacterActionVariables,
    },
  } = logicData;

  if (!character) return null;

  function applyDamage() {
    if (damageAmount <= 0) return;

    applyCharacterActionMutate({ type: 'damage', amount: damageAmount });
    setDamageAmount(0);
  }

  function applyHeal() {
    if (healAmount <= 0) return;

    applyCharacterActionMutate({ type: 'heal', amount: healAmount });
    setHealAmount(0);
  }

  function applyManaSpend() {
    if (manaSpendAmount <= 0) return;

    applyCharacterActionMutate({ type: 'mana-spend', amount: manaSpendAmount });
    setManaSpendAmount(0);
  }

  function applyManaRestore() {
    if (manaRestoreAmount <= 0) return;

    applyCharacterActionMutate({ type: 'mana-restore', amount: manaRestoreAmount });
    setManaRestoreAmount(0);
  }

  const percent = character.hp_max > 0
    ? Math.min(100, Math.max(0, (character.hp_current / character.hp_max) * 100))
    : 0;

  const isApplyingDamage = applyCharacterActionIsPending && applyCharacterActionVariables?.type === 'damage';
  const isApplyingHeal = applyCharacterActionIsPending && applyCharacterActionVariables?.type === 'heal';
  const isApplyingManaSpend = applyCharacterActionIsPending && applyCharacterActionVariables?.type === 'mana-spend';
  const isApplyingManaRestore = applyCharacterActionIsPending && applyCharacterActionVariables?.type === 'mana-restore';

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={character.name}
      size="sm"
      centered
    >
      <div className="flex flex-col gap-4">
        <div>
          <Text
            size="sm"
            className="text-parchment/60"
          >
            Vida
          </Text>

          <Progress
            value={percent}
            color={healthColor(character.hp_current, character.hp_max)}
            size="lg"
            radius="xl"
          />

          <Text
            size="xl"
            fw={700}
            c="primary.5"
            className="mt-1 font-display"
          >
            {`${character.hp_current} / ${character.hp_max}`}
          </Text>

          {character.has_mana && (
            <ManaCrystals
              current={character.mana_current}
              max={character.mana_max}
              crystalSize={18}
              className="mt-2"
            />
          )}
        </div>

        <Divider label="Dano" labelPosition="left" />

        <Group
          gap="sm"
          wrap="nowrap"
        >
          <NumberInput
            min={0}
            value={damageAmount}
            onChange={(value) => setDamageAmount(toNumber(value))}
            className="flex-1"
          />

          <Button
            color="secondary"
            loading={isApplyingDamage}
            disabled={damageAmount <= 0}
            onClick={applyDamage}
          >
            Aplicar dano
          </Button>
        </Group>

        <Divider label="Cura" labelPosition="left" />

        <Group
          gap="sm"
          wrap="nowrap"
        >
          <NumberInput
            min={0}
            value={healAmount}
            onChange={(value) => setHealAmount(toNumber(value))}
            className="flex-1"
          />

          <Button
            color="green"
            loading={isApplyingHeal}
            disabled={healAmount <= 0}
            onClick={applyHeal}
          >
            Aplicar cura
          </Button>
        </Group>

        {character.has_mana && (
          <>
            <Divider label="Mana" labelPosition="left" />

            <Group
              gap="sm"
              wrap="nowrap"
            >
              <NumberInput
                min={0}
                value={manaSpendAmount}
                onChange={(value) => setManaSpendAmount(toNumber(value))}
                className="flex-1"
              />

              <Button
                color="blue"
                loading={isApplyingManaSpend}
                disabled={manaSpendAmount <= 0}
                onClick={applyManaSpend}
              >
                Gastar mana
              </Button>
            </Group>

            <Group
              gap="sm"
              wrap="nowrap"
            >
              <NumberInput
                min={0}
                value={manaRestoreAmount}
                onChange={(value) => setManaRestoreAmount(toNumber(value))}
                className="flex-1"
              />

              <Button
                color="cyan"
                loading={isApplyingManaRestore}
                disabled={manaRestoreAmount <= 0}
                onClick={applyManaRestore}
              >
                Restaurar mana
              </Button>
            </Group>
          </>
        )}

        <Divider />

        <Button
          variant="subtle"
          leftSection={(
            <Icon icon="lucide:pencil" />
          )}
          onClick={onEditFull}
        >
          Editar ficha completa
        </Button>
      </div>
    </Modal>
  );
}
