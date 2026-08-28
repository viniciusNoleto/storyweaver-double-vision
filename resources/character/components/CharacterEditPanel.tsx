'use client';

import { Button, Chip, Divider, Group, NumberInput, Modal, SimpleGrid, Stack, Switch, Text, TextInput } from '@mantine/core';
import { Icon } from '@iconify/react';
import { useQuery } from '@tanstack/react-query';
import { EStatusEffect } from '../enums/StatusEffect';
import { STATUS_EFFECT_VISUAL } from '../models/StatusEffectVisual';
import { ImageUploadInput } from './ImageUploadInput';
import { getClassesService, GET_CLASSES_KEY } from '../services/getClasses';
import { getSpeciesService, GET_SPECIES_KEY } from '../services/getSpecies';
import { getOriginsService, GET_ORIGINS_KEY } from '../services/getOrigins';
import { ATTRIBUTE_ORDER, ATTRIBUTE_LABEL } from '../enums/Attribute';
import type { ICharacterMaster } from '../models/Character';
import type { CreateCharacterServicePayload } from '../services/createCharacter';
import type { ICharacterAttributes } from '../models/RulesContent';

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

// Estado de formulário — `status_effects` já é `EStatusEffect[]` direto — é
// um conjunto fechado de 4 valores (seletor fixo via `Chip.Group`), não
// precisa de representação intermediária. A conversão para o payload da API
// acontece em `characterFormStateToPayload`.
export interface ICharacterFormState {
  name: string;
  image_url: string;
  hp_current: number;
  hp_max: number;
  // Vida extra — bônus separado da vida normal (ver `db/schema/characters.ts`).
  extra_hp: number;
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
  extra_hp: 0,
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
    extra_hp: character.extra_hp,
    status_effects: [...character.status_effects],
    visible: character.visible,
    has_mana: character.has_mana,
    mana_current: character.mana_current,
    mana_max: character.mana_max,
  };
}

export function characterFormStateToPayload(state: ICharacterFormState): CreateCharacterServicePayload {
  return {
    name: state.name.trim(),
    image_url: state.image_url.trim() || null,
    hp_current: state.hp_current,
    hp_max: state.hp_max,
    extra_hp: state.extra_hp,
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

// Resumo read-only da "ficha de regras" (espécie/classe/origem/atributos/
// recursos da classe) — só aparece quando o personagem foi criado pelo
// wizard (`class_id` presente). Personagens antigos/NPCs não têm esses
// campos preenchidos, então a seção inteira fica ausente (ver `CharacterEditPanel`
// abaixo, que só renderiza este componente quando `classId` é truthy).
function CharacterRulesSummary({
  classId,
  speciesId,
  originId,
  attributes,
}: {
  classId: number;
  speciesId: number | null;
  originId: number | null;
  attributes: ICharacterAttributes | null;
}) {
  const { data: classesData } = useQuery({ queryKey: GET_CLASSES_KEY, queryFn: getClassesService });
  const { data: speciesData } = useQuery({ queryKey: GET_SPECIES_KEY, queryFn: getSpeciesService });
  const { data: originsData } = useQuery({ queryKey: GET_ORIGINS_KEY, queryFn: getOriginsService });

  const classItem = classesData?.data.find((item) => item.id === classId) ?? null;
  const speciesItem = speciesData?.data.find((item) => item.id === speciesId) ?? null;
  const originItem = originsData?.data.find((item) => item.id === originId) ?? null;

  return (
    <Stack gap="sm">
      <Text size="sm">
        {`${speciesItem?.name ?? '—'} · ${classItem?.name ?? '—'} · ${originItem?.name ?? '—'}`}
      </Text>

      {attributes ? (
        <SimpleGrid cols={4}>
          {ATTRIBUTE_ORDER.map((attribute) => (
            <div key={attribute}>
              <Text size="xs" c="dimmed">
                {ATTRIBUTE_LABEL[attribute]}
              </Text>

              <Text fw={700}>
                {attributes[attribute] >= 0 ? `+${attributes[attribute]}` : attributes[attribute]}
              </Text>
            </div>
          ))}
        </SimpleGrid>
      ) : null}

      {classItem && classItem.extra_resources.length > 0 ? (
        <Stack gap={4}>
          {classItem.extra_resources.map((resource) => (
            <Text key={resource.label} size="sm" c="dimmed">
              {`${resource.label}: ${resource.value}`}
            </Text>
          ))}
        </Stack>
      ) : null}
    </Stack>
  );
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
  classId?: number | null;
  speciesId?: number | null;
  originId?: number | null;
  attributes?: ICharacterAttributes | null;
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
  classId,
  speciesId,
  originId,
  attributes,
}: CharacterEditPanelProps) {
  function updateField<K extends keyof ICharacterFormState>(key: K, value: ICharacterFormState[K]) {
    onChange({ ...state, [key]: value });
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
        <TextInput
          label="Nome"
          placeholder="Ex: Kaelen, o Guardião"
          required
          value={state.name}
          onChange={(event) => updateField('name', event.currentTarget.value)}
        />

        <ImageUploadInput
          value={state.image_url}
          onChange={(url) => updateField('image_url', url)}
        />

        <Group grow>
          <NumberInput
            label="Vida máxima"
            min={1}
            value={state.hp_max}
            onChange={(value) => {
              const hp_max = toNumber(value);

              // Ajustar a vida máxima também iguala a vida atual a ela —
              // facilita preencher a ficha sem precisar repetir o número
              // (a pedido do usuário).
              onChange({ ...state, hp_max, hp_current: hp_max });
            }}
          />

          <NumberInput
            label="Vida atual"
            min={0}
            value={state.hp_current}
            onChange={(value) => updateField('hp_current', toNumber(value))}
          />
        </Group>

        <NumberInput
          label="Vida extra"
          description="Bônus separado da vida normal — dano é sempre abatido daqui primeiro."
          min={0}
          value={state.extra_hp}
          onChange={(value) => updateField('extra_hp', toNumber(value))}
        />

        <Switch
          label="Visível na Tela de Exibição"
          description="Quando desligado, o personagem some do telão até ser revelado."
          checked={state.visible}
          onChange={(event) => updateField('visible', event.currentTarget.checked)}
        />

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

        {classId ? (
          <>
            <Divider label="Regras (Contos e Cantos de Vilgard)" labelPosition="left" />

            <CharacterRulesSummary
              classId={classId}
              speciesId={speciesId ?? null}
              originId={originId ?? null}
              attributes={attributes ?? null}
            />
          </>
        ) : null}

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
