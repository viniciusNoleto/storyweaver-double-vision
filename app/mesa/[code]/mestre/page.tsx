'use client';

import { use, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { ActionIcon, Button, Group, Loader, Modal, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Icon } from '@iconify/react';
import { useTableStream, UseTableStreamCharacterAction } from '@/resources/table/hooks/useTableStream';
import { authenticateMasterService } from '@/resources/table/services/authenticateMaster';
import { createZoneService } from '@/resources/table/services/createZone';
import { deleteZoneService } from '@/resources/table/services/deleteZone';
import { updateCharacterService } from '@/resources/character/services/updateCharacter';
import { TableBoard } from '@/resources/character/components/TableBoard';
import { MasterToken, MasterTokenPulse } from '@/resources/character/components/MasterToken';
import { CharacterActionsPanel, useApplyCharacterActionLogicData } from '@/resources/character/components/CharacterActionsPanel';
import { characterToFormState } from '@/resources/character/components/CharacterEditPanel';
import { useCreateCharacterLogicData, CreateCharacterLogicComponent } from '@/resources/character/logics/CreateCharacter';
import { useCreateNpcLogicData, CreateNpcLogicComponent } from '@/resources/character/logics/CreateNpc';
import { useUpdateCharacterLogicData, UpdateCharacterLogicComponent } from '@/resources/character/logics/UpdateCharacter';
import { useDeleteCharacterLogicData, DeleteCharacterLogicComponent } from '@/resources/character/logics/DeleteCharacter';
import type { ICharacterMaster } from '@/resources/character/models/Character';

// Máximo de divisões por Mesa (mesmo teto de `MAX_ZONES_PER_TABLE` no
// backend, ver `app/api/tables/[code]/zones/route.ts`) — usado aqui só para
// decidir se mostra o botão "+" (melhor UX que deixar clicar e receber 422).
const MAX_ZONES_PER_TABLE = 6;

// Duração da animação de pulso de dano/cura sobre o token (ver
// `MasterToken.tsx`) — o estado transitório é limpo depois desse tempo.
const PULSE_DURATION_MS = 1200;

// Tela do Mestre (`.claude/rules/table-concept.md` seções 2/3): números reais,
// tabuleiro em divisões arrastável, criação/edição/remoção de personagens,
// ações rápidas de dano/cura com animação. Não implementa formulário de
// digitar a `master_key` manualmente — sem `?key=` válida na URL e sem cookie
// de Mestre já setado, mostra tela de acesso negado (fora de escopo desta
// etapa reinventar esse fluxo).
export default function MestrePage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ key?: string }>;
}) {
  const { code } = use(params);
  const { key } = use(searchParams);

  const router = useRouter();
  const pathname = usePathname();

  const [pulses, setPulses] = useState<Record<number, MasterTokenPulse>>({});
  const pulseNonceRef = useRef(0);

  function handleCharacterAction(action: UseTableStreamCharacterAction) {
    const nonce = ++pulseNonceRef.current;

    setPulses((prev) => ({
      ...prev,
      [action.character_id]: { type: action.action, amount: action.amount, nonce },
    }));

    setTimeout(() => {
      setPulses((prev) => {
        if (prev[action.character_id]?.nonce !== nonce) return prev; // já foi substituído por um evento mais novo

        const next = { ...prev };

        delete next[action.character_id];

        return next;
      });
    }, PULSE_DURATION_MS);
  }

  const { data, isLoading, isError, refetch } = useTableStream(code, { onCharacterAction: handleCharacterAction });

  const [authenticating, setAuthenticating] = useState(!!key);

  useEffect(() => {
    if (!key) return;

    authenticateMasterService({ code, body: { key } })
      .then(() => {
        router.replace(pathname);

        return refetch();
      })
      .catch((err: any) => {
        notifications.show({
          title: 'Erro',
          message: err?.data?.message?.['pt-br'] ?? 'Não foi possível autenticar como Mestre desta mesa.',
          color: 'red',
        });
      })
      .finally(() => setAuthenticating(false));
    // Só deve rodar uma vez, na chegada com `?key=` — `code`/`router`/`pathname`/`refetch`
    // não devem re-disparar a autenticação.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [creating, setCreating] = useState(false);
  const [creatingNpc, setCreatingNpc] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<ICharacterMaster | null>(null);
  const [deletingCharacter, setDeletingCharacter] = useState<ICharacterMaster | null>(null);
  const [actionsCharacterId, setActionsCharacterId] = useState<number | null>(null);
  const [deletingZoneId, setDeletingZoneId] = useState<number | null>(null);

  const createCharacterLogicData = useCreateCharacterLogicData({
    code,
    onSuccess: () => {
      createCharacterLogicData.createCharacterReset();
      setCreating(false);
    },
  });

  const createNpcLogicData = useCreateNpcLogicData({
    code,
    onSuccess: () => {
      createNpcLogicData.createNpcReset();
      setCreatingNpc(false);
    },
  });

  const updateCharacterLogicData = useUpdateCharacterLogicData({
    code,
    editingCharacterId: editingCharacter?.id ?? null,
    onSuccess: () => setEditingCharacter(null),
  });

  const deleteCharacterLogicData = useDeleteCharacterLogicData({
    code,
    characterId: deletingCharacter?.id ?? -1,
    onSuccess: () => {
      setDeletingCharacter(null);
      setEditingCharacter(null);
    },
  });

  const applyCharacterActionLogicData = useApplyCharacterActionLogicData({
    code,
    characterId: actionsCharacterId,
  });

  const moveCharacterMutation = useMutation({
    mutationFn: ({ id, zone_id }: { id: number; zone_id: number }) => updateCharacterService({
      code,
      characterId: id,
      body: { zone_id },
    }),
    onError: (err: any) => {
      notifications.show({
        title: 'Erro',
        message: err?.data?.message?.['pt-br'] ?? 'Não foi possível mover o personagem.',
        color: 'red',
      });
    },
  });

  const createZoneMutation = useMutation({
    mutationFn: () => createZoneService({ code }),
    onSuccess: () => refetch(),
    onError: (err: any) => {
      notifications.show({
        title: 'Erro',
        message: err?.data?.message?.['pt-br'] ?? 'Não foi possível criar a divisão.',
        color: 'red',
      });
    },
  });

  const deleteZoneMutation = useMutation({
    mutationFn: (zoneId: number) => deleteZoneService({ code, zoneId }),
    onSuccess: () => {
      setDeletingZoneId(null);

      return refetch();
    },
    onError: (err: any) => {
      notifications.show({
        title: 'Erro',
        message: err?.data?.message?.['pt-br'] ?? 'Não foi possível excluir a divisão.',
        color: 'red',
      });
    },
  });

  function openCreate() {
    createCharacterLogicData.createCharacterReset();
    setCreating(true);
  }

  function openCreateNpc() {
    createNpcLogicData.createNpcReset();
    setCreatingNpc(true);
  }

  function openEdit(character: ICharacterMaster) {
    updateCharacterLogicData.setUpdateCharacterState(characterToFormState(character));
    setEditingCharacter(character);
  }

  function openDeleteFromEdit() {
    setDeletingCharacter(editingCharacter);
  }

  function openEditFromActions() {
    if (!actionsCharacter) return;

    openEdit(actionsCharacter);
    setActionsCharacterId(null);
  }

  if (authenticating || isLoading) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16">
        <Loader color="primary" />

        <Text
          size="sm"
          className="text-parchment/60"
        >
          Carregando mesa...
        </Text>
      </main>
    );
  }

  if (isError || !data) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center">
        <Text
          size="xl"
          fw={700}
          c="primary.5"
          className="font-display uppercase tracking-[0.06em]"
        >
          Mesa não encontrada
        </Text>

        <Text
          size="sm"
          className="text-parchment/60"
        >
          {`Verifique se o código "${code}" está correto.`}
        </Text>
      </main>
    );
  }

  if (!data.you.is_master) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center">
        <Icon
          icon="lucide:shield-alert"
          width={40}
          height={40}
          className="text-secondary-400"
        />

        <Text
          size="xl"
          fw={700}
          c="primary.5"
          className="font-display uppercase tracking-[0.06em]"
        >
          Acesso negado
        </Text>

        <Text
          size="sm"
          className="text-parchment/60"
        >
          Você não está autenticado como Mestre desta mesa. Use o link do Mestre que foi gerado na criação da mesa.
        </Text>
      </main>
    );
  }

  const characters = data.characters as ICharacterMaster[];
  const zones = data.zones;
  const actionsCharacter = actionsCharacterId !== null
    ? characters.find((character) => character.id === actionsCharacterId) ?? null
    : null;
  const deletingZone = deletingZoneId !== null ? zones.find((zone) => zone.id === deletingZoneId) ?? null : null;

  return (
    <main className="flex flex-1 flex-col h-screen">
      <header className="flex items-center justify-between gap-4 border-b-2 border-gold/25 bg-black/30 px-6 py-4 backdrop-blur-sm">
        <div>
          <Text
            size="xl"
            fw={700}
            c="primary.5"
            className="font-display tracking-wide"
          >
            {data.table.name || 'Mesa sem nome'}
          </Text>

          <Text
            size="md"
            className="font-accent text-parchment/50"
          >
            {`Código: ${data.table.code}`}
          </Text>
        </div>

        <Group gap="sm">
          <Button
            variant="outline"
            leftSection={(
              <Icon icon="lucide:ghost" />
            )}
            onClick={openCreateNpc}
            className="uppercase tracking-[0.06em]"
          >
            Novo NPC
          </Button>

          <Button
            leftSection={(
              <Icon icon="lucide:plus" />
            )}
            onClick={openCreate}
            className="uppercase tracking-[0.06em]"
          >
            Novo personagem
          </Button>
        </Group>
      </header>

      <div className="relative flex flex-1 bg-board p-3">
        <TableBoard
          zones={zones}
          characters={characters}
          renderToken={(character) => (
            <MasterToken
              character={character}
              onClick={() => setActionsCharacterId(character.id)}
              pulse={pulses[character.id] ?? null}
            />
          )}
          renderZoneExtra={(zone) => (
            zones.length > 1 ? (
              <ActionIcon
                variant="subtle"
                color="secondary"
                onClick={() => setDeletingZoneId(zone.id)}
              >
                <Icon
                  icon="lucide:trash-2"
                  width={16}
                  height={16}
                />
              </ActionIcon>
            ) : null
          )}
          trailing={(
            zones.length < MAX_ZONES_PER_TABLE ? (
              <button
                type="button"
                onClick={() => createZoneMutation.mutate()}
                disabled={createZoneMutation.isPending}
                className="flex h-full w-28 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary-400/40 bg-black/10 px-2 text-primary-300 transition hover:border-primary-300 hover:bg-black/20 disabled:opacity-50"
              >
                <Icon
                  icon="lucide:plus"
                  width={28}
                  height={28}
                />

                <Text
                  size="sm"
                  className="font-display uppercase tracking-wide text-center"
                >
                  Nova divisão
                </Text>
              </button>
            ) : null
          )}
          emptyZoneText="Nenhuma ficha aqui"
          onDropCharacter={(characterId, zoneId) => moveCharacterMutation.mutate({ id: characterId, zone_id: zoneId })}
          onDeleteCharacter={(characterId) => {
            const character = characters.find((item) => item.id === characterId);

            if (character) setDeletingCharacter(character);
          }}
          className="w-full"
        />
      </div>

      <CharacterActionsPanel
        logicData={applyCharacterActionLogicData}
        character={actionsCharacter}
        opened={!!actionsCharacter}
        onClose={() => setActionsCharacterId(null)}
        onEditFull={openEditFromActions}
      />

      <CreateCharacterLogicComponent
        logicData={createCharacterLogicData}
        opened={creating}
        onCancel={() => setCreating(false)}
      />

      <CreateNpcLogicComponent
        logicData={createNpcLogicData}
        opened={creatingNpc}
        onCancel={() => setCreatingNpc(false)}
      />

      <UpdateCharacterLogicComponent
        logicData={updateCharacterLogicData}
        opened={!!editingCharacter}
        onCancel={() => setEditingCharacter(null)}
        onDelete={openDeleteFromEdit}
      />

      {/* `DeleteCharacterLogicComponent` segue o Padrão 1 de `resources-logic.md`
          (ação de confirmação sem formulário) — não é dono do próprio modal,
          quem chama decide o container. */}
      <Modal
        opened={!!deletingCharacter}
        onClose={() => setDeletingCharacter(null)}
        title="Remover personagem"
        centered
      >
        <DeleteCharacterLogicComponent
          logicData={deleteCharacterLogicData}
          characterName={deletingCharacter?.name ?? ''}
          onCancel={() => setDeletingCharacter(null)}
        />
      </Modal>

      {/* Confirmação de exclusão de divisão — mesmo espírito visual do modal
          de remover personagem acima, mas não é um Logic de `resources/`
          (divisão não é um recurso de personagem, e a ação é simples demais
          para justificar hook próprio fora deste componente). */}
      <Modal
        opened={!!deletingZone}
        onClose={() => setDeletingZoneId(null)}
        title="Excluir divisão"
        centered
      >
        <div className="flex flex-col gap-4">
          <Text
            size="sm"
            c="dimmed"
          >
            Tem certeza que deseja excluir esta divisão? As fichas dela serão movidas para a divisão vizinha.
          </Text>

          <div className="flex justify-end gap-2">
            <Button
              variant="subtle"
              color="gray"
              onClick={() => setDeletingZoneId(null)}
              disabled={deleteZoneMutation.isPending}
            >
              Cancelar
            </Button>

            <Button
              color="secondary"
              loading={deleteZoneMutation.isPending}
              onClick={() => deletingZoneId !== null && deleteZoneMutation.mutate(deletingZoneId)}
            >
              Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
