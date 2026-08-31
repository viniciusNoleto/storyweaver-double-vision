'use client';

import { use, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Monitor, Plus, Trash } from '@phosphor-icons/react';
import Link from 'next/link';
import { useTableStream, UseTableStreamCharacterAction } from '@/resources/table/hooks/useTableStream';
import { TableBoard } from '@/resources/character/components/TableBoard';
import { CharacterCard, CharacterCardFx } from '@/resources/character/components/CharacterCard';
import { ActionModals, ActionModalKind } from '@/resources/character/components/ActionModals';
import { CharacterEditModal } from '@/resources/character/components/CharacterEditModal';
import { CreateCharacterModal } from '@/resources/character/components/CreateCharacterModal';
import { AddCharacterMenu } from '@/resources/character/components/AddCharacterMenu';
import { CharacterTemplatePicker } from '@/resources/character/components/CharacterTemplatePicker';
import { CreateNpcModal } from '@/resources/character/components/CreateNpcModal';
import { SaveCharacterTemplatePrompt, SaveCharacterTemplateCandidate } from '@/resources/character/components/SaveCharacterTemplatePrompt';
import { updateCharacterService } from '@/resources/character/services/updateCharacter';
import { deleteCharacterService } from '@/resources/character/services/deleteCharacter';
import { applyCharacterActionService } from '@/resources/character/services/applyCharacterAction';
import { createZoneService } from '@/resources/table/services/createZone';
import { deleteZoneService } from '@/resources/table/services/deleteZone';
import { GET_TABLE_KEY } from '@/resources/table/services/getTable';
import { ECharacterKind } from '@/resources/character/enums/CharacterKind';
import type { ICharacterMaster } from '@/resources/character/models/Character';
import { Button } from '@/components/vilgard/Button';
import { IconButton } from '@/components/vilgard/IconButton';
import { Modal } from '@/components/vilgard/Modal';
import { ErrorBanner } from '@/components/vilgard/ErrorBanner';

// Teto de divisões por Mesa (mesmo `MAX_ZONES_PER_TABLE` do backend, ver
// `app/api/tables/[code]/zones/route.ts`) — usado aqui só para esconder o
// botão "+" antes de deixar o Mestre clicar e receber um 422.
const MAX_ZONES_PER_TABLE = 6;

// Mapeia a ação recebida via SSE (`character-action`) para o tipo de fx do
// `CharacterCard` — cada ação tem sua própria animação (ver `app/globals.css`,
// bloco "fx de dano/cura/vida extra").
const ACTION_FX_TYPE: Record<UseTableStreamCharacterAction['action'], CharacterCardFx['type']> = {
  damage: 'damage',
  heal: 'heal',
  'extra-add': 'extra-add',
  'extra-remove': 'extra-remove',
  'mana-spend': 'mana-loss',
  'mana-restore': 'mana-gain',
};

