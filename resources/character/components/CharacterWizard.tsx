'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ActionIcon, Button, Card, Group, Loader, Modal, Select, SimpleGrid, Stack, Text, TextInput, Checkbox, Radio, Divider } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Icon } from '@iconify/react';
import { getClassesService, GET_CLASSES_KEY } from '../services/getClasses';
import { getSpeciesService, GET_SPECIES_KEY } from '../services/getSpecies';
import { getOriginsService, GET_ORIGINS_KEY } from '../services/getOrigins';
import { getToolsService, GET_TOOLS_KEY } from '../services/getTools';
import { createCharacterService } from '../services/createCharacter';
import { calculateAttributes } from '../models/calculateAttributes';
import { ATTRIBUTE_ORDER, ATTRIBUTE_LABEL } from '../enums/Attribute';
import { ImageUploadInput } from './ImageUploadInput';
import { useCreateOriginLogicData, CreateOriginLogicComponent } from '../logics/CreateOrigin';
import type { IClass, IOrigin, ISpecies } from '../models/RulesContent';

type WizardStep = 'species' | 'class' | 'classChoices' | 'origin' | 'review';

// "Ver detalhes" (botão de informação nos cards) — um modal genérico por
// cima do wizard, sem afetar a seleção/progresso. Union discriminada porque
// cada tipo mostra campos diferentes da ficha (ver renderDetailContent).
type DetailTarget =
  | { type: 'species'; item: ISpecies }
  | { type: 'class'; item: IClass }
  | { type: 'origin'; item: IOrigin };

function renderDetailContent(target: DetailTarget) {
  if (target.type === 'species') {
    const { item } = target;

    return (
      <Stack gap="md">
        <Text size="sm">
          {item.description}
        </Text>

        {item.racial_abilities.length > 0 ? (
          <>
            <Divider
              label="Habilidades Raciais"
              labelPosition="left"
            />

            <Stack gap="sm">
              {item.racial_abilities.map((ability) => (
                <div key={ability.name}>
                  <Text
                    size="sm"
                    fw={600}
                  >
                    {ability.name}
                  </Text>

                  <Text
                    size="sm"
                    c="dimmed"
                  >
                    {ability.description}
                  </Text>
                </div>
              ))}
            </Stack>
          </>
        ) : null}
      </Stack>
    );
  }

  if (target.type === 'class') {
    const { item } = target;

    return (
      <Stack gap="md">
        <Text size="sm">
          {item.description}
        </Text>

        <Text size="sm">
          {`Atributo(s) primário(s): ${item.primary_attributes.map((attribute) => ATTRIBUTE_LABEL[attribute as keyof typeof ATTRIBUTE_LABEL] ?? attribute).join(', ')}`}
        </Text>

        {item.attribute_bonuses.length > 0 ? (
          <Text size="sm">
            {`Bônus de atributo: ${item.attribute_bonuses.map((bonus) => `${bonus.amount >= 0 ? '+' : ''}${bonus.amount} ${ATTRIBUTE_LABEL[bonus.attribute as keyof typeof ATTRIBUTE_LABEL] ?? bonus.attribute}`).join(', ')}`}
          </Text>
        ) : null}

        <Text size="sm">
          {`Vida: ${item.hp_base}${item.mana_base > 0 ? ` · Mana: ${item.mana_base}` : ''} · Evasão: ${item.evasion}`}
        </Text>

        {item.extra_resources.length > 0 ? (
          <>
            <Divider
              label="Recursos da Classe"
              labelPosition="left"
            />

            <Stack gap={4}>
              {item.extra_resources.map((resource) => (
                <Text
                  key={resource.label}
                  size="sm"
                  c="dimmed"
                >
                  {`${resource.label}: ${resource.value}`}
                </Text>
              ))}
            </Stack>
          </>
        ) : null}
      </Stack>
    );
  }

  const { item } = target;

  return (
    <Stack gap="md">
      <Text size="sm">
        {item.description}
      </Text>

      <Text size="sm">
        {`Itens iniciais: ${item.starting_items}`}
      </Text>

      <Text size="sm">
        {`Dinheiro inicial: ${item.starting_money}`}
      </Text>

      <Divider
        label="Bônus de atributo (escolha um na hora de selecionar)"
        labelPosition="left"
      />

      <Stack gap={4}>
        {item.attribute_bonus_options.map((option, index) => (
          <Text
            key={index}
            size="sm"
            c="dimmed"
          >
            {option.map((bonus) => `${bonus.amount >= 0 ? '+' : ''}${bonus.amount} ${ATTRIBUTE_LABEL[bonus.attribute as keyof typeof ATTRIBUTE_LABEL] ?? bonus.attribute}`).join(', ')}
          </Text>
        ))}
      </Stack>

      {item.granted_proficiency ? (
        <Text size="sm">
          {`Perícia concedida: ${item.granted_proficiency}`}
        </Text>
      ) : null}

      {item.proficiency_choice ? (
        <Text size="sm">
          {`Perícia (escolha uma): ${item.proficiency_choice.options.join(' ou ')}`}
        </Text>
      ) : null}
    </Stack>
  );
}

