'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowsOutCardinal } from '@phosphor-icons/react';
import type { ICharacterMaster } from '../models/Character';

export interface TableBoardProps {
  characters: ICharacterMaster[];
  renderCard: (character: ICharacterMaster) => React.ReactNode;
  onMove: (id: number, position_x: number, position_y: number) => void;
  cardScale?: number;
}

const CARD_W = 220;
const CARD_H = 315;

export function TableBoard({ characters, renderCard, onMove, cardScale = 1 }: TableBoardProps) {
  const [dragId, setDragId] = useState<number | null>(null);
  const [dragPos, setDragPos] = useState<Record<number, { x: number; y: number }>>({});
  const [isDragging, setIsDragging] = useState(false);
  const originRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentPosRef = useRef<{ x: number; y: number } | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      cleanupRef.current?.();
    };
  }, []);

  // Assim que o snapshot do servidor confirma a posição arrastada (mesmo
  // valor que já setamos otimisticamente em `finishDrag`), paramos de
  // sobrescrever a posição real com o estado local — sem isso, ou a carta
  // volta visualmente pra posição antiga por um instante (flicker) antes do
  // refetch chegar, ou o estado local nunca é limpo e a carta fica presa na
  // última posição arrastada para sempre.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reconcilia
    // o overlay local de drag contra a posição real assim que o servidor a
    // confirma; não há como expressar isso fora de um efeito (depende de
    // `characters`, uma prop externa vinda do SSE/refetch).
    setDragPos((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const character of characters) {
        const pending = next[character.id];

        if (pending && pending.x === character.position_x && pending.y === character.position_y) {
          delete next[character.id];
          changed = true;
        }
      }

      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characters]);

  function clearDragPos(characterId: number) {
    setDragPos((prev) => {
      const next = { ...prev };

      delete next[characterId];

      return next;
    });
  }

  // Depois de um arrasto com movimento real, o `pointerup` que encerra o
  // drag é seguido, quase sempre, por um evento `click` nativo do browser no
  // mesmo elemento (o card seguiu o cursor, então o ponteiro solta em cima
  // dele) — sem isso, toda vez que o Mestre move uma carta ela também vira
  // (flip), porque o clique de virar (em CharacterCard) não sabe que um
  // arrasto acabou de acontecer. Interceptamos esse único `click` seguinte
  // na fase de captura e o descartamos.
  function suppressNextClick() {
    function blocker(event: MouseEvent) {
      event.stopPropagation();
      event.preventDefault();
      window.removeEventListener('click', blocker, true);
    }

    window.addEventListener('click', blocker, true);
    // Se por algum motivo o click nunca chegar (ex: pointerup fora de
    // qualquer elemento clicável), não deixa o listener vazando pra sempre.
    setTimeout(() => window.removeEventListener('click', blocker, true), 400);
  }

  function beginDrag(character: ICharacterMaster, event: { clientX: number; clientY: number }) {
    setDragId(character.id);
    setIsDragging(true);
    originRef.current = { x: character.position_x, y: character.position_y };
    startRef.current = { x: event.clientX, y: event.clientY };
    currentPosRef.current = null;

    let moved = false;

    function onMoveHandler(ev: PointerEvent) {
      moved = true;

      const dx = ev.clientX - startRef.current.x;
      const dy = ev.clientY - startRef.current.y;

      const next = {
        x: Math.max(0, originRef.current.x + dx),
        y: Math.max(0, originRef.current.y + dy),
      };

      currentPosRef.current = next;

      setDragPos((prev) => ({
        ...prev,
        [character.id]: next,
      }));
    }

    function finishDrag(shouldPersist: boolean) {
      window.removeEventListener('pointermove', onMoveHandler);
      window.removeEventListener('pointerup', onUpHandler);
      window.removeEventListener('pointercancel', onCancelHandler);
      cleanupRef.current = null;

      const p = currentPosRef.current;

      if (shouldPersist && p) {
        const snapped = { x: Math.round(p.x / 60) * 60, y: Math.round(p.y / 60) * 60 };

        // Fica com o valor já encaixado (snapped) em vez de limpar — assim a
        // carta não pisca de volta pra posição antiga enquanto o refetch não
        // chega; o efeito acima limpa isso sozinho quando o servidor confirma.
        setDragPos((prev) => ({ ...prev, [character.id]: snapped }));
        onMove(character.id, snapped.x, snapped.y);

        if (moved) suppressNextClick();
      } else {
        clearDragPos(character.id);
      }

      setDragId(null);
      setIsDragging(false);
    }

    function onUpHandler() {
      finishDrag(true);
    }

    function onCancelHandler() {
      finishDrag(false);
    }

    window.addEventListener('pointermove', onMoveHandler);
    window.addEventListener('pointerup', onUpHandler);
    window.addEventListener('pointercancel', onCancelHandler);

    cleanupRef.current = () => finishDrag(false);
  }

  // Segurar a carta (fora dos botões/handle) por um curto instante também
  // inicia o arrasto — não é preciso mirar exatamente no ícone pequeno.
  // Um clique rápido (solta ou move antes do temporizador disparar) continua
  // sendo só um clique normal (vira a carta).
  function onShellPointerDown(character: ICharacterMaster, event: React.PointerEvent) {
    const target = event.target as HTMLElement;

    if (target.closest('button, input, label, .move-handle')) return;

    const startX = event.clientX;
    const startY = event.clientY;
    let cancelled = false;

    const timer = window.setTimeout(() => {
      if (!cancelled) beginDrag(character, { clientX: startX, clientY: startY });
    }, 130);

    function cleanup() {
      cancelled = true;
      clearTimeout(timer);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointermove', onMove);
    }

    function onUp() {
      cleanup();
    }

    function onMove(ev: PointerEvent) {
      if (Math.abs(ev.clientX - startX) > 6 || Math.abs(ev.clientY - startY) > 6) cleanup();
    }

    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointermove', onMove);
  }

  return (
    <div className={`board gm-canvas ${isDragging ? 'is-dragging' : ''}`}>
      {characters.map((character) => {
        const pos = dragPos[character.id] ?? { x: character.position_x, y: character.position_y };

        return (
          <div
            key={character.id}
            className={`rpg-card-shell ${dragId === character.id ? 'dragging' : ''}`}
            style={{
              left: pos.x,
              top: pos.y,
              width: Math.round(CARD_W * cardScale),
              height: Math.round(CARD_H * cardScale),
            }}
            onPointerDown={(event) => onShellPointerDown(character, event)}
          >
            <button
              type="button"
              className="move-handle"
              onPointerDown={(event) => { event.stopPropagation(); beginDrag(character, event); }}
              title="Mover"
            >
              <ArrowsOutCardinal weight="bold" />
            </button>

            <div
              style={{ transform: `scale(${cardScale})`, transformOrigin: 'top left', width: CARD_W, height: CARD_H }}
            >
              {renderCard(character)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
