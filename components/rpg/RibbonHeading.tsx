import { cn } from '@/libs/utils';

export interface RibbonHeadingProps {
  children: React.ReactNode;
  size?: 'lg' | 'md';
}

// Título de página/seção com divisor ornamental (◇ entre duas linhas em
// gradiente) — mesmo padrão dos títulos "USER INTERFACE"/"CHARACTER CREATOR"
// da referência do rework AAA HUD. `size="lg"` para título de página (Home),
// `size="md"` para cabeçalho de seção (/mesas). Ver
// docs/superpowers/specs/2026-08-28-aaa-hud-redesign-design.md.
export function RibbonHeading({
  children,
  size = 'md',
}: RibbonHeadingProps) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <h1
        className={cn(
          'rpg-label text-gold [text-shadow:0_0_24px_rgba(201,168,76,0.45)]',
          size === 'lg' ? 'text-[2.1rem]' : 'text-[1.3rem]',
        )}
      >
        {children}
      </h1>

      <div className="flex w-full max-w-xs items-center justify-center gap-3">
        <span className="h-px max-w-20 flex-1 bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

        <span className="text-lg text-gold">
          ◇
        </span>

        <span className="h-px max-w-20 flex-1 bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
      </div>
    </div>
  );
}
