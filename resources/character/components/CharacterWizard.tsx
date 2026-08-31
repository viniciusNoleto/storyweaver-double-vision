'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowRight, Check, Info } from '@phosphor-icons/react';
import { Modal } from '@/components/vilgard/Modal';
import { Button } from '@/components/vilgard/Button';
import { Field } from '@/components/vilgard/Field';
import { IconButton } from '@/components/vilgard/IconButton';
import { ErrorBanner } from '@/components/vilgard/ErrorBanner';
import { getClassesService, GET_CLASSES_KEY } from '../services/getClasses';
import { getSpeciesService, GET_SPECIES_KEY } from '../services/getSpecies';
import { getOriginsService, GET_ORIGINS_KEY } from '../services/getOrigins';
import { createCharacterService } from '../services/createCharacter';
import { calculateAttributes } from '../models/calculateAttributes';
import { ATTRIBUTE_ORDER, ATTRIBUTE_LABEL } from '../enums/Attribute';
import { ImageUploadInput } from './ImageUploadInput';
import type { IClass, IOrigin, ISpecies } from '../models/RulesContent';
import type { ICharacterMaster } from '../models/Character';

type WizardStep = 'species' | 'class' | 'classChoices' | 'origin' | 'review';

// Uma classe tem "escolhas" quando oferece perícia, conhecimento ou
// equipamento à escolha do jogador — usada para decidir se a etapa
// `classChoices` deve ser exibida (pickClass).
function classHasChoices(item: IClass): boolean {
  return !!item.skill_proficiency_choice?.count || !!item.knowledge_proficiency_choice?.count || !!item.equipment_choice;
}

