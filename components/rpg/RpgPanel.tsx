import { cn } from '@/libs/utils';

export type RpgPanelVariant = 'glass' | 'parchment';

export interface RpgPanelProps extends React.ComponentPropsWithoutRef<'div'> {
  variant?: RpgPanelVariant;
  glow?: boolean;
}

// Painel base do rework AAA HUD — duas variantes de "material" (vidro escuro
// translúcido vs. pergaminho claro), com cantoneiras douradas decorativas nos
// 4 cantos. Ver docs/superpowers/specs/2026-08-28-aaa-hud-redesign-design.md.
export function RpgPanel({
  variant = 'glass',
  glow = false,
  className,
  children,
  ...rest
}: RpgPanelProps) {
  return (
    <div
      className={cn(
        'relative rounded-lg border p-6',
        variant === 'glass' ? 'rpg-panel-glass border-gold/35 text-parchment' : 'rpg-panel-parchment border-ink/40 text-ink',
        glow ? 'animate-pulse-glow' : '',
        className,
      )}
      {...rest}
    >
      <RpgPanelCorners variant={variant} />

      {children}
    </div>
  );
}

function RpgPanelCorners({ variant }: { variant: RpgPanelVariant }) {
  const cornerColor = variant === 'glass' ? 'border-gold/50' : 'border-ink/40';

  return (
    <>
      <span className={cn('pointer-events-none absolute left-1 top-1 h-3 w-3 border-l border-t', cornerColor)} />

      <span className={cn('pointer-events-none absolute right-1 top-1 h-3 w-3 border-r border-t', cornerColor)} />

      <span className={cn('pointer-events-none absolute bottom-1 left-1 h-3 w-3 border-b border-l', cornerColor)} />

      <span className={cn('pointer-events-none absolute bottom-1 right-1 h-3 w-3 border-b border-r', cornerColor)} />
    </>
  );
}
