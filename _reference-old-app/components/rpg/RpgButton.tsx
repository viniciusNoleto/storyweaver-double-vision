import { Button, ButtonProps } from '@mantine/core';
import { cn } from '@/libs/utils';

// `component`/`href`/`target` não fazem parte de `ButtonProps` (o Button do
// Mantine é polimórfico — esses props vêm do wrapper de polimorfismo, não do
// tipo de props "base"). Declarados aqui manualmente pra RpgButton continuar
// aceitando `component={Link} href="..."` como o Button original aceita.
export interface RpgButtonProps extends Omit<ButtonProps, 'variant' | 'color'> {
  tone?: 'cta' | 'ghost';
  // Button do Mantine é polimórfico (union discriminada gigante por
  // `component`); `any` aqui é o mesmo trade-off que o próprio Mantine
  // documenta pra wrappers deste tipo.
  component?: any;
  href?: string;
  target?: string;
}

// Wrapper visual fino sobre o Button do Mantine — toda a lógica/props do
// Mantine (onClick, loading, disabled, component={Link}, href, etc.)
// continua funcionando via spread; só a aparência é reestilizada. `tone="cta"`
// = botão vermelho sólido de ação primária (estilo "Start the game" da
// referência); `tone="ghost"` = ação secundária, transparente com borda. Ver
// docs/superpowers/specs/2026-08-28-aaa-hud-redesign-design.md.
export function RpgButton({
  tone = 'cta',
  className,
  ...rest
}: RpgButtonProps) {
  return (
    <Button
      variant={tone === 'cta' ? 'filled' : 'outline'}
      color={tone === 'cta' ? 'secondary' : 'gray'}
      className={cn(
        'rpg-label tracking-[0.08em] transition-transform duration-200 hover:-translate-y-0.5',
        tone === 'cta' ? 'border border-gold/50 shadow-[0_4px_16px_rgba(0,0,0,0.4)] hover:shadow-[0_6px_20px_rgba(201,168,76,0.25)]' : 'border-white/20 text-parchment/80',
        className,
      )}
      {...rest}
    />
  );
}
