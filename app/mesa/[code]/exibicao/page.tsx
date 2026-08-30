'use client';

import { use } from 'react';
import { ArrowLeft } from '@phosphor-icons/react';
import Link from 'next/link';
import { useTableStream } from '@/resources/table/hooks/useTableStream';
import { DisplayCard } from '@/resources/character/components/DisplayCard';
import type { ICharacterDisplay } from '@/resources/character/models/Character';

// Tela de Exibição — telão/TV público, só leitura. Consome
// `useTableStream(code, { forceDisplay: true })`, que sempre devolve
// `ICharacterDisplay[]` (nunca `ICharacterMaster[]`) — o servidor já removeu
// hp_current/hp_max/extra_hp/attributes/class_id/species_id/origin_id antes de
// responder. Ver `.claude/rules/table-concept.md` seção 2/3.
export default function ExibicaoPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);

  const { data } = useTableStream(code, { forceDisplay: true });

  if (!data) return null;

  const characters = data.characters as ICharacterDisplay[];

  return (
    <div className="display-body">
      <div className="display-glow" />

      <Link
        href="/mesas"
        className="icon-btn"
        style={{ position: 'absolute', top: 20, left: 24, zIndex: 2, fontSize: 20 }}
      >
        <ArrowLeft weight="bold" />
      </Link>

      <h1 className="display-title">
        {data.table.name ?? 'Mesa sem nome'}
      </h1>

      {characters.length > 0 ? (
        <div className="display-front-grid">
          {characters.map((character) => (
            <div key={character.id}>
              <DisplayCard character={character} />

              {character.status_effects.length > 0 ? (
                <div
                  className="display-chips"
                  style={{ marginTop: 10, justifyContent: 'center' }}
                >
                  {character.status_effects.map((effect) => (
                    <span
                      key={effect}
                      className="display-chip"
                    >
                      {effect}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-display">
          Aguardando a Esperança se erguer sobre Vilgard…
        </p>
      )}
    </div>
  );
}
