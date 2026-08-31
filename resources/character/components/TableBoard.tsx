'use client';

import { useRef, useState } from 'react';
import { ArrowsOutCardinal } from '@phosphor-icons/react';
import type { ITableZone } from '@/resources/table/models/TableZone';

export interface ITableBoardCharacter {
  id: number;
  zone_id: number;
}

export interface TableBoardProps<TChar extends ITableBoardCharacter> {
  zones: ITableZone[];
  characters: TChar[];
  renderCard: (character: TChar) => React.ReactNode;
  // Slot por zona (ex.: botão de excluir divisão) — ausente = sem controles
  // por zona (Tela de Exibição).
  renderZoneExtra?: (zone: ITableZone, index: number) => React.ReactNode;
  // Bloco extra ao final da linha de zonas, mesma altura delas mas sem
  // `flex: 1` — ex.: botão "+ Nova divisão". Ausente na Tela de Exibição.
  trailing?: React.ReactNode;
  // Texto de baixa opacidade mostrado no lugar do conteúdo quando uma zona
  // não tem nenhum personagem.
  emptyZoneText?: string;
  // Presença = tokens arrastáveis entre zonas (Tela do Mestre); ausência =
  // board só leitura, sem nenhum listener de drag (Tela de Exibição).
  onDropCharacter?: (characterId: number, zoneId: number) => void;
  className?: string;
}

const CARD_W = 220;
const CARD_H = 315;

