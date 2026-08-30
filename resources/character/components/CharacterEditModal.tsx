'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PencilSimple, Check, ArrowRight } from '@phosphor-icons/react';
import { Modal } from '@/components/vilgard/Modal';
import { Button } from '@/components/vilgard/Button';
import { Field, FieldSelect } from '@/components/vilgard/Field';
import { updateCharacterService } from '../services/updateCharacter';
import { getClassesService, GET_CLASSES_KEY } from '../services/getClasses';
import { getSpeciesService, GET_SPECIES_KEY } from '../services/getSpecies';
import { getOriginsService, GET_ORIGINS_KEY } from '../services/getOrigins';
import { GET_TABLE_KEY } from '@/resources/table/services/getTable';
import { ATTRIBUTE_ORDER, ATTRIBUTE_LABEL } from '../enums/Attribute';
import type { ICharacterMaster } from '../models/Character';
import type { ECharacterType } from '../enums/CharacterType';
import type { ICharacterAttributes } from '../models/RulesContent';

export function CharacterEditModal({
  code,
  open,
  character,
  onClose,
}: {
  code: string;
  open: boolean;
  character: ICharacterMaster | null;
  onClose: () => void;
}) {
  const [page, setPage] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState('');
  const [type, setType] = useState<`${ECharacterType}`>('PC');
  const [hpMax, setHpMax] = useState(1);
  const [manaMax, setManaMax] = useState(0);
  const [attrs, setAttrs] = useState<Record<string, number>>({});

  const queryClient = useQueryClient();

  const { data: classesData } = useQuery({ queryKey: GET_CLASSES_KEY, queryFn: getClassesService, enabled: open });
  const { data: speciesData } = useQuery({ queryKey: GET_SPECIES_KEY, queryFn: getSpeciesService, enabled: open });
  const { data: originsData } = useQuery({ queryKey: GET_ORIGINS_KEY, queryFn: getOriginsService, enabled: open });

  useEffect(() => {
    if (character) {
      setPage(1);
      setName(character.name);
      setType(character.type);
      setHpMax(character.hp_max);
      setManaMax(character.mana_max);
      setAttrs(character.attributes ?? {});
    }
  }, [character]);

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!character) return Promise.reject(new Error('sem personagem'));

      return updateCharacterService({
        code,
        characterId: character.id,
        body: { name, type, hp_max: hpMax, mana_max: manaMax, attributes: attrs as ICharacterAttributes },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GET_TABLE_KEY(code) });
      onClose();
    },
  });

  if (!character) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      fullscreen
      wide
    >
      <p className="card-modal-title">
        <PencilSimple weight="bold" />
        {`Editar ${character.name}`}
      </p>

      <div className="edit-page-dots">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={`edit-page-dot ${page === n ? 'active' : ''}`}
          />
        ))}
      </div>

      {page === 1 ? (
        <>
          <span className="edit-section-label">
            Identidade
          </span>

          <label className="edit-lbl">
            Nome
            <Field
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="edit-lbl">
            Tipo
            <FieldSelect
              value={type}
              onChange={(e) => setType(e.target.value as `${ECharacterType}`)}
            >
              <option value="PC">
                Jogador (PC)
              </option>

              <option value="NPC">
                NPC
              </option>

              <option value="Monstro">
                Monstro
              </option>
            </FieldSelect>
          </label>

          <div style={{ display: 'flex', gap: 8 }}>
            <label
              className="edit-lbl"
              style={{ flex: 1 }}
            >
              Vida máx.
              <Field
                type="number"
                min={1}
                value={hpMax}
                onChange={(e) => setHpMax(Number(e.target.value) || 1)}
              />
            </label>

            <label
              className="edit-lbl"
              style={{ flex: 1 }}
            >
              Mana máx.
              <Field
                type="number"
                min={0}
                value={manaMax}
                onChange={(e) => setManaMax(Number(e.target.value) || 0)}
              />
            </label>
          </div>

          <Button
            variant="primary"
            onClick={() => setPage(2)}
          >
            Próximo
            <ArrowRight weight="bold" />
          </Button>
        </>
      ) : null}

      {page === 2 ? (
        <>
          <span className="edit-section-label">
            Atributos
          </span>

          <div className="attr-edit-grid">
            {ATTRIBUTE_ORDER.map((attribute) => (
              <label
                key={attribute}
                className="edit-lbl attr-lbl"
              >
                {ATTRIBUTE_LABEL[attribute]}
                <Field
                  type="number"
                  value={attrs[attribute] ?? 0}
                  onChange={(e) => setAttrs({ ...attrs, [attribute]: Number(e.target.value) || 0 })}
                />
              </label>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="wiz-back"
              onClick={() => setPage(1)}
            >
              Anterior
            </button>

            <Button
              variant="primary"
              onClick={() => setPage(3)}
              style={{ marginLeft: 'auto' }}
            >
              Próximo
              <ArrowRight weight="bold" />
            </Button>
          </div>
        </>
      ) : null}

      {page === 3 ? (
        <>
          <span className="edit-section-label">
            Resumo
          </span>

          <p className="wiz-resource-line">
            {`Espécie: ${speciesData?.data.find((s) => s.id === character.species_id)?.name ?? '—'}`}
          </p>

          <p className="wiz-resource-line">
            {`Classe: ${classesData?.data.find((c) => c.id === character.class_id)?.name ?? '—'}`}
          </p>

          <p className="wiz-resource-line">
            {`Origem: ${originsData?.data.find((o) => o.id === character.origin_id)?.name ?? '—'}`}
          </p>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="wiz-back"
              onClick={() => setPage(2)}
            >
              Anterior
            </button>

            <Button
              variant="primary"
              onClick={() => saveMutation.mutate()}
              style={{ marginLeft: 'auto' }}
            >
              <Check weight="bold" />
              Concluir
            </Button>
          </div>
        </>
      ) : null}
    </Modal>
  );
}
