'use client';

import { ActionIcon, Avatar, Button, Chip, Divider, Group, NumberInput, Modal, Stack, Switch, TextInput } from '@mantine/core';
import { Icon } from '@iconify/react';
import { EStatusEffect } from '../enums/StatusEffect';
import { STATUS_EFFECT_VISUAL } from '../models/StatusEffectVisual';
import type { ICharacterMaster } from '../models/Character';
import type { CreateCharacterServicePayload } from '../services/createCharacter';

// Conjunto fechado dos 4 estados fixos (ver `enums/StatusEffect.ts`) — usado
// para desenhar um `Chip` por estado, sempre na mesma ordem.
const ALL_STATUS_EFFECTS = Object.values(EStatusEffect);

// Painel/modal de edição de ficha — único componente de formulário usado tanto
// pelo `CreateCharacter.tsx` quanto pelo `UpdateCharacter.tsx` (ver
// `.claude/rules/resources-logic.md`). Não existe biblioteca de componentes
// `FormXxx`/`useValidatedFormState` neste projeto ainda (checado: só há os
// `.claude/rules/components-form-*.md` genéricos herdados do projeto de
// referência, sem os componentes reais em `resources`/`components` aqui) —
// por isso este painel usa os componentes do Mantine diretamente, sem tema
// custom (etapa 5 cuida da estética RPG).

// Estado de formulário — `stats` fica como lista (não como `Record` direto do
// model) só enquanto o usuário edita, para permitir linhas com chave
// temporariamente vazia/duplicada sem perder o valor digitado. `status_effects`
// já é `EStatusEffect[]` direto — é um conjunto fechado de 4 valores (seletor
// fixo via `Chip.Group`), não precisa de representação intermediária. A
// conversão para o payload da API acontece em `characterFormStateToPayload`.
export interface ICharacterFormState {
  name: string;
  image_url: string;
  hp_current: number;
  hp_max: number;
  stats: { key: string; value: number }[];
  status_effects: EStatusEffect[];
  visible: boolean;
  has_mana: boolean;
  mana_current: number;
  mana_max: number;
}

export const CHARACTER_FORM_DEFAULT_STATE: ICharacterFormState = {
  name: '',
  image_url: '',
  hp_current: 0,
  hp_max: 1,
  stats: [],
  status_effects: [],
  visible: true,
  has_mana: false,
  mana_current: 0,
  mana_max: 0,
};

export function characterToFormState(character: ICharacterMaster): ICharacterFormState {
  return {
    name: character.name,
    image_url: character.image_url ?? '',
    hp_current: character.hp_current,
    hp_max: character.hp_max,
    stats: Object.entries(character.stats).map(([key, value]) => ({ key, value })),
    status_effects: [...character.status_effects],
    visible: character.visible,
    has_mana: character.has_mana,
    mana_current: character.mana_current,
    mana_max: character.mana_max,
  };
}

export function characterFormStateToPayload(state: ICharacterFormState): CreateCharacterServicePayload {
  const stats = state.stats.reduce<Record<string, number>>((acc, { key, value }) => {
    const trimmedKey = key.trim();

    if (trimmedKey) acc[trimmedKey] = value;

    return acc;
  }, {});

  return {
    name: state.name.trim(),
    image_url: state.image_url.trim() || null,
    hp_current: state.hp_current,
    hp_max: state.hp_max,
    stats,
    status_effects: state.status_effects,
    visible: state.visible,
    has_mana: state.has_mana,
    mana_current: state.mana_current,
    mana_max: state.mana_max,
  };
}

function toNumber(value: number | string): number {
  return typeof value === 'number' ? value : Number(value) || 0;
}

type CharacterEditPanelProps = {
  opened: boolean;
  title: string;
  state: ICharacterFormState;
  onChange: (state: ICharacterFormState) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onDelete?: () => void;
  isSubmitting: boolean;
  submitLabel: string;
};

