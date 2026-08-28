'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Icon } from '@iconify/react';
import { cn } from '@/src/libs/utils';

export interface ManaCrystalsProps {
  current: number;
  max: number;
  crystalSize?: number; // px, default 18
  className?: string;
}

// Peça compartilhada (ver `.claude/rules/table-concept.md` seção 4) — usada
// tanto pela Tela do Mestre quanto pela Tela de Exibição, já que mana (ao
// contrário de hp/stats) aparece nos DOIS papéis (ver a exceção documentada em
// `resources/character/models/Character.ts`).
//
// AUTOCONTIDO — nenhum consumidor precisa passar prop extra de evento para a
// animação de "mana sendo gasta"/"mana restaurada" acontecer. O componente
// guarda o `current` do render anterior (`useRef`) e, num `useEffect`, compara
// com o `current` novo recebido via props:
// - Caiu (gasto) → os slots que ficaram vazios (índices `[current, anterior)`)
//   disparam uma animação de "estilhaçar" (shrink + fade + leve rotação) por
//   cima do cristal cheio, revelando o slot vazio que já está por baixo.
// - Subiu (restaurado) → os slots que ficaram cheios (índices
//   `[anterior, current)`) disparam um pulso de brilho por cima do cristal
//   recém-cheio.
// Cada disparo usa uma `key` derivada de um nonce interno (incrementado a
// cada mudança de `current`) para forçar a `motion` reiniciar a animação do
// zero mesmo quando o mesmo tipo de gasto acontece duas vezes seguidas (ex.:
// dois `mana-spend` consecutivos sem a animação anterior terminar) — mesmo
// truque de `key`/nonce já usado em `DisplayToken.tsx`/`MasterToken.tsx` para
// o pulso de dano/cura.
//
// Isso significa que o efeito dispara tanto quando a mudança vem de uma ação
// local (o próprio Mestre clicando em "gastar mana") quanto quando vem de um
// refetch disparado por SSE após a ação de OUTRO cliente — o componente não
// distingue a origem, só reage à diferença entre o `current` anterior e o
// novo. Um `setTimeout` limpa o estado de "pendente" ~700ms depois, então os
// slots voltam a renderizar só a camada estática (sem overlay extra) entre
// uma animação e a próxima.
//
// `max <= 0` (personagem sem mana) → não renderiza nada (`null`). Quem decide
// SE mostra o componente (baseado em `has_mana`) é o consumidor — o
// componente em si é seguro de chamar com `max: 0`.
export function ManaCrystals({ current, max, crystalSize = 18, className }: ManaCrystalsProps) {
  const safeMax = Math.max(0, Math.floor(max));
  const safeCurrent = Math.min(Math.max(0, Math.floor(current)), safeMax);

  const previousRef = useRef(safeCurrent);
  const [nonce, setNonce] = useState(0);
  const [pending, setPending] = useState<{ type: 'spend' | 'restore'; from: number; to: number } | null>(null);

  useEffect(() => {
    const previous = previousRef.current;

    if (safeCurrent === previous) return;

    const type: 'spend' | 'restore' = safeCurrent < previous ? 'spend' : 'restore';
    const range = type === 'spend' ? { from: safeCurrent, to: previous } : { from: previous, to: safeCurrent };

    setPending({ type, ...range });
    setNonce((n) => n + 1);
    previousRef.current = safeCurrent;

    const timeout = setTimeout(() => setPending(null), 700);

    return () => clearTimeout(timeout);
  }, [safeCurrent]);

  if (safeMax <= 0) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {Array.from({ length: safeMax }).map((_, index) => {
        const isFull = index < safeCurrent;
        const isSpendingHere = pending?.type === 'spend' && index >= pending.from && index < pending.to;
        const isRestoringHere = pending?.type === 'restore' && index >= pending.from && index < pending.to;

        return (
          <div
            key={index}
            className="relative shrink-0"
            // `crystalSize` vem de props (configurável por consumidor), não é
            // uma constante fixa do módulo — não existe classe Tailwind capaz
            // de expressar uma largura/altura só conhecida em runtime (o JIT
            // do Tailwind só reconhece literais presentes no código-fonte).
            // Ver exceção documentada em `.claude/rules/styling-tailwind.md`.
            style={{ width: crystalSize, height: crystalSize }}
          >
            {/* Camada estática — sempre reflete o estado final atual (cheio
                ou vazio). MANA_BLUE/MANA_BLUE_LIGHT (`shared/constants/colors.ts`)
                usados como hex literal porque classes Tailwind arbitrárias
                precisam do valor no texto-fonte, não de uma constante JS
                importada — mesmo padrão já usado para hp_color/dourado em
                `DisplayToken.tsx`. */}
            <Icon
              icon="lucide:gem"
              width={crystalSize}
              height={crystalSize}
              className={cn(
                'absolute inset-0 transition-colors duration-300',
                isFull ? 'text-[#2e86c1] drop-shadow-[0_0_4px_rgba(46,134,193,0.75)]' : 'text-white/15',
              )}
            />

            <AnimatePresence>
              {isSpendingHere && (
                <motion.div
                  key={`spend-${index}-${nonce}`}
                  className="absolute inset-0"
                  initial={{ opacity: 1, scale: 1, rotate: 0 }}
                  animate={{ opacity: 0, scale: 0.3, rotate: 35 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45, ease: 'easeIn' }}
                >
                  <Icon
                    icon="lucide:gem"
                    width={crystalSize}
                    height={crystalSize}
                    className="text-[#6fb7e8]"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isRestoringHere && (
                <motion.div
                  key={`restore-${index}-${nonce}`}
                  // O valor do glow em si é estático (só opacity/scale
                  // animam via `motion`) — por isso é classe Tailwind
                  // arbitrária, não `style` (ver `.claude/rules/styling-tailwind.md`).
                  className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_10px_4px_rgba(111,183,232,0.85)]"
                  initial={{ opacity: 0.9, scale: 0.6 }}
                  animate={{ opacity: 0, scale: 1.8 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.55, ease: 'easeOut' }}
                />
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
