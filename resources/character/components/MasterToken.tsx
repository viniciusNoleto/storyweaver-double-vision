'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Text } from '@mantine/core';
import { Icon } from '@iconify/react';
import { cn } from '@/src/libs/utils';
import { StatusEffectBadge } from './StatusEffectBadge';
import { ManaCrystals } from './ManaCrystals';
import type { ICharacterMaster } from '../models/Character';

const CLICK_DRAG_THRESHOLD_PX = 6;

// Redesenho para formato de carta (a pedido do usuário — ficha maior, no
// espírito de uma carta de tarot/baralho, em vez do token circular anterior
// de 116px). Proporção final ~176 × ~245-290px (varia com quantas linhas de
// condição/mana o personagem tem — cartas não são forçadas a uma altura
// fixa, mesmo espírito de "carta com mais ou menos equipamento").
//
// Estilização (ver `.claude/rules/styling-tailwind.md`): todo tamanho fixo
// abaixo é classe Tailwind com o valor literal, documentado aqui porque não
// há checagem automática ligando o comentário à classe:
// CARD_WIDTH = 176
// IMAGE_HEIGHT = 150
// INNER_SPREAD = 3 / OUTER_SPREAD = 6 (moldura via box-shadow empilhado sem
// blur, mesma técnica do token circular anterior — cada camada aparece como
// um contorno concêntrico porque a declarada primeiro pinta por cima).

// Pulso visual de dano/cura/mana (etapa de mana) — alimentado por
// `useTableStream#onCharacterAction` na page, que já mostra números reais
// (diferente da Exibição, que só tem efeito, sem valor). `nonce` muda a cada
// evento para a animação sempre reiniciar do zero (ex.: duas ações
// seguidas), mesmo padrão do `key={activeEffect.key}` da `DisplayToken`.
export interface MasterTokenPulse {
  type: 'damage' | 'heal' | 'mana-spend' | 'mana-restore' | 'extra-add' | 'extra-remove';
  amount: number;
  nonce: number;
}

const PULSE_IS_NEGATIVE: Record<MasterTokenPulse['type'], boolean> = {
  damage: true,
  heal: false,
  'mana-spend': true,
  'mana-restore': false,
  'extra-add': false,
  'extra-remove': true,
};

// Cor do texto do pulso — hp usa os tons vermelho/verde já existentes; mana
// usa MANA_BLUE/MANA_BLUE_LIGHT (`shared/constants/colors.ts`) como classe
// arbitrária, mesma técnica já usada em `ManaCrystals.tsx`, para diferenciar
// visualmente um gasto/restauração de mana de um dano/cura de vida. Vida
// extra (`extra-add`/`extra-remove`) reusa o MESMO verde de `heal` nos dois
// sentidos — a pedido do usuário, a animação de vida extra é a de cura, só
// que sempre verde (adicionar ou remover).
const PULSE_COLOR_CLASS: Record<MasterTokenPulse['type'], string> = {
  damage: 'text-[#e0564a]',
  heal: 'text-[#4fce7f]',
  'mana-spend': 'text-[#2e86c1]',
  'mana-restore': 'text-[#6fb7e8]',
  'extra-add': 'text-[#4fce7f]',
  'extra-remove': 'text-[#4fce7f]',
};

type MasterTokenProps = {
  character: ICharacterMaster;
  onClick: () => void;
  pulse?: MasterTokenPulse | null;
};

