'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button, Group, Modal, Radio, Select, Stack, Text, Textarea, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { createOriginService } from '../services/createOrigin';
import { ATTRIBUTE_ORDER, ATTRIBUTE_LABEL, EAttribute } from '../enums/Attribute';
import type { IAttributeBonus, IOrigin } from '../models/RulesContent';

type BonusSplit = 'single' | 'double';

const ATTRIBUTE_OPTIONS = ATTRIBUTE_ORDER.map((attribute) => ({ value: attribute, label: ATTRIBUTE_LABEL[attribute] }));

// Ver `.claude/rules/resources-logic.md` — Padrão 2 (ação com formulário).
// "Criando sua Origem" no manual: +2 pontos de atributo (tudo num só, ou +1
// em dois diferentes — decisão fixa do Mestre na hora de criar, sem
// alternativas pro jogador escolher depois, diferente das 8 origens comuns
// do livro), uma perícia concedida (texto livre — ferramenta, habilidade ou
// conhecimento), itens/moedas iniciais em texto livre.
export function useCreateOriginLogicData({ onSuccess }: { onSuccess: (origin: IOrigin) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [split, setSplit] = useState<BonusSplit>('single');
  const [attributeA, setAttributeA] = useState<string | null>(null);
  const [attributeB, setAttributeB] = useState<string | null>(null);
  const [grantedProficiency, setGrantedProficiency] = useState('');
  const [startingItems, setStartingItems] = useState('');
  const [startingMoney, setStartingMoney] = useState('');

  const createOriginMutation = useMutation({
    mutationFn: () => {
      const attributeBonuses: IAttributeBonus[] = split === 'single'
        ? [{ attribute: attributeA as EAttribute, amount: 2 }]
        : [{ attribute: attributeA as EAttribute, amount: 1 }, { attribute: attributeB as EAttribute, amount: 1 }];

      return createOriginService({
        body: {
          name: name.trim(),
          description: description.trim(),
          attribute_bonuses: attributeBonuses,
          granted_proficiency: grantedProficiency.trim(),
          starting_items: startingItems.trim(),
          starting_money: startingMoney.trim(),
        },
      });
    },
    onSuccess: (res) => {
      notifications.show({ message: res.message['pt-br'], color: 'green' });

      onSuccess(res.data);
    },
    onError: (err: any) => {
      notifications.show({
        title: 'Erro',
        message: err?.data?.message?.['pt-br'] ?? 'Não foi possível criar a origem. Tente novamente.',
        color: 'red',
      });
    },
  });

  function createOriginReset() {
    setName('');
    setDescription('');
    setSplit('single');
    setAttributeA(null);
    setAttributeB(null);
    setGrantedProficiency('');
    setStartingItems('');
    setStartingMoney('');
  }

  return {
    name, setName,
    description, setDescription,
    split, setSplit,
    attributeA, setAttributeA,
    attributeB, setAttributeB,
    grantedProficiency, setGrantedProficiency,
    startingItems, setStartingItems,
    startingMoney, setStartingMoney,
    createOriginMutation,
    createOriginReset,
  };
}

export function CreateOriginLogicComponent({
  logicData,
  opened,
  onCancel,
}: {
  logicData: ReturnType<typeof useCreateOriginLogicData>;
  opened: boolean;
  onCancel: () => void;
}) {
  const {
    name, setName,
    description, setDescription,
    split, setSplit,
    attributeA, setAttributeA,
    attributeB, setAttributeB,
    grantedProficiency, setGrantedProficiency,
    startingItems, setStartingItems,
    startingMoney, setStartingMoney,
    createOriginMutation: {
      mutate: createOriginMutate,
      isPending: createOriginIsPending,
    },
  } = logicData;

  const valid = !!name.trim()
    && !!grantedProficiency.trim()
    && !!attributeA
    && (split === 'single' || (!!attributeB && attributeB !== attributeA));

  function createOrigin() {
    if (!valid) {
      notifications.show({ title: 'Erro', message: 'Preencha nome, perícia e os atributos do bônus.', color: 'red' });

      return;
    }

    createOriginMutate();
  }

  return (
    <Modal
      opened={opened}
      onClose={onCancel}
      title="Criar Origem customizada"
      size="md"
      centered
    >
      <Stack gap="md">
        <TextInput
          label="Nome"
          placeholder="Ex: Filho do Rio"
          required
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
        />

        <Textarea
          label="Descrição"
          placeholder="De onde ele veio, o que viveu antes da aventura..."
          value={description}
          onChange={(event) => setDescription(event.currentTarget.value)}
          rows={3}
        />

        <div>
          <Text
            size="sm"
            fw={600}
          >
            Bônus de atributo — +2 pontos no total
          </Text>

          <Radio.Group
            value={split}
            onChange={(value) => setSplit(value as BonusSplit)}
            mt="xs"
          >
            <Group gap="md">
              <Radio
                value="single"
                label="1 atributo (+2)"
              />

              <Radio
                value="double"
                label="2 atributos (+1 cada)"
              />
            </Group>
          </Radio.Group>
        </div>

        <Group grow>
          <Select
            label={split === 'single' ? 'Atributo' : 'Primeiro atributo'}
            placeholder="Selecione"
            required
            data={ATTRIBUTE_OPTIONS}
            value={attributeA}
            onChange={setAttributeA}
          />

          {split === 'double' ? (
            <Select
              label="Segundo atributo"
              placeholder="Selecione"
              required
              data={ATTRIBUTE_OPTIONS.filter((option) => option.value !== attributeA)}
              value={attributeB}
              onChange={setAttributeB}
            />
          ) : null}
        </Group>

        <TextInput
          label="Perícia concedida"
          placeholder="Ex: Ferramentas de pescador, Conhecimento náutico, Furtividade..."
          required
          value={grantedProficiency}
          onChange={(event) => setGrantedProficiency(event.currentTarget.value)}
        />

        <Textarea
          label="Itens iniciais"
          placeholder="Combine com o Mestre..."
          value={startingItems}
          onChange={(event) => setStartingItems(event.currentTarget.value)}
          rows={2}
        />

        <TextInput
          label="Dinheiro inicial"
          placeholder="Ex: 10 cg"
          value={startingMoney}
          onChange={(event) => setStartingMoney(event.currentTarget.value)}
        />

        <Group justify="flex-end" gap="sm">
          <Button
            variant="subtle"
            color="gray"
            onClick={onCancel}
            disabled={createOriginIsPending}
          >
            Cancelar
          </Button>

          <Button
            loading={createOriginIsPending}
            disabled={!valid}
            onClick={createOrigin}
          >
            Criar Origem
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
