'use client';

import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/src/libs/utils';
import { StatusEffectBadge } from '@/resources/character/components/StatusEffectBadge';
import { ManaCrystals } from '@/resources/character/components/ManaCrystals';
import type { ICharacterDisplay } from '@/resources/character/models/Character';

// Redesenho "carta" (pedido do usuário) — substitui o token circular anterior
// (108px de arte + moldura até 146px) por uma carta vertical tipo
// tarot/baralho, maior (esta tela é pro telão, pode ser um pouco maior que a
// carta equivalente na Tela do Mestre).
//
// Estilização (ver `.claude/rules/styling-tailwind.md`): os tamanhos abaixo
// (carta 220×320, moldura reservando 272×372) viraram classes Tailwind com o
// valor literal (`w-[220px]`, `w-[272px]`, etc.) em vez de `style` — não há
// constante `CARD_WIDTH`/`CARD_HEIGHT` lida em runtime para isso; atualize as
// classes manualmente se os números abaixo mudarem.
//
// Espessura de cada camada da moldura, da mais interna pra mais externa
// (mesma técnica de `box-shadow` empilhado sem blur da versão anterior — cada
// camada aparece como um "anel" concêntrico porque a declarada primeiro é
// pintada por cima; funciona igual para um retângulo arredondado, não só para
// círculo). `HP_RING_WIDTH` continua sendo deliberadamente a maior de todas —
// requisito crítico do produto (`.claude/rules/table-concept.md` seções 2/5):
// é o único sinal que o jogador enxerga à distância no telão, então a moldura
// ornamental só pode emoldurar por fora/por dentro, nunca competir em
// destaque com a cor de vida. Escalado proporcionalmente ao aumento de
// tamanho da carta (era 3/10/3/3 para o token de 108px). Continuam como
// constantes JS (não classes) porque alimentam o `boxShadow` animado por
// `motion` — valor genuinamente dinâmico (muda com `character.hp_color`), ver
// exceção documentada em `.claude/rules/styling-tailwind.md`.
const BEZEL_WIDTH = 4; // friso escuro colado na carta, separa a arte do anel de cor
const HP_RING_WIDTH = 14; // anel de vida — hp_color, a camada dominante
const INNER_TRIM_WIDTH = 4; // filete escuro entre o anel de vida e o trim externo
const OUTER_TRIM_WIDTH = 4; // trim externo dourado, acabamento "moldura de metal"

const BEZEL_SPREAD = BEZEL_WIDTH;
const HP_RING_SPREAD = BEZEL_SPREAD + HP_RING_WIDTH;
const INNER_TRIM_SPREAD = HP_RING_SPREAD + INNER_TRIM_WIDTH;
const OUTER_TRIM_SPREAD = INNER_TRIM_SPREAD + OUTER_TRIM_WIDTH; // = 26

// Efeito visual momentâneo de dano/cura, disparado pela page ao receber
// `character-action` via SSE (`useTableStream#onCharacterAction`). `key` muda
// a cada evento (mesmo quando a `action` se repete, ex.: dois danos seguidos)
// só para forçar a animação a reiniciar do zero em vez de ficar "presa" no
// meio de uma anterior ainda tocando. NUNCA carregue `amount` aqui — é
// puramente visual, sem número (ver `.claude/rules/table-concept.md` seção 2).
// Ações de mana (`mana-spend`/`mana-restore`) não passam por aqui — o
// `ManaCrystals` já anima sozinho a partir do snapshot (`mana_current`), ver
// comentário em `app/mesa/[code]/exibicao/page.tsx`.
export interface DisplayTokenActiveEffect {
  action: 'damage' | 'heal';
  key: number;
}

export interface DisplayTokenProps {
  character: ICharacterDisplay;
  activeEffect?: DisplayTokenActiveEffect | null;
}