export default function MestrePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const queryClient = useQueryClient();

  const [createCharacterOpen, setCreateCharacterOpen] = useState(false);
  const [npcModalOpen, setNpcModalOpen] = useState(false);
  const [pickerKind, setPickerKind] = useState<`${ECharacterKind}` | null>(null);
  const [saveCandidate, setSaveCandidate] = useState<SaveCharacterTemplateCandidate | null>(null);
  const [actionState, setActionState] = useState<{ kind: ActionModalKind; characterId: number | null }>({ kind: null, characterId: null });
  const [editCharacterId, setEditCharacterId] = useState<number | null>(null);
  const [fxByCharacter, setFxByCharacter] = useState<Record<number, CharacterCardFx>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingZoneId, setDeletingZoneId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Depois de criar um Personagem ou NPC (ambos formulários simples) do zero,
  // pergunta se quer salvar como molde reutilizável — não pergunta quando o
  // personagem veio de um molde já salvo (CharacterTemplatePicker), já que
  // nesse caso ele já está salvo.
  function afterCreatedNew(kind: `${ECharacterKind}`, character: ICharacterMaster) {
    setCreateCharacterOpen(false);
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

  // As animações de fx (`app/globals.css`, bloco "fx de dano/cura/vida
  // extra") duram no máximo .55s — sem isso, a classe `fx-*` fica presa no
  // card para sempre (o `CharacterCardFx` nunca é limpo do estado), o que
  // trava a respiração do anel de vida (`hpBreathe`)/pulso de quase-morte
  // (`dangerPulse`) permanentemente, já que a regra de fx continua vencendo
  // o empate de especificidade CSS mesmo depois da animação terminar. O
  // `token` evita limpar um fx mais novo caso duas ações cheguem em sequência
  // rápida para o mesmo personagem.
  function triggerCardFx(characterId: number, type: CharacterCardFx['type']) {
    const token = Math.random();

    setFxByCharacter((prev) => ({
      ...prev,
      [characterId]: { type, token },
    }));

    window.setTimeout(() => {
      setFxByCharacter((prev) => {
        if (prev[characterId]?.token !== token) return prev;

        const next = { ...prev };
        delete next[characterId];

        return next;
      });
    }, 700);
  }

  const { data, isError, refetch } = useTableStream(code, {
    onCharacterAction: (action: UseTableStreamCharacterAction) => {
      triggerCardFx(action.character_id, ACTION_FX_TYPE[action.action]);
    },
  });

  function handleMutationError(err: any, fallback: string) {
    setError(err?.data?.message?.['pt-br'] ?? fallback);
  }

  const moveMutation = useMutation({
    mutationFn: ({ id, zoneId }: { id: number; zoneId: number }) => updateCharacterService({ code, characterId: id, body: { zone_id: zoneId } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: GET_TABLE_KEY(code) }),
    onError: (err: any) => handleMutationError(err, 'Não foi possível mover o personagem.'),
  });

  const createZoneMutation = useMutation({
    mutationFn: () => createZoneService({ code }),
    onSuccess: () => refetch(),
    onError: (err: any) => handleMutationError(err, 'Não foi possível criar a divisão.'),
  });

  const deleteZoneMutation = useMutation({
    mutationFn: (zoneId: number) => deleteZoneService({ code, zoneId }),
    onSuccess: () => {
      setDeletingZoneId(null);

      return refetch();
    },
    onError: (err: any) => {
      handleMutationError(err, 'Não foi possível excluir a divisão.');
      setDeletingZoneId(null);
    },
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
  const zones = data.zones;
  const activeCharacter = characters.find((c) => c.id === actionState.characterId) ?? null;
  const editCharacter = characters.find((c) => c.id === editCharacterId) ?? null;
  const deletingZone = deletingZoneId !== null ? zones.find((zone) => zone.id === deletingZoneId) ?? null : null;

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
            onCreateNew={(kind) => (kind === ECharacterKind.NPC ? setNpcModalOpen(true) : setCreateCharacterOpen(true))}
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
        zones={zones}
        characters={characters}
        onDropCharacter={(id, zoneId) => moveMutation.mutate({ id, zoneId })}
        emptyZoneText="Nenhuma ficha aqui"
        renderZoneExtra={(zone) => (
          zones.length > 1 ? (
            <IconButton
              icon={<Trash weight="bold" />}
              onClick={() => setDeletingZoneId(zone.id)}
            />
          ) : null
        )}
        trailing={(
          zones.length < MAX_ZONES_PER_TABLE ? (
            <button
              type="button"
              className="zone-add-btn"
              onClick={() => createZoneMutation.mutate()}
              disabled={createZoneMutation.isPending}
            >
              <Plus weight="bold" />
              Nova divisão
            </button>
          ) : null
        )}
        renderCard={(character) => (
          <CharacterCard
            character={character}
            fx={fxByCharacter[character.id] ?? null}
            onManaClick={(value) => manaMutation.mutate({ id: character.id, value, currentMana: character.mana_current })}
            onOpenDano={() => setActionState({ kind: 'dano', characterId: character.id })}
            onOpenCura={() => setActionState({ kind: 'cura', characterId: character.id })}
            onOpenVidaExtra={() => setActionState({ kind: 'vida-extra', characterId: character.id })}
            onOpenMana={() => setActionState({ kind: 'mana', characterId: character.id })}
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

      <Modal
        open={!!deletingZone}
        onClose={() => setDeletingZoneId(null)}
        fullscreen
      >
        <p className="card-modal-title">
          <Trash weight="bold" />
          Excluir divisão?
        </p>

        <p>
          Tem certeza? As fichas dela serão movidas para a divisão vizinha.
        </p>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button
            variant="ghost"
            onClick={() => setDeletingZoneId(null)}
            disabled={deleteZoneMutation.isPending}
          >
            Cancelar
          </Button>

          <Button
            variant="danger"
            onClick={() => deletingZoneId !== null && deleteZoneMutation.mutate(deletingZoneId)}
            disabled={deleteZoneMutation.isPending}
          >
            Excluir
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

      <CreateCharacterModal
        code={code}
        opened={createCharacterOpen}
        onCancel={() => setCreateCharacterOpen(false)}
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
