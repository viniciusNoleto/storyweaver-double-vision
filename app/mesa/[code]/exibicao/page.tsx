'use client';

import { use, useRef, useState } from 'react';
import { useTableStream, UseTableStreamCharacterAction } from '@/resources/table/hooks/useTableStream';
import { TableBoard } from '@/resources/character/components/TableBoard';
import { DisplayToken, DisplayTokenActiveEffect } from '@/resources/character/components/DisplayToken';
import type { ICharacterDisplay } from '@/resources/character/models/Character';
import type { ITableZone } from '@/resources/table/models/TableZone';

// Duração da animação temporária no token (ver `DisplayToken.tsx`) — o
// `setTimeout` que limpa o efeito precisa ser um pouco maior que a duração
// real da animação (0.5s dano / 0.75s cura) para não cortar o "fade out" no
// meio.
const ACTIVE_EFFECT_DURATION_MS = 900;

interface TableDisplayPageProps {
  params: Promise<{ code: string }>;
}

// Tela de Exibição — `/mesa/[code]/exibicao`. Pública, sem login, sem cookie
// necessário; feita para ficar aberta num telão/TV durante a sessão. Só
// leitura: usa `TableBoard` sem `onDropCharacter`/`renderZoneExtra`/`trailing`
// (drag e gerenciamento de divisão são exclusivos da Tela do Mestre — a
// ausência dessas props já faz o board não desenhar nenhum botão de gestão e
// não escutar nenhum evento de drag). O servidor (`GET /api/tables/[code]`)
// já filtrou os personagens `visible: false` e já redigiu
// hp_current/hp_max/stats antes de responder — este componente só consome
// `ICharacterDisplay[]`, formato que nem possui esses campos (ver
// `.claude/rules/table-concept.md` seções 2 e 3).
//
// `forceDisplay: true` garante a visão redigida mesmo se este navegador tiver
// um cookie de Mestre válido (ex.: o próprio Mestre abrindo este link no
// mesmo navegador onde já autenticou) — nunca confie só na rota para decidir
// privacidade.
//
// Etapa 8 — animação de dano/cura em tempo real: `onCharacterAction` do
// `useTableStream` entrega `{ character_id, action, amount, hp_current,
// hp_max, mana_current, mana_max }` (ver `UseTableStreamCharacterAction`),
// mas esta página só lê `character_id` e `action` — `amount`/`hp_current`/
// `hp_max` NUNCA são lidos/renderizados/logados aqui, pois violariam a regra
// absoluta de "nenhum número de jogo na Exibição" (table-concept.md seção 2).
// O estado local `activeEffects` guarda, por personagem, qual efeito visual
// (shake/flash do `DisplayToken`) está tocando agora; cada evento gera uma
// `key` nova (mesmo se a `action` se repetir) para o `DisplayToken` sempre
// reiniciar a animação do zero, e um `setTimeout` limpa a entrada depois da
// duração da animação.
//
// Fundação de mana: ações `'mana-spend'`/`'mana-restore'` NÃO disparam esse
// efeito de shake/flash (que é exclusivo de `'damage'`/`'heal'`, ver
// `DisplayTokenActiveEffect`) — a animação de "cristal se estilhaçando/
// brilhando" já acontece sozinha dentro de `ManaCrystals`, comparando
// `mana_current` do snapshot anterior com o novo a cada refetch (disparado
// pelo `refetch()` que o próprio `useTableStream` já chama antes de invocar
// este callback). Nada a fazer aqui além de ignorar essas duas ações.
export default function TableDisplayPage({ params }: TableDisplayPageProps) {
  const { code } = use(params);

  const [activeEffects, setActiveEffects] = useState<Record<number, DisplayTokenActiveEffect>>({});
  const effectKeyRef = useRef(0);

  function handleCharacterAction(action: UseTableStreamCharacterAction) {
    if (action.action !== 'damage' && action.action !== 'heal') return;

    // Narrowing acima não sobrevive dentro dos closures de `setActiveEffects`
    // abaixo (control-flow narrowing não atravessa fronteira de função) —
    // capturado numa const local só para o TypeScript propagar o tipo
    // estreito ('damage' | 'heal') para dentro deles.
    const effectAction = action.action;
    const effectKey = ++effectKeyRef.current;

    setActiveEffects((prev) => ({
      ...prev,
      [action.character_id]: { action: effectAction, key: effectKey },
    }));

    setTimeout(() => {
      setActiveEffects((prev) => {
        if (prev[action.character_id]?.key !== effectKey) return prev;

        const next = { ...prev };

        delete next[action.character_id];

        return next;
      });
    }, ACTIVE_EFFECT_DURATION_MS);
  }

  const { data, isLoading, isError } = useTableStream(code, {
    forceDisplay: true,
    onCharacterAction: handleCharacterAction,
  });

  if (isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center bg-vilgard px-6 py-16">
        <p className="text-lg text-parchment/60">
          Carregando mesa...
        </p>
      </main>
    );
  }

  if (isError || !data) {
    return (
      <main className="flex flex-1 items-center justify-center bg-vilgard px-6 py-16">
        <p className="text-lg text-secondary-400">
          Não foi possível carregar esta mesa.
        </p>
      </main>
    );
  }

  const zones = data.zones as ITableZone[];
  const characters = data.characters as ICharacterDisplay[];

  return (
    <main className="flex flex-1 flex-col bg-vilgard px-4 py-4">
      <h1 className="mb-4 text-center text-4xl font-semibold uppercase tracking-[0.1em] text-gold sm:text-5xl [text-shadow:0_0_24px_rgba(201,168,76,0.4)]">
        {data.table.name ?? `Mesa ${data.table.code}`}
      </h1>

      <div className="relative flex flex-1 overflow-hidden rounded-lg border-2 border-gold/30 bg-board shadow-[inset_0_0_60px_rgba(0,0,0,0.55)]">
        <TableBoard<ITableZone, ICharacterDisplay>
          zones={zones}
          characters={characters}
          renderToken={(character) => (
            <DisplayToken
              character={character}
              activeEffect={activeEffects[character.id] ?? null}
            />
          )}
          className="w-full"
        />
      </div>
    </main>
  );
}