// Wizard de criação de Personagem guiado pelas regras de Contos e Cantos de
// Vilgard (ver docs/superpowers/specs/2026-08-28-character-creation-wizard-design.md).
// Motor genérico: nenhuma etapa conhece o nome de nenhuma classe/espécie/
// origem específica — tudo vem das fichas carregadas do banco.
export function CharacterWizard({
  code,
  opened,
  onCancel,
  onCreated,
}: {
  code: string;
  opened: boolean;
  onCancel: () => void;
  onCreated: (character: ICharacterMaster) => void;
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
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
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
    setStep(classHasChoices(item) ? 'classChoices' : 'origin');
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

  function classChoicesValid(): boolean {
    if (!selectedClass) return false;

    const skillOk = !selectedClass.skill_proficiency_choice || skillChoices.length === selectedClass.skill_proficiency_choice.count;
    const equipmentOk = !selectedClass.equipment_choice || !!equipmentLabel;

    return skillOk && equipmentOk;
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
          type: 'PC',
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
      const created = res.data;

      reset();
      onCreated(created);
    },
    onError: (err: any) => {
      setError(err?.data?.message?.['pt-br'] ?? 'Não foi possível criar o personagem. Tente novamente.');
    },
  });

  const anyLoading = speciesLoading || classesLoading || originsLoading;

  return (
    <Modal
      open={opened}
      onClose={cancel}
      fullscreen
      contentClassName="wiz-box"
    >
      <div className="wiz-head">
        <div>
          <p className="wiz-eyebrow">
            Cantos e Contos
          </p>

          <p className="wiz-title">
            Criar Personagem
          </p>
        </div>

        <IconButton
          icon="✕"
          onClick={cancel}
        />
      </div>

      <div className="wiz-divider" />

      {error ? (
        <ErrorBanner
          message={error}
          onDismiss={() => setError(null)}
        />
      ) : null}

      {anyLoading ? (
        <p className="wiz-empty">
          Carregando...
        </p>
      ) : null}

      {!anyLoading && step === 'species' ? (
        <>
          <p className="wiz-sub">
            Escolha a Espécie do personagem.
          </p>

          <div className="wiz-grid">
            {speciesList.map((item) => (
              <button
                type="button"
                key={item.id}
                className="wiz-opt"
                onClick={() => pickSpecies(item)}
              >
                <span className="wiz-opt-badge">
                  <Info />
                </span>

                <span className="wiz-opt-txt">
                  <span>
                    {item.name}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </>
      ) : null}

      {!anyLoading && step === 'class' ? (
        <>
          <p className="wiz-sub">
            Escolha a Classe do personagem.
          </p>

          <div className="wiz-grid">
            {classesList.map((item) => (
              <button
                type="button"
                key={item.id}
                className="wiz-opt"
                onClick={() => pickClass(item)}
              >
                <span className="wiz-opt-txt">
                  <span>
                    {item.name}
                  </span>

                  <span className="wiz-opt-sub">
                    {`Vida: ${item.hp_base}${item.mana_base > 0 ? ` · Mana: ${item.mana_base}` : ''}`}
                  </span>
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            className="wiz-back"
            onClick={() => setStep('species')}
          >
            Voltar
          </button>
        </>
      ) : null}

      {!anyLoading && step === 'classChoices' && selectedClass ? (
        <>
          <p className="wiz-sub2">
            {`Escolhas de ${selectedClass.name}`}
          </p>

          {selectedClass.skill_proficiency_choice ? (
            <>
              <p className="wiz-label">
                {`Perícias — escolha ${selectedClass.skill_proficiency_choice.count}`}
              </p>

              <div className="wiz-pill-list">
                {selectedClass.skill_proficiency_choice.options.map((option) => (
                  <button
                    type="button"
                    key={option}
                    className={`wiz-pill ${skillChoices.includes(option) ? 'checked' : ''}`}
                    onClick={() => toggleSkillChoice(option)}
                  >
                    <Check weight="bold" />

                    {option}
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {selectedClass.equipment_choice ? (
            <>
              <p className="wiz-label">
                Equipamento inicial
              </p>

              <div className="wiz-radio-cards">
                {selectedClass.equipment_choice.options.map((option) => (
                  <button
                    type="button"
                    key={option.label}
                    className={`wiz-radio-card ${equipmentLabel === option.label ? 'checked' : ''}`}
                    onClick={() => setEquipmentLabel(option.label)}
                  >
                    <span className="wiz-radio-dot" />

                    {`${option.label}: ${option.description}`}
                  </button>
                ))}
              </div>
            </>
          ) : null}

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              className="wiz-back"
              onClick={() => setStep('class')}
            >
              Voltar
            </button>

            <Button
              variant="primary"
              className="wiz-continue"
              style={{ marginLeft: 'auto' }}
              disabled={!classChoicesValid()}
              onClick={() => setStep('origin')}
            >
              Continuar

              <ArrowRight weight="bold" />
            </Button>
          </div>
        </>
      ) : null}

      {!anyLoading && step === 'origin' && !selectedOrigin ? (
        <>
          <p className="wiz-sub">
            Escolha a Origem do personagem.
          </p>

          <div className="wiz-grid">
            {originsList.map((item) => (
              <button
                type="button"
                key={item.id}
                className="wiz-opt"
                onClick={() => pickOrigin(item)}
              >
                <span className="wiz-opt-txt">
                  <span>
                    {item.name}
                  </span>
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            className="wiz-back"
            onClick={() => setStep(selectedClass && classHasChoices(selectedClass) ? 'classChoices' : 'class')}
          >
            Voltar
          </button>
        </>
      ) : null}

      {!anyLoading && step === 'origin' && selectedOrigin ? (
        <>
          <p className="wiz-sub2">
            {selectedOrigin.name}
          </p>

          <p className="wiz-label">
            Bônus de atributo
          </p>

          <div className="wiz-radio-cards">
            {selectedOrigin.attribute_bonus_options.map((option, index) => (
              <button
                type="button"
                key={index}
                className={`wiz-radio-card ${originBonusIndex === index ? 'checked' : ''}`}
                onClick={() => setOriginBonusIndex(index)}
              >
                <span className="wiz-radio-dot" />

                {option.map((bonus) => `+${bonus.amount} ${ATTRIBUTE_LABEL[bonus.attribute as keyof typeof ATTRIBUTE_LABEL]}`).join(', ')}
              </button>
            ))}
          </div>

          {selectedOrigin.proficiency_choice ? (
            <>
              <p className="wiz-label">
                Perícia
              </p>

              <div className="wiz-radio-cards">
                {selectedOrigin.proficiency_choice.options.map((option) => (
                  <button
                    type="button"
                    key={option}
                    className={`wiz-radio-card ${originProficiency === option ? 'checked' : ''}`}
                    onClick={() => setOriginProficiency(option)}
                  >
                    <span className="wiz-radio-dot" />

                    {option}
                  </button>
                ))}
              </div>
            </>
          ) : null}

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              className="wiz-back"
              onClick={() => setOriginId(null)}
            >
              Voltar
            </button>

            <Button
              variant="primary"
              className="wiz-continue"
              style={{ marginLeft: 'auto' }}
              disabled={!originValid()}
              onClick={() => setStep('review')}
            >
              Continuar

              <ArrowRight weight="bold" />
            </Button>
          </div>
        </>
      ) : null}

      {!anyLoading && step === 'review' && selectedClass && selectedSpecies && selectedOrigin && finalAttributes ? (
        <>
          <p className="wiz-breadcrumb">
            {`${selectedSpecies.name} · ${selectedClass.name} · ${selectedOrigin.name}`}
          </p>

          <Field
            placeholder="Nome do personagem *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />

          <ImageUploadInput
            value={imageUrl}
            onChange={setImageUrl}
          />

          <div className="wiz-attr-summary">
            {ATTRIBUTE_ORDER.map((attribute) => (
              <div
                key={attribute}
                className="wiz-attr-cell"
              >
                <span className="wiz-attr-lbl">
                  {ATTRIBUTE_LABEL[attribute]}
                </span>

                <span className="wiz-attr-val">
                  {finalAttributes[attribute] >= 0 ? `+${finalAttributes[attribute]}` : finalAttributes[attribute]}
                </span>
              </div>
            ))}
          </div>

          <p className="wiz-label">
            Recursos da Classe
          </p>

          <div className="wiz-resource-grid">
            {selectedClass.extra_resources.map((resource) => (
              <div
                key={resource.label}
                className="wiz-resource-card"
              >
                <span className="wiz-resource-val">
                  {resource.value}
                </span>

                <span className="wiz-resource-lbl">
                  {resource.label}
                </span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              className="wiz-back"
              onClick={() => setStep('origin')}
            >
              Voltar
            </button>

            <Button
              variant="primary"
              className="wiz-continue"
              style={{ marginLeft: 'auto' }}
              disabled={!name.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              <Check weight="bold" />

              Criar Personagem
            </Button>
          </div>
        </>
      ) : null}
    </Modal>
  );
}
