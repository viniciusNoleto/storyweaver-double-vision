'use client';

import { use, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MagnifyingGlassMinus, MagnifyingGlassPlus, Monitor, Trash } from '@phosphor-icons/react';
import Link from 'next/link';
import { useTableStream, UseTableStreamCharacterAction } from '@/resources/table/hooks/useTableStream';
import { TableBoard } from '@/resources/character/components/TableBoard';
import { CharacterCard, CharacterCardFx } from '@/resources/character/components/CharacterCard';
import { ActionModals, ActionModalKind } from '@/resources/character/components/ActionModals';
import { CharacterEditModal } from '@/resources/character/components/CharacterEditModal';
import { CharacterWizard } from '@/resources/character/components/CharacterWizard';
import { AddCharacterMenu } from '@/resources/character/components/AddCharacterMenu';
import { CharacterTemplatePicker } from '@/resources/character/components/CharacterTemplatePicker';
import { CreateNpcModal } from '@/resources/character/components/CreateNpcModal';
import { SaveCharacterTemplatePrompt, SaveCharacterTemplateCandidate } from '@/resources/character/components/SaveCharacterTemplatePrompt';
import { updateCharacterService } from '@/resources/character/services/updateCharacter';
import { deleteCharacterService } from '@/resources/character/services/deleteCharacter';
import { applyCharacterActionService } from '@/resources/character/services/applyCharacterAction';
import { getClassesService, GET_CLASSES_KEY } from '@/resources/character/services/getClasses';
import { GET_TABLE_KEY } from '@/resources/table/services/getTable';
import { ECharacterKind } from '@/resources/character/enums/CharacterKind';
import type { ICharacterMaster } from '@/resources/character/models/Character';
import { Button } from '@/components/vilgard/Button';
import { Modal } from '@/components/vilgard/Modal';
import { ErrorBanner } from '@/components/vilgard/ErrorBanner';

