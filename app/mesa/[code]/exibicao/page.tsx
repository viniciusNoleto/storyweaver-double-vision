'use client';

import { use, useState } from 'react';
import { ArrowLeft } from '@phosphor-icons/react';
import Link from 'next/link';
import { useTableStream, UseTableStreamCharacterAction } from '@/resources/table/hooks/useTableStream';
import { TableBoard } from '@/resources/character/components/TableBoard';
import { DisplayCard, DisplayCardFx } from '@/resources/character/components/DisplayCard';
import type { ICharacterDisplay } from '@/resources/character/models/Character';

// Mapeia a ação recebida via SSE (`character-action`) para o tipo de fx do
// `DisplayCard` — ações de mana não disparam fx aqui (ver `DisplayCardFx`).
const ACTION_FX_TYPE: Partial<Record<UseTableStreamCharacterAction['action'], DisplayCardFx['type']>> = {
  damage: 'damage',
  heal: 'heal',
  'extra-add': 'extra-add',
  'extra-remove': 'extra-remove',
};

// Tela de Exibição — telão/TV público, só leitura. Consome
// `useTableStream(code, { forceDisplay: true })`, que sempre devolve
// `ICharacterDisplay[]` (nunca `ICharacterMaster[]`) — o servidor já removeu
// hp_current/hp_max/extra_hp antes de responder. Ver
// `.claude/rules/table-concept.md` seção 2/3.
export default function ExibicaoPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [fxByCharacter, setFxByCharacter] = useState<Record<number, DisplayCardFx>>({});

  // Ver o comentário equivalente em `mestre/page.tsx` (`triggerCardFx`): sem
  // limpar o fx do estado depois que a animação termina (no máximo .55s), a
  // classe `fx-*` fica presa no card para sempre, travando a respiração do
  // anel de vida/pulso de quase-morte da carta permanentemente.
  function triggerCardFx(characterId: number, type: DisplayCardFx['type']) {
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

  const { data, isError } = useTableStream(code, {
    forceDisplay: true,
    onCharacterAction: (action) => {
      const type = ACTION_FX_TYPE[action.action];

      if (!type) return;

      triggerCardFx(action.character_id, type);
    },
  });

  if (isError) {
    return (
      <div className="display-body">
        <p className="empty-display">
          Não foi possível carregar esta mesa. Verifique o código e tente novamente.
        </p>
      </div>
    );
  }

  if (!data) return null;

  const characters = data.characters as ICharacterDisplay[];
  const zones = data.zones;

  return (
    <div className="display-body">
      <div className="display-glow" />

      <div className="display-header">
        <Link
          href="/mesas"
          className="icon-btn"
        >
          <ArrowLeft weight="bold" />
        </Link>

        <h1 className="display-title">
          {data.table.name ?? 'Mesa sem nome'}
        </h1>
      </div>

      {characters.length > 0 ? (
        <TableBoard
          zones={zones}
          characters={characters}
          emptyZoneText="Nenhuma ficha aqui"
          renderCard={(character) => (
            <DisplayCard
              character={character}
              fx={fxByCharacter[character.id] ?? null}
            />
          )}
          className="display-zone-board"
        />
      ) : (
        <p className="empty-display">
          Aguardando a Esperança se erguer sobre Vilgard…
        </p>
      )}
    </div>
  );
}
