'use client';

import { cn } from '@/src/libs/utils';
import { useCallback, useRef, useState } from 'react';

// Qualquer zona (ITableZone) satisfaz este shape estruturalmente — o board só
// precisa do `id` para desenhar o container e resolver o drop.
export interface ITableBoardZone {
  id: number;
}

// Qualquer personagem (ICharacterMaster ou ICharacterDisplay) satisfaz este
// shape estruturalmente — o board não importa qual dos dois está recebendo.
export interface ITableBoardCharacter {
  id: number;
  zone_id: number;
}

export type TableBoardProps<TZone extends ITableBoardZone, TChar extends ITableBoardCharacter> = {
  // Já vem ordenado por `position` (ver `GET /api/tables/[code]`) — o board
  // só renderiza na ordem recebida, nunca reordena.
  zones: TZone[];
  characters: TChar[];
  renderToken: (character: TChar) => React.ReactNode;
  // Slot por zona (ex.: botão de excluir divisão, só Mestre). Recebe o índice
  // porque algumas decisões de UI (ex.: não deixar excluir a única zona)
  // dependem da posição, não só do id.
  renderZoneExtra?: (zone: TZone, index: number) => React.ReactNode;
  // Bloco extra ao final do flex row, mesma altura das zonas mas SEM o
  // `flex: 1` — ex.: botão "+" de adicionar divisão (só Mestre). Ausente na
  // Tela de Exibição.
  trailing?: React.ReactNode;
  // Texto de baixa opacidade mostrado no lugar do conteúdo quando uma zona
  // não tem nenhum personagem. Omitido = zona vazia fica só com espaço em branco.
  emptyZoneText?: string;
  // Presença = tokens arrastáveis entre zonas (Tela do Mestre); ausência =
  // board só leitura, sem nenhum listener de drag (Tela de Exibição).
  onDropCharacter?: (characterId: number, zoneId: number) => void;
  className?: string;
};

// Board de divisões/zonas lado a lado para as fichas da Mesa. Peça
// compartilhada crítica, agnóstica de papel (Mestre vs. Exibição) — ver
// `.claude/rules/table-concept.md` seção 4 ("Fronteira de integração"). Só
// recebe a lista de zonas/personagens e render-props para desenhar cada
// ficha/zona; quem decide a estética do token (`MasterToken`/`DisplayToken`)
// e da zona é quem consome este componente.
//
// Substituiu o antigo canvas de posicionamento livre (position_x/position_y
// em porcentagem do container): agora cada personagem pertence a exatamente
// uma zona (`zone_id`), e dentro da zona o layout é 100% automático (flex
// wrap centralizado) — não existe mais coordenada livre nenhuma.
//
// Zonas SEMPRE têm o mesmo tamanho entre si, não importa quantas existam —
// cada uma recebe `flex: 1 1 0` (nunca porcentagem manual calculada a partir
// da contagem), então a divisão do espaço fica a cargo do próprio flexbox.
//
// Drag implementado com pointer events nativos + `setPointerCapture`, sem
// dependência de lib de drag-and-drop (mesma técnica da implementação
// anterior). A diferença principal: durante o drag, o token não se move mais
// dentro do próprio fluxo de zonas — em vez disso, um preview `position:
// fixed` segue o ponteiro pela tela inteira (por cima de qualquer zona), e o
// token original fica com opacidade reduzida no lugar. Ao soltar, usamos
// `document.elementFromPoint` para achar qual zona está sob o ponteiro
// (`data-zone-id` em cada container) e chamamos `onDropCharacter` só então —
// nunca durante o `pointermove`, para não floodar o PATCH de zone_id.
export function TableBoard<TZone extends ITableBoardZone, TChar extends ITableBoardCharacter>({
  zones,
  characters,
  renderToken,
  renderZoneExtra,
  trailing,
  emptyZoneText,
  onDropCharacter,
  className,
}: TableBoardProps<TZone, TChar>) {
  const draggingIdRef = useRef<number | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);

  const charactersByZone = useCallback((zoneId: number) => characters.filter((c) => c.zone_id === zoneId), [characters]);

  function handlePointerDown(character: TChar) {
    return (event: React.PointerEvent<HTMLDivElement>) => {
      if (!onDropCharacter) return;

      event.currentTarget.setPointerCapture(event.pointerId);
      draggingIdRef.current = character.id;
      setDraggingId(character.id);
      setPointer({ x: event.clientX, y: event.clientY });
    };
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (draggingIdRef.current === null) return;

    setPointer({ x: event.clientX, y: event.clientY });
  }

  function endDrag(event: React.PointerEvent<HTMLDivElement>) {
    const characterId = draggingIdRef.current;

    draggingIdRef.current = null;
    setDraggingId(null);
    setPointer(null);

    if (characterId === null) return;

    const dropTarget = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-zone-id]');
    const zoneIdAttr = dropTarget?.getAttribute('data-zone-id');

    if (!zoneIdAttr) return; // soltou fora de qualquer zona — mantém no lugar

    const zoneId = Number(zoneIdAttr);

    if (onDropCharacter) onDropCharacter(characterId, zoneId);
  }

  const draggingCharacter = draggingId !== null ? characters.find((c) => c.id === draggingId) : undefined;

  return (
    // `self-stretch` (não `h-full`) de propósito: a altura vem do
    // flexbox-stretch do container pai (que precisa ser `flex`), não de
    // percentual — `height: 100%` não resolveria de forma confiável contra um
    // pai cuja própria altura vem de `flex-grow`, colapsando este board para
    // a altura do conteúdo (bug relatado: fichas "grudadas" no topo da zona).
    <div
      className={cn(
        className,
        "flex w-full self-stretch gap-3 touch-none"
      )}
    >
      {zones.map((zone, index) => {
        const zoneCharacters = charactersByZone(zone.id);
        const isEmpty = zoneCharacters.length === 0;

        return (
          <div
            key={zone.id}
            data-zone-id={zone.id}
            className="relative flex min-w-0 flex-1 flex-col rounded-lg"
          >
            {renderZoneExtra ? (
              <div className="absolute top-2 right-2 z-[1]">
                {renderZoneExtra(zone, index)}
              </div>
            ) : null}

            <div className="flex min-h-0 flex-[1_1_auto] flex-wrap content-center items-center justify-center gap-3 p-3">
              {isEmpty && emptyZoneText ? (
                <span className="text-center opacity-50">
                  {emptyZoneText}
                </span>
              ) : (
                zoneCharacters.map((character) => (
                  <div
                    key={character.id}
                    onPointerDown={handlePointerDown(character)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                    className={cn(
                      'touch-none',
                      onDropCharacter ? 'cursor-grab' : 'cursor-default',
                      draggingId === character.id ? 'opacity-[0.35]' : 'opacity-100',
                    )}
                  >
                    {renderToken(character)}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}

      {trailing ? (
        <div className="flex flex-none items-start">
          {trailing}
        </div>
      ) : null}

      {draggingCharacter && pointer ? (
        <div
          className="pointer-events-none fixed z-[1000] -translate-x-1/2 -translate-y-1/2"
          style={{ left: pointer.x, top: pointer.y }}
        >
          {renderToken(draggingCharacter)}
        </div>
      ) : null}
    </div>
  );
}
