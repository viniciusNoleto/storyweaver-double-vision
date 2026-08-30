'use client';

import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTableService, GET_TABLE_KEY, GetTableServiceResponse } from '../services/getTable';

// Peça compartilhada crítica — consumida pela Tela do Mestre e pela Tela de
// Exibição sem alteração nenhuma (ver `.claude/rules/table-concept.md` seção 4,
// "Fronteira de integração"). Abre a conexão SSE de
// `GET /api/tables/[code]/stream` e, a cada evento `state-changed`, refaz o
// fetch do snapshot (`GET /api/tables/[code]`, via TanStack Query).
//
// `data.you.is_master` deixa a UI decidir o que renderizar, mas o TIPO de
// `data.characters` já vem certo do backend (ICharacterMaster[] para o Mestre,
// ICharacterDisplay[] para a Exibição) — o servidor já filtrou os números, a
// UI nunca precisa "esconder" nada.
//
// `forceDisplay: true` (só a Tela de Exibição passa isso) manda `?view=display`
// para a API, que devolve o formato redigido MESMO que o navegador tenha um
// cookie de Mestre válido (ex.: o próprio Mestre abrindo o link de Exibição no
// mesmo navegador onde já autenticou). O parâmetro só pode pedir a visão MAIS
// restrita — nunca a mais ampla — então não enfraquece "nunca confiar no
// cliente" (ver `.claude/rules/table-concept.md` seção 3).
//
// `onCharacterAction` é opcional — quem quiser animar dano/cura em tempo real
// (Tela de Exibição, próxima etapa) passa esse callback; quem não passar
// nada mantém o comportamento de sempre (só refetch a cada `state-changed`).
// Payload narrado a propósito (ver `app/api/tables/[code]/characters/[id]/actions/route.ts`)
// — o canal `table:${code}` não exige autenticação para abrir, então nenhum
// número de jogo (hp/mana/extra_hp) é publicado nele; só o suficiente para
// disparar uma animação (`character_id`/`action`).
export type UseTableStreamCharacterAction = {
  character_id: number;
  action: 'damage' | 'heal' | 'mana-spend' | 'mana-restore' | 'extra-add' | 'extra-remove';
};

export function useTableStream(code: string, options?: { forceDisplay?: boolean; onCharacterAction?: (data: UseTableStreamCharacterAction) => void }) {
  const forceDisplay = options?.forceDisplay ?? false;

  const query = useQuery({
    queryKey: GET_TABLE_KEY(code, forceDisplay),
    queryFn: ({ signal }) => getTableService({ signal, code, forceDisplay }),
    enabled: !!code,
  });

  const refetchRef = useRef(query.refetch);
  const onCharacterActionRef = useRef(options?.onCharacterAction);

  useEffect(() => {
    refetchRef.current = query.refetch;
  });

  useEffect(() => {
    onCharacterActionRef.current = options?.onCharacterAction;
  });

  useEffect(() => {
    if (!code) return;

    const source = new EventSource(`/api/tables/${code}/stream`);

    const handleStateChanged = (event: MessageEvent) => {
      let parsed: { type: string; data?: unknown } = { type: 'state-changed' };

      try {
        parsed = JSON.parse(event.data);
      } catch {
        // Evento sem JSON válido (não deveria acontecer, mas nunca quebra o
        // refetch por causa disso) — trata como state-changed sem payload.
        parsed = { type: 'state-changed' };
      }

      refetchRef.current();

      if (parsed.type === 'character-action') {
        onCharacterActionRef.current?.(parsed.data as UseTableStreamCharacterAction);
      }
    };

    source.addEventListener('state-changed', handleStateChanged);

    return () => {
      source.removeEventListener('state-changed', handleStateChanged);
      source.close();
    };
  }, [code]);

  return {
    data: query.data?.data as GetTableServiceResponse | undefined,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