// Ficha somente leitura da Tela de Exibição. `ICharacterDisplay` nem possui
// hp_current/hp_max/stats (ver `resources/character/models/Character.ts`),
// então este componente NUNCA pode renderizar/logar um número de jogo — só
// nome, imagem, o anel de cor (`hp_color`, já calculado no servidor via
// `HealthColor.ts`), `is_defeated` (booleano derivado, seguro),
// `status_effects` (slugs sem número, via `StatusEffectBadge`) e
// `has_mana`/`mana_current`/`mana_max` (exceção deliberada documentada em
// `Character.ts` — mana É permitido cru na Exibição, ao contrário de hp/stats).
// Ver `.claude/rules/table-concept.md` seção 2.
//
// Estrutura da carta (de cima pra baixo, dentro do retângulo com moldura):
// 1. Barra de título — nome do personagem.
// 2. Arte — imagem (ou inicial do nome) preenchendo o espaço restante.
// 3. Barra de rodapé (só quando há conteúdo) — fileira de `StatusEffectBadge`
//    (um por item em `status_effects`, cada um com a animação contínua
//    própria do estado) e, quando `has_mana`, a fileira de `ManaCrystals`.
//
// A moldura (`hp_color` + is_defeated) é pintada no MESMO `motion.div` que
// envolve a carta inteira (título+arte+rodapé), igual à versão anterior — só
// mudou de círculo pra retângulo arredondado (`box-shadow` respeita
// `border-radius` normalmente). O wrapper externo reserva o espaço exato que
// a moldura ocupa (mesma correção de bug documentada em `table-concept.md`:
// sem isso, os anéis vazam por cima de elementos vizinhos).
export function DisplayToken({ character, activeEffect }: DisplayTokenProps) {
  const hasStatusEffects = character.status_effects.length > 0;
  const hasFooter = hasStatusEffects || character.has_mana;

  // 272 = 220 (largura da carta) + 26 (OUTER_TRIM_SPREAD) * 2
  // 372 = 320 (altura da carta) + 26 (OUTER_TRIM_SPREAD) * 2
  // Atualize estas classes se `CARD_WIDTH`/`CARD_HEIGHT`/as constantes de
  // moldura acima mudarem (ver `.claude/rules/styling-tailwind.md`).
  return (
    <div className="flex h-[372px] w-[272px] items-center justify-center">
      <motion.div
        key={activeEffect?.key ?? 'idle'}
        animate={{ x: activeEffect?.action === 'damage' ? [0, -5, 5, -5, 0] : 0 }}
        transition={{ duration: 0.45, ease: 'easeInOut' }}
      >
        <motion.div
          className="relative flex h-[320px] w-[220px] flex-col overflow-hidden rounded-lg bg-accent-800"
          animate={{
            boxShadow: [
              `0 0 0 ${BEZEL_SPREAD}px rgba(13, 10, 6, 0.7)`,
              `0 0 0 ${HP_RING_SPREAD}px ${character.hp_color}`,
              `0 0 0 ${INNER_TRIM_SPREAD}px #1c140d`,
              `0 0 0 ${OUTER_TRIM_SPREAD}px #c9a84c`,
            ].join(', '),
            filter: character.is_defeated ? 'grayscale(1)' : 'grayscale(0)',
          }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        >
          <div className="shrink-0 border-b border-gold/30 bg-black/70 px-2 py-1.5">
            <span className="block truncate text-center text-base font-semibold font-display tracking-wide text-gold-light drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
              {character.name}
            </span>
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden">
            {character.image_url ? (
              <img
                src={character.image_url}
                alt={character.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-accent-700 text-5xl font-semibold text-white">
                {character.name.charAt(0).toUpperCase()}
              </div>
            )}

            <AnimatePresence>
              {activeEffect && (
                <motion.div
                  key={activeEffect.key}
                  className={cn(
                    'pointer-events-none absolute inset-0',
                    activeEffect.action === 'damage'
                      ? 'bg-[rgba(192,57,43,0.55)]'
                      : 'bg-[rgba(39,174,96,0.4)] shadow-[inset_0_0_30px_6px_rgba(39,174,96,0.6)]',
                  )}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: activeEffect.action === 'damage' ? 0.5 : 0.75, ease: 'easeInOut' }}
                />
              )}
            </AnimatePresence>
          </div>

          {hasFooter && (
            <div className="flex shrink-0 flex-col items-center gap-1.5 border-t border-gold/20 bg-black/70 px-2 py-1.5">
              {hasStatusEffects && (
                <div className="flex items-center justify-center gap-1.5">
                  {character.status_effects.map((effect, index) => (
                    <StatusEffectBadge
                      key={`${effect}-${index}`}
                      effect={effect}
                      size={18}
                    />
                  ))}
                </div>
              )}

              {character.has_mana && (
                <ManaCrystals
                  current={character.mana_current}
                  max={character.mana_max}
                  crystalSize={16}
                />
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
