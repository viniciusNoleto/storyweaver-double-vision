'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button, Card, Group, Loader, Modal, SimpleGrid, Stack, Text, TextInput, Checkbox, Radio, Divider } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { getClassesService, GET_CLASSES_KEY } from '../services/getClasses';
import { getSpeciesService, GET_SPECIES_KEY } from '../services/getSpecies';
import { getOriginsService, GET_ORIGINS_KEY } from '../services/getOrigins';
import { createCharacterService } from '../services/createCharacter';
import { calculateAttributes } from '../models/calculateAttributes';
import { ATTRIBUTE_ORDER, ATTRIBUTE_LABEL } from '../enums/Attribute';
import { ImageUploadInput } from './ImageUploadInput';
import type { IClass, IOrigin, ISpecies } from '../models/RulesContent';

type WizardStep = 'species' | 'class' | 'classChoices' | 'origin' | 'review';

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
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const { data: speciesData, isLoading: speciesLoading } = useQuery({ queryKey: GET_SPECIES_KEY, queryFn: getSpeciesService, enabled: opened });
  const { data: classesData, isLoading: classesLoading } = useQuery({ queryKey: GET_CLASSES_KEY, queryFn: getClassesService, enabled: opened });
  const { data: originsData, isLoading: originsLoading } = useQuery({ queryKey: GET_ORIGINS_KEY, queryFn: getOriginsService, enabled: opened });

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
    const hasChoices = !!item.skill_proficiency_choice?.count || !!item.knowledge_proficiency_choice?.count || !!item.equipment_choice;

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
  }

  function originValid(): boolean {
    if (!selectedOrigin) return false;
    if (originBonusIndex === null) return false;
    if (selectedOrigin.proficiency_choice && !originProficiency) return false;

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
          <Text size="sm" c="dimmed">
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
                <Text fw={600}>
                  {item.name}
                </Text>
              </Card>
            ))}
          </SimpleGrid>
        </Stack>
      ) : null}

      {!anyLoading && step === 'class' ? (
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
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
                <Text fw={600}>
                  {item.name}
                </Text>

                <Text size="xs" c="dimmed">
                  {`Vida: ${item.hp_base}${item.mana_base > 0 ? ` · Mana: ${item.mana_base}` : ''}`}
                </Text>
              </Card>
            ))}
          </SimpleGrid>

          <Button variant="subtle" color="gray" size="xs" onClick={() => setStep('species')}>
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
              <Text size="sm" fw={600}>
                {`Perícias — escolha ${selectedClass.skill_proficiency_choice.count}`}
              </Text>

              <Stack gap="xs" mt="xs">
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
              <Text size="sm" fw={600}>
                {`Conhecimentos — escolha ${selectedClass.knowledge_proficiency_choice.count}`}
              </Text>

              <Stack gap="xs" mt="xs">
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
              <Text size="sm" fw={600}>
                Equipamento inicial
              </Text>

              <Radio.Group value={equipmentLabel} onChange={setEquipmentLabel} mt="xs">
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
            <Button variant="subtle" color="gray" size="xs" onClick={() => setStep('class')}>
              Voltar
            </Button>

            <Button disabled={!classChoicesValid()} onClick={() => setStep('origin')}>
              Continuar
            </Button>
          </Group>
        </Stack>
      ) : null}

      {!anyLoading && step === 'origin' ? (
        <Stack gap="md">
          {!selectedOrigin ? (
            <>
              <Text size="sm" c="dimmed">
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
                    <Text fw={600}>
                      {item.name}
                    </Text>
                  </Card>
                ))}
              </SimpleGrid>
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
                <Stack gap="xs" mt="xs">
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
                  <Stack gap="xs" mt="xs">
                    {selectedOrigin.proficiency_choice.options.map((option) => (
                      <Radio key={option} value={option} label={option} />
                    ))}
                  </Stack>
                </Radio.Group>
              ) : null}
            </>
          )}

          <Group justify="space-between">
            <Button
              variant="subtle"
              color="gray"
              size="xs"
              onClick={() => (selectedOrigin ? setOriginId(null) : setStep(selectedClass?.skill_proficiency_choice || selectedClass?.knowledge_proficiency_choice?.count || selectedClass?.equipment_choice ? 'classChoices' : 'class'))}
            >
              Voltar
            </Button>

            {selectedOrigin ? (
              <Button disabled={!originValid()} onClick={() => setStep('review')}>
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

          <ImageUploadInput value={imageUrl} onChange={setImageUrl} />

          <Divider label="Resumo" labelPosition="left" />

          <Text size="sm">
            {`${selectedSpecies.name} · ${selectedClass.name} · ${selectedOrigin.name}`}
          </Text>

          <SimpleGrid cols={4}>
            {ATTRIBUTE_ORDER.map((attribute) => (
              <div key={attribute}>
                <Text size="xs" c="dimmed">
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
              <Text size="sm" fw={600}>
                Recursos da Classe
              </Text>

              <Stack gap={4} mt="xs">
                {selectedClass.extra_resources.map((resource) => (
                  <Text key={resource.label} size="sm" c="dimmed">
                    {`${resource.label}: ${resource.value}`}
                  </Text>
                ))}
              </Stack>
            </div>
          ) : null}

          <Group justify="space-between">
            <Button variant="subtle" color="gray" size="xs" onClick={() => setStep('origin')}>
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
  );
}