// Uma classe tem "escolhas" quando oferece perícia, conhecimento ou
// equipamento à escolha do jogador — usada tanto para decidir se a etapa
// `classChoices` deve ser exibida (pickClass) quanto para decidir para onde
// o botão "Voltar" da etapa Origem deve retornar.
function classHasChoices(item: IClass): boolean {
  return !!item.skill_proficiency_choice?.count || !!item.knowledge_proficiency_choice?.count || !!item.equipment_choice;
}

// Wizard de criação de Personagem guiado pelas regras de Contos e Cantos de
// Vilgard (ver docs/superpowers/specs/2026-08-28-character-creation-wizard-design.md).
// Motor genérico: nenhuma etapa conhece o nome de nenhuma classe/espécie/
// origem específica — tudo vem das fichas carregadas do banco (Task 1/3/4).
export function CharacterWizard({
  code,
  opened,
  onCancel,
  onCreated,
}: {
  code: string;
  opened: boolean;
  onCancel: () => void;
  onCreated: (character: { name: string; image_url: string | null; hp_max: number; has_mana: boolean; mana_max: number }) => void;
}) {
  const [step, setStep] = useState<WizardStep>('species');
  const [speciesId, setSpeciesId] = useState<number | null>(null);
  const [classId, setClassId] = useState<number | null>(null);
  const [skillChoices, setSkillChoices] = useState<string[]>([]);
  const [knowledgeChoices, setKnowledgeChoices] = useState<string[]>([]);
  const [equipmentLabel, setEquipmentLabel] = useState<string | null>(null);
  const [originId, setOriginId] = useState<number | null>(null);
  const [originBonusIndex, setOriginBonusIndex] = useState<number | null>(null);
  const [originProficiency, setOriginProficiency] = useState<string | null>(null);
  const [toolChoiceId, setToolChoiceId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [detailTarget, setDetailTarget] = useState<DetailTarget | null>(null);
  const [creatingOrigin, setCreatingOrigin] = useState(false);
  const [toolsCatalogOpen, setToolsCatalogOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: speciesData, isLoading: speciesLoading } = useQuery({ queryKey: GET_SPECIES_KEY, queryFn: getSpeciesService, enabled: opened });
  const { data: classesData, isLoading: classesLoading } = useQuery({ queryKey: GET_CLASSES_KEY, queryFn: getClassesService, enabled: opened });
  const { data: originsData, isLoading: originsLoading } = useQuery({ queryKey: GET_ORIGINS_KEY, queryFn: getOriginsService, enabled: opened });
  const { data: toolsData } = useQuery({ queryKey: GET_TOOLS_KEY, queryFn: getToolsService, enabled: opened });

  const toolsList = toolsData?.data ?? [];

  const speciesList = speciesData?.data ?? [];
  const classesList = classesData?.data ?? [];
  const originsList = originsData?.data ?? [];

  const selectedSpecies = speciesList.find((item) => item.id === speciesId) ?? null;
  const selectedClass = classesList.find((item) => item.id === classId) ?? null;
  const selectedOrigin = originsList.find((item) => item.id === originId) ?? null;

  function reset() {
    setStep('species');
    setSpeciesId(null);
    setClassId(null);
    setSkillChoices([]);
    setKnowledgeChoices([]);
    setEquipmentLabel(null);
    setOriginId(null);
    setOriginBonusIndex(null);
    setOriginProficiency(null);
    setToolChoiceId(null);
    setName('');
    setImageUrl('');
  }

  function cancel() {
    reset();
    onCancel();
  }

  function pickSpecies(item: ISpecies) {
    setSpeciesId(item.id);
    setStep('class');
  }

  function pickClass(item: IClass) {
    setClassId(item.id);
    setSkillChoices([]);
    setKnowledgeChoices([]);
    setEquipmentLabel(item.equipment_choice?.options[0]?.label ?? null);

    // Classe sem NENHUMA escolha (nem perícia, nem conhecimento, nem
    // equipamento) pula direto pra Origem — motor genérico não força uma
    // etapa vazia.
    const hasChoices = classHasChoices(item);

    setStep(hasChoices ? 'classChoices' : 'origin');
  }

  function toggleSkillChoice(value: string) {
    if (!selectedClass?.skill_proficiency_choice) return;

    const max = selectedClass.skill_proficiency_choice.count;

    setSkillChoices((prev) => {
      if (prev.includes(value)) return prev.filter((v) => v !== value);
      if (prev.length >= max) return prev;

      return [...prev, value];
    });
  }

  function toggleKnowledgeChoice(value: string) {
    if (!selectedClass?.knowledge_proficiency_choice) return;

    const max = selectedClass.knowledge_proficiency_choice.count;

    setKnowledgeChoices((prev) => {
      if (prev.includes(value)) return prev.filter((v) => v !== value);
      if (prev.length >= max) return prev;

      return [...prev, value];
    });
  }

  function classChoicesValid(): boolean {
    if (!selectedClass) return false;

    const skillOk = !selectedClass.skill_proficiency_choice || skillChoices.length === selectedClass.skill_proficiency_choice.count;
    const knowledgeOk = !selectedClass.knowledge_proficiency_choice || knowledgeChoices.length === selectedClass.knowledge_proficiency_choice.count;
    const equipmentOk = !selectedClass.equipment_choice || !!equipmentLabel;

    return skillOk && knowledgeOk && equipmentOk;
  }

  function pickOrigin(item: IOrigin) {
    setOriginId(item.id);
    setOriginBonusIndex(0);
    setOriginProficiency(item.proficiency_choice?.options[0] ?? null);
    setToolChoiceId(item.tool_choice?.tool_ids[0] ?? null);
  }

  const createOriginLogicData = useCreateOriginLogicData({
    onSuccess: (origin) => {
      // Insere a origem nova direto no cache da query (em vez de só invalidar
      // e esperar um refetch) — assim `originsList`/`selectedOrigin` já
      // enxergam ela no mesmo render, sem flash de "não encontrada".
      queryClient.setQueryData(GET_ORIGINS_KEY, (old: { data: IOrigin[] } | undefined) => (
        old ? { ...old, data: [...old.data, origin] } : old
      ));

      pickOrigin(origin);
      setCreatingOrigin(false);
    },
  });

  function originValid(): boolean {
    if (!selectedOrigin) return false;
    if (originBonusIndex === null) return false;
    if (selectedOrigin.proficiency_choice && !originProficiency) return false;
    if (selectedOrigin.tool_choice && toolChoiceId === null) return false;

    return true;
  }

  const finalAttributes = selectedClass && selectedSpecies && selectedOrigin && originBonusIndex !== null
    ? calculateAttributes([
      selectedClass.attribute_bonuses,
      selectedSpecies.attribute_bonuses,
      selectedOrigin.attribute_bonus_options[originBonusIndex],
    ])
    : null;

  const createMutation = useMutation({
    mutationFn: () => {
      if (!selectedClass || !selectedSpecies || !selectedOrigin || !finalAttributes) return Promise.reject(new Error('Wizard incompleto.'));

      return createCharacterService({
        code,
        body: {
          name: name.trim(),
          image_url: imageUrl || null,
          hp_current: selectedClass.hp_base,
          hp_max: selectedClass.hp_base,
          has_mana: selectedClass.mana_base > 0,
          mana_current: selectedClass.mana_base,
          mana_max: selectedClass.mana_base,
          class_id: selectedClass.id,
          species_id: selectedSpecies.id,
          origin_id: selectedOrigin.id,
          level: 1,
          attributes: finalAttributes,
        },
      });
    },
    onSuccess: (res) => {
      notifications.show({ message: res.message['pt-br'], color: 'green' });

      const created = res.data;

      reset();
      onCreated({ name: created.name, image_url: created.image_url, hp_max: created.hp_max, has_mana: created.has_mana, mana_max: created.mana_max });
    },
    onError: (err: any) => {
      notifications.show({
        title: 'Erro',
        message: err?.data?.message?.['pt-br'] ?? 'Não foi possível criar o personagem. Tente novamente.',
        color: 'red',
      });
    },
  });

  const anyLoading = speciesLoading || classesLoading || originsLoading;

  return (
    <>
      <Modal
        opened={!!detailTarget}
        onClose={() => setDetailTarget(null)}
        title={detailTarget?.item.name ?? ''}
        centered
        zIndex={1000}
      >
        {detailTarget ? renderDetailContent(detailTarget) : null}
      </Modal>

      <CreateOriginLogicComponent
        logicData={createOriginLogicData}
        opened={creatingOrigin}
        onCancel={() => setCreatingOrigin(false)}
      />

      <Modal
        opened={toolsCatalogOpen}
        onClose={() => setToolsCatalogOpen(false)}
        title="Ferramentas"
        zIndex={1000}
        centered
      >
        <Stack gap="sm">
          {toolsList.map((tool) => (
            <div key={tool.id}>
              <Group
                justify="space-between"
                wrap="nowrap"
              >
                <Text fw={600}>
                  {tool.name}
                </Text>

                <Text
                  size="xs"
                  c="dimmed"
                >
                  {tool.price}
                </Text>
              </Group>

              <Text
                size="sm"
                c="dimmed"
              >
                {tool.description}
              </Text>
            </div>
          ))}
        </Stack>
      </Modal>

      <Modal
        opened={opened}
        onClose={cancel}
      title="Criar Personagem"
      size="lg"
      centered
    >
      {anyLoading ? (
        <div className="flex justify-center py-8">
          <Loader color="primary" />
        </div>
      ) : null}

      {!anyLoading && step === 'species' ? (
        <Stack gap="sm">
          <Text
            size="sm"
            c="dimmed"
          >
            Escolha a Espécie do personagem.
          </Text>

          <SimpleGrid cols={2}>
            {speciesList.map((item) => (
              <Card
                key={item.id}
                padding="sm"
                className="cursor-pointer transition hover:border-primary-400/60"
                onClick={() => pickSpecies(item)}
              >
                <Group
                  justify="space-between"
                  wrap="nowrap"
                >
                  <Text fw={600}>
                    {item.name}
                  </Text>

                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    onClick={(event) => {
                      event.stopPropagation();
                      setDetailTarget({ type: 'species', item });
                    }}
                  >
                    <Icon icon="lucide:info" />
                  </ActionIcon>
                </Group>
              </Card>
            ))}
          </SimpleGrid>
        </Stack>
      ) : null}

      {!anyLoading && step === 'class' ? (
        <Stack gap="sm">
          <Text
            size="sm"
            c="dimmed"
          >
            Escolha a Classe do personagem.
          </Text>

          <SimpleGrid cols={2}>
            {classesList.map((item) => (
              <Card
                key={item.id}
                padding="sm"
                className="cursor-pointer transition hover:border-primary-400/60"
                onClick={() => pickClass(item)}
              >
                <Group
                  justify="space-between"
                  wrap="nowrap"
                >
                  <Text fw={600}>
                    {item.name}
                  </Text>

                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    onClick={(event) => {
                      event.stopPropagation();
                      setDetailTarget({ type: 'class', item });
                    }}
                  >
                    <Icon icon="lucide:info" />
                  </ActionIcon>
                </Group>

                <Text
                  size="xs"
                  c="dimmed"
                >
                  {`Vida: ${item.hp_base}${item.mana_base > 0 ? ` · Mana: ${item.mana_base}` : ''}`}
                </Text>
              </Card>
            ))}
          </SimpleGrid>

          <Button
            variant="subtle"
            color="gray"
            size="xs"
            onClick={() => setStep('species')}
          >
            Voltar
          </Button>
        </Stack>
      ) : null}

      {!anyLoading && step === 'classChoices' && selectedClass ? (
        <Stack gap="md">
          <Text fw={700}>
            {`Escolhas de ${selectedClass.name}`}
          </Text>

          {selectedClass.skill_proficiency_choice ? (
            <div>
              <Text
                size="sm"
                fw={600}
              >
                {`Perícias — escolha ${selectedClass.skill_proficiency_choice.count}`}
              </Text>

              <Stack
                gap="xs"
                mt="xs"
              >
                {selectedClass.skill_proficiency_choice.options.map((option) => (
                  <Checkbox
                    key={option}
                    label={option}
                    checked={skillChoices.includes(option)}
                    onChange={() => toggleSkillChoice(option)}
                  />
                ))}
              </Stack>
            </div>
          ) : null}

          {selectedClass.knowledge_proficiency_choice && selectedClass.knowledge_proficiency_choice.count > 0 ? (
            <div>
              <Text
                size="sm"
                fw={600}
              >
                {`Conhecimentos — escolha ${selectedClass.knowledge_proficiency_choice.count}`}
              </Text>

              <Stack
                gap="xs"
                mt="xs"
              >
                {selectedClass.knowledge_proficiency_choice.options.map((option) => (
                  <Checkbox
                    key={option}
                    label={option}
                    checked={knowledgeChoices.includes(option)}
                    onChange={() => toggleKnowledgeChoice(option)}
                  />
                ))}
              </Stack>
            </div>
          ) : null}

          {selectedClass.equipment_choice ? (
            <div>
              <Text
                size="sm"
                fw={600}
              >
                Equipamento inicial
              </Text>

              <Radio.Group
                value={equipmentLabel}
                onChange={setEquipmentLabel}
                mt="xs"
              >
                <Stack gap="xs">
                  {selectedClass.equipment_choice.options.map((option) => (
                    <Radio
                      key={option.label}
                      value={option.label}
                      label={`${option.label}: ${option.description}`}
                    />
                  ))}
                </Stack>
              </Radio.Group>
            </div>
          ) : null}

          <Group justify="space-between">
            <Button
              variant="subtle"
              color="gray"
              size="xs"
              onClick={() => setStep('class')}
            >
              Voltar
            </Button>

            <Button
              disabled={!classChoicesValid()}
              onClick={() => setStep('origin')}
            >
              Continuar
            </Button>
          </Group>
        </Stack>
      ) : null}

      {!anyLoading && step === 'origin' ? (
        <Stack gap="md">
          {!selectedOrigin ? (
            <>
              <Text
                size="sm"
                c="dimmed"
              >
                Escolha a Origem do personagem.
              </Text>

              <SimpleGrid cols={2}>
                {originsList.map((item) => (
                  <Card
                    key={item.id}
                    padding="sm"
                    className="cursor-pointer transition hover:border-primary-400/60"
                    onClick={() => pickOrigin(item)}
                  >
                    <Group
                      justify="space-between"
                      wrap="nowrap"
                    >
                      <Text fw={600}>
                        {item.name}
                      </Text>

                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        onClick={(event) => {
                          event.stopPropagation();
                          setDetailTarget({ type: 'origin', item });
                        }}
                      >
                        <Icon icon="lucide:info" />
                      </ActionIcon>
                    </Group>
                  </Card>
                ))}

                <Card
                  padding="sm"
                  className="cursor-pointer border-dashed transition hover:border-primary-400/60"
                  onClick={() => {
                    createOriginLogicData.createOriginReset();
                    setCreatingOrigin(true);
                  }}
                >
                  <Group
                    justify="center"
                    wrap="nowrap"
                    className="h-full"
                  >
                    <Icon icon="lucide:plus" />

                    <Text fw={600}>
                      Criar Origem customizada
                    </Text>
                  </Group>
                </Card>
              </SimpleGrid>

              <Button
                variant="subtle"
                size="xs"
                leftSection={(
                  <Icon icon="lucide:hammer" />
                )}
                onClick={() => setToolsCatalogOpen(true)}
              >
                Ver Ferramentas
              </Button>
            </>
          ) : (
            <>
              <Text fw={700}>
                {selectedOrigin.name}
              </Text>

              <Radio.Group
                label="Bônus de atributo"
                value={originBonusIndex === null ? null : String(originBonusIndex)}
                onChange={(value) => setOriginBonusIndex(Number(value))}
              >
                <Stack
                  gap="xs"
                  mt="xs"
                >
                  {selectedOrigin.attribute_bonus_options.map((option, index) => (
                    <Radio
                      key={index}
                      value={String(index)}
                      label={option.map((bonus) => `+${bonus.amount} ${ATTRIBUTE_LABEL[bonus.attribute as keyof typeof ATTRIBUTE_LABEL]}`).join(', ')}
                    />
                  ))}
                </Stack>
              </Radio.Group>

              {selectedOrigin.proficiency_choice ? (
                <Radio.Group
                  label="Perícia"
                  value={originProficiency}
                  onChange={setOriginProficiency}
                >
                  <Stack
                    gap="xs"
                    mt="xs"
                  >
                    {selectedOrigin.proficiency_choice.options.map((option) => (
                      <Radio
                        key={option}
                        value={option}
                        label={option}
                      />
                    ))}
                  </Stack>
                </Radio.Group>
              ) : null}

              {selectedOrigin.tool_choice ? (
                <Select
                  label="Ferramenta"
                  data={selectedOrigin.tool_choice.tool_ids.map((toolId) => {
                    const tool = toolsList.find((item) => item.id === toolId);

                    return { value: String(toolId), label: tool ? `${tool.name} (${tool.price})` : String(toolId) };
                  })}
                  value={toolChoiceId === null ? null : String(toolChoiceId)}
                  onChange={(value) => setToolChoiceId(value ? Number(value) : null)}
                />
              ) : null}
            </>
          )}

          <Group justify="space-between">
            <Button
              variant="subtle"
              color="gray"
              size="xs"
              onClick={() => (selectedOrigin ? setOriginId(null) : setStep(selectedClass && classHasChoices(selectedClass) ? 'classChoices' : 'class'))}
            >
              Voltar
            </Button>

            {selectedOrigin ? (
              <Button
                disabled={!originValid()}
                onClick={() => setStep('review')}
              >
                Continuar
              </Button>
            ) : null}
          </Group>
        </Stack>
      ) : null}

      {!anyLoading && step === 'review' && selectedClass && selectedSpecies && selectedOrigin && finalAttributes ? (
        <Stack gap="md">
          <TextInput
            label="Nome"
            placeholder="Ex: Kaelen, o Guardião"
            required
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
          />

          <ImageUploadInput
            value={imageUrl}
            onChange={setImageUrl}
          />

          <Divider
            label="Resumo"
            labelPosition="left"
          />

          <Text size="sm">
            {`${selectedSpecies.name} · ${selectedClass.name} · ${selectedOrigin.name}`}
          </Text>

          {selectedOrigin.tool_choice && toolChoiceId !== null ? (
            <Text
              size="sm"
              c="dimmed"
            >
              {`Ferramenta: ${toolsList.find((tool) => tool.id === toolChoiceId)?.name ?? '—'}`}
            </Text>
          ) : null}

          <SimpleGrid cols={4}>
            {ATTRIBUTE_ORDER.map((attribute) => (
              <div key={attribute}>
                <Text
                  size="xs"
                  c="dimmed"
                >
                  {ATTRIBUTE_LABEL[attribute]}
                </Text>

                <Text fw={700}>
                  {finalAttributes[attribute] >= 0 ? `+${finalAttributes[attribute]}` : finalAttributes[attribute]}
                </Text>
              </div>
            ))}
          </SimpleGrid>

          <Text size="sm">
            {`Vida máxima: ${selectedClass.hp_base}${selectedClass.mana_base > 0 ? ` · Mana máxima: ${selectedClass.mana_base}` : ''}`}
          </Text>

          {selectedClass.extra_resources.length > 0 ? (
            <div>
              <Text
                size="sm"
                fw={600}
              >
                Recursos da Classe
              </Text>

              <Stack
                gap={4}
                mt="xs"
              >
                {selectedClass.extra_resources.map((resource) => (
                  <Text
                    key={resource.label}
                    size="sm"
                    c="dimmed"
                  >
                    {`${resource.label}: ${resource.value}`}
                  </Text>
                ))}
              </Stack>
            </div>
          ) : null}

          <Group justify="space-between">
            <Button
              variant="subtle"
              color="gray"
              size="xs"
              onClick={() => setStep('origin')}
            >
              Voltar
            </Button>

            <Button
              loading={createMutation.isPending}
              disabled={!name.trim()}
              onClick={() => createMutation.mutate()}
            >
              Criar Personagem
            </Button>
          </Group>
        </Stack>
      ) : null}
      </Modal>
    </>
  );
}