export default function MestrePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const queryClient = useQueryClient();

  const { data: classesData } = useQuery({ queryKey: GET_CLASSES_KEY, queryFn: getClassesService });
  const classesById = new Map((classesData?.data ?? []).map((item) => [item.id, item]));

  const [cardScale, setCardScale] = useState(1);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [npcModalOpen, setNpcModalOpen] = useState(false);
  const [pickerKind, setPickerKind] = useState<`${ECharacterKind}` | null>(null);
  const [saveCandidate, setSaveCandidate] = useState<SaveCharacterTemplateCandidate | null>(null);
  const [actionState, setActionState] = useState<{ kind: ActionModalKind; characterId: number | null }>({ kind: null, characterId: null });
  const [editCharacterId, setEditCharacterId] = useState<number | null>(null);
  const [fxByCharacter, setFxByCharacter] = useState<Record<number, CharacterCardFx>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Depois de criar um Personagem (wizard) ou NPC (form simples) do zero,
  // pergunta se quer salvar como molde reutilizável — não pergunta quando o
  // personagem veio de um molde já salvo (CharacterTemplatePicker), já que
  // nesse caso ele já está salvo.
  function afterCreatedNew(kind: `${ECharacterKind}`, character: ICharacterMaster) {
    setWizardOpen(false);
    setNpcModalOpen(false);
    setSaveCandidate({
      kind,
      name: character.name,
      image_url: character.image_url,
      hp_max: character.hp_max,
      has_mana: character.has_mana,
      mana_max: character.mana_max,
    });
  }

  const { data, isError, refetch } = useTableStream(code, {
    onCharacterAction: (action: UseTableStreamCharacterAction) => {
      setFxByCharacter((prev) => ({
        ...prev,
        [action.character_id]: {
          type: action.action === 'damage' ? 'damage' : action.action === 'heal' ? 'heal' : action.action === 'mana-spend' ? 'mana-loss' : 'mana-gain',
          token: Math.random(),
        },
      }));
    },
  });

  function handleMutationError(err: any, fallback: string) {
    setError(err?.data?.message?.['pt-br'] ?? fallback);
  }

  const moveMutation = useMutation({
    mutationFn: ({ id, x, y }: { id: number; x: number; y: number }) => updateCharacterService({ code, characterId: id, body: { position_x: x, position_y: y } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: GET_TABLE_KEY(code) }),
    onError: (err: any) => handleMutationError(err, 'Não foi possível mover o personagem.'),
  });

  const manaMutation = useMutation({
    mutationFn: ({ id, value, currentMana }: { id: number; value: number; currentMana: number }) => {
      const delta = value - currentMana;

      return applyCharacterActionService({ code, characterId: id, body: { type: delta > 0 ? 'mana-restore' : 'mana-spend', amount: Math.abs(delta) } });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: GET_TABLE_KEY(code) }),
    onError: (err: any) => handleMutationError(err, 'Não foi possível atualizar a mana.'),
  });

  const visibleMutation = useMutation({
    mutationFn: ({ id, visible }: { id: number; visible: boolean }) => updateCharacterService({ code, characterId: id, body: { visible } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: GET_TABLE_KEY(code) }),
    onError: (err: any) => handleMutationError(err, 'Não foi possível atualizar a visibilidade.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCharacterService({ code, characterId: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GET_TABLE_KEY(code) });
      setConfirmDeleteId(null);
    },
    onError: (err: any) => {
      handleMutationError(err, 'Não foi possível remover o personagem.');
      setConfirmDeleteId(null);
    },
  });

  if (isError) {
    return (
      <div className="table-bg">
        <p
          style={{ padding: 40, textAlign: 'center' }}
        >
          Não foi possível carregar esta mesa. Verifique o código e tente novamente.
        </p>
      </div>
    );
  }

  if (!data) return null;

  // App de uso pessoal — qualquer um com o link pode gerenciar a mesa, de
  // qualquer navegador/dispositivo. Sem gate de "só o Mestre" aqui.
  const characters = data.characters as ICharacterMaster[];
  const activeCharacter = characters.find((c) => c.id === actionState.characterId) ?? null;
  const editCharacter = characters.find((c) => c.id === editCharacterId) ?? null;

  return (
    <div className="table-bg">
      <header className="topbar">
        <Link
          href="/mesas"
          className="icon-btn"
        >
          <ArrowLeft weight="bold" />
        </Link>

        <span
          className="table-title-input"
          style={{ flex: 1 }}
        >
          {data.table.name ?? 'Mesa sem nome'}
        </span>

        <div
          style={{ display: 'flex', gap: 10 }}
        >
          <div className="card-zoom">
            <MagnifyingGlassMinus size={14} />

            <input
              className="zoom-slider"
              type="range"
              min={55}
              max={115}
              step={5}
              value={Math.round(cardScale * 100)}
              onChange={(e) => setCardScale(Number(e.target.value) / 100)}
            />

            <MagnifyingGlassPlus size={14} />

            <span className="card-zoom-pct">
              {Math.round(cardScale * 100)}%
            </span>
          </div>

          <a
            className="btn btn-ghost"
            href={`/mesa/${code}/exibicao`}
            target="_blank"
            rel="noreferrer"
          >
            <Monitor weight="bold" />
            Abrir telão
          </a>

          <AddCharacterMenu
            onCreateNew={(kind) => (kind === ECharacterKind.NPC ? setNpcModalOpen(true) : setWizardOpen(true))}
            onUseSaved={(kind) => setPickerKind(kind)}
          />
        </div>
      </header>

      {error ? (
        <ErrorBanner
          message={error}
          onDismiss={() => setError(null)}
        />
      ) : null}

      <TableBoard
        characters={characters}
        cardScale={cardScale}
        onMove={(id, x, y) => moveMutation.mutate({ id, x, y })}
        renderCard={(character) => (
          <CharacterCard
            character={character}
            fx={fxByCharacter[character.id] ?? null}
            classResources={character.class_id ? classesById.get(character.class_id)?.extra_resources : undefined}
            onManaClick={(value) => manaMutation.mutate({ id: character.id, value, currentMana: character.mana_current })}
            onOpenDano={() => setActionState({ kind: 'dano', characterId: character.id })}
            onOpenCura={() => setActionState({ kind: 'cura', characterId: character.id })}
            onOpenVidaExtra={() => setActionState({ kind: 'vida-extra', characterId: character.id })}
            onOpenEstado={() => setActionState({ kind: 'estado', characterId: character.id })}
            onOpenEdit={() => setEditCharacterId(character.id)}
            onToggleVisible={() => visibleMutation.mutate({ id: character.id, visible: !character.visible })}
            onRemove={() => setConfirmDeleteId(character.id)}
          />
        )}
      />

      <Modal
        open={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        fullscreen
      >
        <p className="card-modal-title">
          <Trash weight="bold" />
          Remover personagem?
        </p>

        <p>
          Tem certeza? Esta ação não pode ser desfeita.
        </p>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button
            variant="ghost"
            onClick={() => setConfirmDeleteId(null)}
            disabled={deleteMutation.isPending}
          >
            Cancelar
          </Button>

          <Button
            variant="danger"
            onClick={() => confirmDeleteId !== null && deleteMutation.mutate(confirmDeleteId)}
            disabled={deleteMutation.isPending}
          >
            Remover
          </Button>
        </div>
      </Modal>

      <ActionModals
        code={code}
        character={activeCharacter}
        open={actionState.kind}
        onClose={() => setActionState({ kind: null, characterId: null })}
        onApplied={() => refetch()}
      />

      <CharacterEditModal
        code={code}
        open={!!editCharacter}
        character={editCharacter}
        onClose={() => setEditCharacterId(null)}
      />

      <CharacterWizard
        code={code}
        opened={wizardOpen}
        onCancel={() => setWizardOpen(false)}
        onCreated={(character) => afterCreatedNew(ECharacterKind.CHARACTER, character)}
      />

      <CreateNpcModal
        code={code}
        opened={npcModalOpen}
        onCancel={() => setNpcModalOpen(false)}
        onCreated={(character) => afterCreatedNew(ECharacterKind.NPC, character)}
      />

      <CharacterTemplatePicker
        code={code}
        kind={pickerKind ?? ECharacterKind.CHARACTER}
        opened={pickerKind !== null}
        onCancel={() => setPickerKind(null)}
        onCreated={() => setPickerKind(null)}
      />

      <SaveCharacterTemplatePrompt
        candidate={saveCandidate}
        onDone={() => setSaveCandidate(null)}
      />
    </div>
  );
}
