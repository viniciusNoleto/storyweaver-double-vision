'use client';

import { useRef, useState } from 'react';
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

  function beginDrag(character: ICharacterMaster, event: React.PointerEvent) {
    setDragId(character.id);
    setIsDragging(true);
    originRef.current = { x: character.position_x, y: character.position_y };
    startRef.current = { x: event.clientX, y: event.clientY };

    function onMoveHandler(ev: PointerEvent) {
      const dx = ev.clientX - startRef.current.x;
      const dy = ev.clientY - startRef.current.y;

      setDragPos((prev) => ({
        ...prev,
        [character.id]: {
          x: Math.max(0, originRef.current.x + dx),
          y: Math.max(0, originRef.current.y + dy),
        },
      }));
    }

    function onUpHandler() {
      window.removeEventListener('pointermove', onMoveHandler);
      window.removeEventListener('pointerup', onUpHandler);

      setDragPos((prev) => {
        const p = prev[character.id];

        if (p) {
          const snapped = { x: Math.round(p.x / 60) * 60, y: Math.round(p.y / 60) * 60 };

          onMove(character.id, snapped.x, snapped.y);
        }

        return prev;
      });

      setDragId(null);
      setIsDragging(false);
    }

    window.addEventListener('pointermove', onMoveHandler);
    window.addEventListener('pointerup', onUpHandler);
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
          >
            <button
              className="move-handle"
              onPointerDown={(event) => beginDrag(character, event)}
              title="Mover"
            >
              ⤧
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