export function CharacterEditPanel({
  opened,
  title,
  state,
  onChange,
  onSubmit,
  onCancel,
  onDelete,
  isSubmitting,
  submitLabel,
}: CharacterEditPanelProps) {
  function updateField<K extends keyof ICharacterFormState>(key: K, value: ICharacterFormState[K]) {
    onChange({ ...state, [key]: value });
  }

  function addStat() {
    updateField('stats', [...state.stats, { key: '', value: 0 }]);
  }

  function updateStat(index: number, patch: Partial<{ key: string; value: number }>) {
    updateField('stats', state.stats.map((stat, i) => (i === index ? { ...stat, ...patch } : stat)));
  }

  function removeStat(index: number) {
    updateField('stats', state.stats.filter((_, i) => i !== index));
  }

  return (
    <Modal
      opened={opened}
      onClose={onCancel}
      title={title}
      size="lg"
      centered
    >
      <Stack gap="md">
        <Group
          align="flex-end"
          gap="sm"
        >
          <TextInput
            label="Nome"
            placeholder="Ex: Kaelen, o Guardião"
            required
            value={state.name}
            onChange={(event) => updateField('name', event.currentTarget.value)}
            className="flex-1"
          />

          <Avatar
            src={state.image_url.trim() || null}
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
          value={state.image_url}
          onChange={(event) => updateField('image_url', event.currentTarget.value)}
        />

        <Group grow>
          <NumberInput
            label="Vida atual"
            min={0}
            value={state.hp_current}
            onChange={(value) => updateField('hp_current', toNumber(value))}
          />

          <NumberInput
            label="Vida máxima"
            min={1}
            value={state.hp_max}
            onChange={(value) => updateField('hp_max', toNumber(value))}
          />
        </Group>

        <Switch
          label="Visível na Tela de Exibição"
          description="Quando desligado, o personagem some do telão até ser revelado."
          checked={state.visible}
          onChange={(event) => updateField('visible', event.currentTarget.checked)}
        />

        <Divider label="Atributos" labelPosition="left" />

        <Stack gap="xs">
          {state.stats.map((stat, index) => (
            <Group
              key={index}
              gap="xs"
              wrap="nowrap"
            >
              <TextInput
                placeholder="Ex: mana"
                value={stat.key}
                onChange={(event) => updateStat(index, { key: event.currentTarget.value })}
                className="flex-1"
              />

              <NumberInput
                placeholder="0"
                value={stat.value}
                onChange={(value) => updateStat(index, { value: toNumber(value) })}
                className="w-[100px]"
              />

              <ActionIcon
                variant="subtle"
                color="red"
                onClick={() => removeStat(index)}
              >
                <Icon icon="lucide:trash-2" />
              </ActionIcon>
            </Group>
          ))}

          <Button
            variant="subtle"
            size="xs"
            leftSection={<Icon icon="lucide:plus" />}
            onClick={addStat}
            className="self-start"
          >
            Adicionar atributo
          </Button>
        </Stack>

        <Divider label="Condições" labelPosition="left" />

        {/* Conjunto fechado de 4 estados fixos (ver `enums/StatusEffect.ts`)
            — substituiu a lista livre de texto anterior (`IStatusEffect`,
            tipo que não existe mais). Cada `Chip` mostra o ícone/label de
            `STATUS_EFFECT_VISUAL`, a mesma fonte usada pelo `StatusEffectBadge`
            renderizado na carta e na Exibição. */}
        <Chip.Group
          multiple
          value={state.status_effects}
          onChange={(values) => updateField('status_effects', values as EStatusEffect[])}
        >
          <Group gap="xs">
            {ALL_STATUS_EFFECTS.map((effect) => (
              <Chip
                key={effect}
                value={effect}
                variant="light"
                color="secondary"
                icon={(
                  <Icon
                    icon={STATUS_EFFECT_VISUAL[effect].icon}
                    width={14}
                    height={14}
                  />
                )}
              >
                {STATUS_EFFECT_VISUAL[effect].label}
              </Chip>
            ))}
          </Group>
        </Chip.Group>

        <Divider label="Mana" labelPosition="left" />

        <Switch
          label="Tem mana"
          description="Ativa a barra de cristais de mana, visível também na Tela de Exibição."
          checked={state.has_mana}
          onChange={(event) => updateField('has_mana', event.currentTarget.checked)}
        />

        {state.has_mana && (
          <Group grow>
            <NumberInput
              label="Mana atual"
              min={0}
              value={state.mana_current}
              onChange={(value) => updateField('mana_current', toNumber(value))}
            />

            <NumberInput
              label="Mana máxima"
              min={0}
              value={state.mana_max}
              onChange={(value) => updateField('mana_max', toNumber(value))}
            />
          </Group>
        )}

        <Group justify="space-between" mt="sm">
          <div>
            {onDelete && (
              <Button
                variant="subtle"
                color="red"
                disabled={isSubmitting}
                onClick={onDelete}
              >
                Excluir
              </Button>
            )}
          </div>

          <Group gap="sm">
            <Button
              variant="subtle"
              color="gray"
              disabled={isSubmitting}
              onClick={onCancel}
            >
              Cancelar
            </Button>

            <Button
              loading={isSubmitting}
              disabled={!state.name.trim()}
              onClick={onSubmit}
            >
              {submitLabel}
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}