// Carta da Tela do Mestre — mostra números reais (hp atual/máximo), condições
// ativas (`status_effects`) e mana (`ManaCrystals`, só quando `has_mana`), e
// sinaliza personagens escondidos da Exibição (`visible: false`) com borda
// tracejada e um ícone de "olho fechado". NUNCA usado pela Exibição (essa usa
// `DisplayToken`, construído em paralelo por outro agente — ver
// `.claude/rules/table-concept.md` seção 2/4).
//
// Renderizado dentro do wrapper posicionável do `TableBoard` compartilhado,
// que já escuta pointerdown/move/up para o drag. Este componente só adiciona
// a detecção local de "foi um clique, não um arrasto" (via distância do
// ponteiro entre down/up) para que abrir o painel de ações não dispare toda
// vez que o Mestre solta a carta depois de arrastar.
//
// Achado ao testar via Playwright (etapa 8, ainda válido no redesenho de
// carta): o wrapper do `TableBoard` chama `setPointerCapture` no
// `pointerdown` (ver `TableBoard.tsx`) — pela spec de Pointer Events, isso
// RETARGETA os eventos de ponteiro/mouse subsequentes (incluindo `click`)
// para o elemento que capturou, não mais para o botão original. Ou seja, um
// `onClick` declarado direto no `<button>` deste componente nunca dispara
// depois que o `TableBoard` captura o ponteiro. A correção fica inteiramente
// contida aqui (sem tocar `TableBoard.tsx`, peça fechada): em vez de um
// `onClick` nativo, ouvimos `pointerup`/`pointercancel` no `window` a partir
// do `pointerdown` (capture) — o evento retargetado ainda borbulha até o
// `window` normalmente, só muda o `target` reportado.
export function MasterToken({ character, onClick, pulse }: MasterTokenProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const pointerEndListenerRef = useRef<((event: PointerEvent) => void) | null>(null);
  const onClickRef = useRef(onClick);

  useEffect(() => {
    onClickRef.current = onClick;
  });

  // Remove qualquer listener de `window` pendente ao desmontar (ex.: o
  // personagem foi removido no meio de um gesto de pointerdown/pointerup).
  useEffect(() => () => {
    if (pointerEndListenerRef.current) {
      window.removeEventListener('pointerup', pointerEndListenerRef.current);
      window.removeEventListener('pointercancel', pointerEndListenerRef.current);
    }
  }, []);

  function handlePointerDownCapture(event: React.PointerEvent<HTMLButtonElement>) {
    const start = { x: event.clientX, y: event.clientY };

    if (pointerEndListenerRef.current) {
      window.removeEventListener('pointerup', pointerEndListenerRef.current);
      window.removeEventListener('pointercancel', pointerEndListenerRef.current);
    }

    const handleWindowPointerEnd = (upEvent: PointerEvent) => {
      window.removeEventListener('pointerup', handleWindowPointerEnd);
      window.removeEventListener('pointercancel', handleWindowPointerEnd);
      pointerEndListenerRef.current = null;

      const dx = Math.abs(upEvent.clientX - start.x);
      const dy = Math.abs(upEvent.clientY - start.y);

      if (dx <= CLICK_DRAG_THRESHOLD_PX && dy <= CLICK_DRAG_THRESHOLD_PX) {
        onClickRef.current();
      }
    };

    pointerEndListenerRef.current = handleWindowPointerEnd;
    window.addEventListener('pointerup', handleWindowPointerEnd);
    window.addEventListener('pointercancel', handleWindowPointerEnd);
  }

  const showImage = character.image_url && !imageFailed;
  // Mesma regra do `is_defeated` calculado no servidor para a Exibição —
  // vida extra conta como vida ainda restante (ver
  // `.claude/rules/table-concept.md` seção 2).
  const isDefeated = character.hp_current + character.extra_hp <= 0;
  const hasStatusEffects = character.status_effects.length > 0;

  return (
    <button
      type="button"
      onPointerDownCapture={handlePointerDownCapture}
      className="relative flex w-[176px] cursor-inherit flex-col items-stretch gap-0 select-none border-0 bg-transparent p-0 text-left"
    >
      <AnimatePresence>
        {pulse && (
          <motion.div
            key={pulse.nonce}
            initial={{ opacity: 1, y: 0, scale: 1 }}
            animate={{ opacity: 0, y: -36, scale: 1.15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
            className={cn(
              'pointer-events-none absolute -top-2 left-1/2 z-[5] -translate-x-1/2 whitespace-nowrap text-[22px] font-bold [text-shadow:0_1px_4px_rgba(0,0,0,0.85)]',
              PULSE_COLOR_CLASS[pulse.type],
            )}
          >
            {PULSE_IS_NEGATIVE[pulse.type] ? `-${pulse.amount}` : `+${pulse.amount}`}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wrapper com padding igual ao OUTER_SPREAD (6px) — reserva o espaço
          que a moldura (box-shadow, que renderiza FORA da caixa de layout)
          ocupa de verdade, em todas as direções, independente da altura
          dinâmica da carta (varia com badges de condição / linha de mana). */}
      <div className="p-1.5">
        <div
          className={cn(
            'relative flex w-[176px] flex-col overflow-hidden rounded-lg bg-accent-800 text-gold-light transition-[box-shadow,opacity,border-color,filter] duration-300',
            // Moldura de carta: friso escuro + trim dourado externo via
            // box-shadow empilhado, mesmo espírito do token circular anterior.
            // `visible: false` continua sinalizado com borda tracejada +
            // opacidade reduzida.
            character.visible
              ? 'border-none shadow-[0_0_0_3px_rgba(13,10,6,0.7),0_0_0_6px_#C9A84C]'
              : 'border-2 border-dashed border-secondary-500 shadow-none opacity-65',
            isDefeated ? 'grayscale' : 'grayscale-0',
          )}
        >
          <div className="relative h-[150px] w-full shrink-0 bg-black/25">
            {showImage ? (
              <img
                src={character.image_url ?? undefined}
                alt={character.name}
                onError={() => setImageFailed(true)}
                draggable={false}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Icon
                  icon="lucide:user"
                  width={48}
                  height={48}
                />
              </div>
            )}

            {!character.visible && (
              <div
                className="absolute bottom-2 right-2 flex h-[27px] w-[27px] items-center justify-center rounded-full bg-panel text-secondary-300"
              >
                <Icon
                  icon="lucide:eye-off"
                  width={16}
                  height={16}
                />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5 px-3 py-2">
            <Text
              size="sm"
              fw={600}
              truncate="end"
              c="primary.5"
              className="max-w-[152px] font-display"
            >
              {character.name}
            </Text>

            <div className="flex items-center gap-1.5">
              <Text
                size="sm"
                className="text-parchment/55"
              >
                {`${character.hp_current}/${character.hp_max}`}
              </Text>

              {character.extra_hp > 0 && (
                <Text
                  size="sm"
                  fw={600}
                  className="text-[#4fce7f]"
                >
                  {`+${character.extra_hp}`}
                </Text>
              )}
            </div>

            {hasStatusEffects && (
              <div className="flex flex-wrap items-center gap-1.5">
                {character.status_effects.map((effect) => (
                  <StatusEffectBadge
                    key={effect}
                    effect={effect}
                    size={16}
                  />
                ))}
              </div>
            )}

            {character.has_mana && (
              <ManaCrystals
                current={character.mana_current}
                max={character.mana_max}
                crystalSize={14}
              />
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
