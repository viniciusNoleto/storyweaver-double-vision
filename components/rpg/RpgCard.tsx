import { motion } from 'motion/react';
import { cn } from '@/libs/utils';

// Omite os handlers nativos do DOM cuja assinatura (DragEvent/AnimationEvent)
// conflita com a assinatura própria do `motion.div` para os mesmos nomes
// (PanInfo/AnimationDefinition). RpgCard não precisa de nenhum deles — quem
// quiser animação usa as props `motion` (whileHover/animate/etc.) direto.
type ConflictingMotionHandlers = 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration';

export interface RpgCardProps extends Omit<React.ComponentPropsWithoutRef<'div'>, ConflictingMotionHandlers> {
  featured?: boolean;
}

// Card com cantoneiras douradas e hover elevado — base do padrão "card em
// destaque" da referência do rework AAA HUD (carrossel de Espécie/Classe/
// Origem do Wizard, numa etapa futura). Nesta etapa (Home + /mesas), usado
// sem `featured` (nenhum card desta tela tem estado "selecionado"). Ver
// docs/superpowers/specs/2026-08-28-aaa-hud-redesign-design.md.
export function RpgCard({
  featured = false,
  className,
  children,
  ...rest
}: RpgCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 10px 30px rgba(0,0,0,0.45), 0 0 0 1px rgba(201,168,76,0.45)' }}
      transition={{ duration: 0.2 }}
      className={cn(
        'relative rounded-lg border bg-panel/80 p-4',
        featured ? 'border-gold/70 shadow-[0_0_0_1px_rgba(201,168,76,0.5)]' : 'border-gold/25',
        className,
      )}
      {...rest}
    >
      <span className="pointer-events-none absolute left-1 top-1 h-3 w-3 border-l border-t border-gold/50" />

      <span className="pointer-events-none absolute right-1 top-1 h-3 w-3 border-r border-t border-gold/50" />

      <span className="pointer-events-none absolute bottom-1 left-1 h-3 w-3 border-b border-l border-gold/50" />

      <span className="pointer-events-none absolute bottom-1 right-1 h-3 w-3 border-b border-r border-gold/50" />

      {children}
    </motion.div>
  );
}