// Board de divisões/zonas lado a lado para as fichas da Mesa. Cada zona tem
// sempre a mesma largura (`flex: 1 1 0`) e organiza suas fichas centralizadas
// e espaçadas automaticamente (flex-wrap) — não existe posicionamento livre
// por pixel. Genérico por tipo de personagem, então serve tanto para a Tela
// do Mestre (`ICharacterMaster`, arrastável) quanto para a Tela de Exibição
// (`ICharacterDisplay`, só leitura — basta omitir `onDropCharacter`).
export function TableBoard<TChar extends ITableBoardCharacter>({
  zones,
  characters,
  renderCard,
  renderZoneExtra,
  trailing,
  emptyZoneText,
  onDropCharacter,
  className = '',
}: TableBoardProps<TChar>) {
  const [dragId, setDragId] = useState<number | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const draggingIdRef = useRef<number | null>(null);

  // Depois de um arrasto com movimento real, o `pointerup` que encerra o
  // drag é seguido, quase sempre, por um evento `click` nativo do browser no
  // mesmo elemento — sem isso, toda vez que o Mestre move uma carta ela
  // também vira (flip), porque o clique de virar (em CharacterCard) não sabe
  // que um arrasto acabou de acontecer. Interceptamos esse único `click`
  // seguinte na fase de captura e o descartamos.
  function suppressNextClick() {
    function blocker(event: MouseEvent) {
      event.stopPropagation();
      event.preventDefault();
      window.removeEventListener('click', blocker, true);
    }

    window.addEventListener('click', blocker, true);
    setTimeout(() => window.removeEventListener('click', blocker, true), 400);
  }

  function beginDrag(character: TChar, startEvent: { clientX: number; clientY: number }) {
    draggingIdRef.current = character.id;
    setDragId(character.id);
    setPointer({ x: startEvent.clientX, y: startEvent.clientY });

    let moved = false;

    function onMoveHandler(ev: PointerEvent) {
      moved = true;
      setPointer({ x: ev.clientX, y: ev.clientY });
    }

    function finishDrag(shouldDrop: boolean, ev: PointerEvent) {
      window.removeEventListener('pointermove', onMoveHandler);
      window.removeEventListener('pointerup', onUpHandler);
      window.removeEventListener('pointercancel', onCancelHandler);

      const characterId = draggingIdRef.current;

      draggingIdRef.current = null;
      setDragId(null);
      setPointer(null);

      if (!shouldDrop || characterId === null) return;

      const zoneTarget = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('[data-zone-id]');
      const zoneIdAttr = zoneTarget?.getAttribute('data-zone-id');

      if (!zoneIdAttr) return; // soltou fora de qualquer zona — mantém no lugar

      if (moved) suppressNextClick();

      onDropCharacter?.(characterId, Number(zoneIdAttr));
    }

    function onUpHandler(ev: PointerEvent) {
      finishDrag(true, ev);
    }

    function onCancelHandler(ev: PointerEvent) {
      finishDrag(false, ev);
    }

    window.addEventListener('pointermove', onMoveHandler);
    window.addEventListener('pointerup', onUpHandler);
    window.addEventListener('pointercancel', onCancelHandler);
  }

  // Segurar a carta (fora dos botões/handle) por um curto instante também
  // inicia o arrasto — não é preciso mirar exatamente no ícone pequeno. Mover
  // o ponteiro além de um pequeno limiar ANTES do temporizador disparar
  // também inicia o arrasto de imediato (gesto normal de mouse: pressionar e
  // já mover). Só um clique de verdade (solta sem mover e antes do
  // temporizador) continua sendo só um clique normal (vira a carta).
  function onShellPointerDown(character: TChar, event: React.PointerEvent) {
    if (!onDropCharacter) return;

    const target = event.target as HTMLElement;

    if (target.closest('button, input, label, .move-handle')) return;

    const startX = event.clientX;
    const startY = event.clientY;
    let started = false;

    function startNow(point: { clientX: number; clientY: number }) {
      if (started) return;

      started = true;
      cleanup();
      beginDrag(character, point);
    }

    const timer = window.setTimeout(() => startNow({ clientX: startX, clientY: startY }), 130);

    function cleanup() {
      clearTimeout(timer);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointermove', onMove);
    }

    function onUp() {
      cleanup();
    }

    function onMove(ev: PointerEvent) {
      if (Math.abs(ev.clientX - startX) > 6 || Math.abs(ev.clientY - startY) > 6) startNow(ev);
    }

    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointermove', onMove);
  }

  const draggingCharacter = dragId !== null ? characters.find((c) => c.id === dragId) : undefined;

  return (
    <div className={`board zone-board ${className}`}>
      {zones.map((zone, index) => {
        const zoneCharacters = characters.filter((c) => c.zone_id === zone.id);
        const isEmpty = zoneCharacters.length === 0;

        return (
          <div
            key={zone.id}
            data-zone-id={zone.id}
            className="zone-col"
          >
            {renderZoneExtra ? (
              <div className="zone-delete-btn">
                {renderZoneExtra(zone, index)}
              </div>
            ) : null}

            <div className="zone-col-content">
              {isEmpty && emptyZoneText ? (
                <span className="zone-empty-text">
                  {emptyZoneText}
                </span>
              ) : (
                zoneCharacters.map((character) => (
                  <div
                    key={character.id}
                    className={`rpg-card-shell ${onDropCharacter ? '' : 'read-only'} ${dragId === character.id ? 'dragging' : ''}`}
                    style={{ width: CARD_W, height: CARD_H }}
                    onPointerDown={(event) => onShellPointerDown(character, event)}
                  >
                    {onDropCharacter ? (
                      <button
                        type="button"
                        className="move-handle"
                        onPointerDown={(event) => { event.stopPropagation(); beginDrag(character, event); }}
                        title="Mover"
                      >
                        <ArrowsOutCardinal weight="bold" />
                      </button>
                    ) : null}

                    {renderCard(character)}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}

      {trailing ? (
        <div className="zone-add-slot">
          {trailing}
        </div>
      ) : null}

      {draggingCharacter && pointer ? (
        <div
          className="zone-drag-preview"
          style={{ left: pointer.x, top: pointer.y, width: CARD_W, height: CARD_H }}
        >
          {renderCard(draggingCharacter)}
        </div>
      ) : null}
    </div>
  );
}
