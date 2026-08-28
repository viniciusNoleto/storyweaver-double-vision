import { createTheme, MantineColorsTuple } from '@mantine/core';
import {
  PRIMARY_COLOR_PALETTE,
  SECONDARY_COLOR_PALETTE,
  TERTIARY_COLOR_PALETTE,
  ACCENT_COLOR_PALETTE,
} from '@/shared/constants/colors';
import { FONT_DISPLAY, FONT_BODY, RADIUS } from '@/shared/constants/theme';

// Tema custom do Mantine — redesign visual baseado em
// `~/personal/contosecantosvilgard` (ver `.claude/rules/table-concept.md`
// seção 6, bloco "Redesign visual"). Padrão estrutural copiado de
// `~/personal/cross-poker/libs/matine/mantine-theme.ts` (mesmo truque de
// `Object.values(palette) as MantineColorsTuple` — a paleta tem 11 tons
// (50..950) e o Mantine só usa os 10 primeiros índices, o 950 fica disponível
// só via `var(--mantine-color-xxx-9)`/acesso direto ao token, não atrapalha).
// Cores vêm de `shared/constants/colors.ts` — SÓ os tokens de UI
// (`PRIMARY`/`SECONDARY`/`TERTIARY`/`ACCENT`); as cores do anel de vida
// (`RED`/`YELLOW`/`GREEN`) nunca entram aqui, ficam isoladas em
// `HealthColor.ts`/`DisplayToken.tsx`.
function toMantineTuple(palette: Record<number, string>): MantineColorsTuple {
  return Object.values(palette) as unknown as MantineColorsTuple;
}

// Fontes aplicadas via CSS custom properties setadas por `libs/fonts.ts` em
// `app/layout.tsx` (`--font-display`/`--font-body`). O nome literal da fonte
// entra só como fallback do `var()`, caso o CSS custom property não esteja
// definido por algum motivo (ex.: SSR de um trecho fora do `<html>` com as
// classes de fonte) — no caminho normal quem decide a fonte real é o `next/font`.
const FONT_BODY_STACK = `var(--font-body, '${FONT_BODY}'), Georgia, 'Times New Roman', serif`;
const FONT_DISPLAY_STACK = `var(--font-display, '${FONT_DISPLAY}'), Georgia, serif`;

// Ramp `dark` sobrescrita (índice 0 = mais claro, 9 = mais escuro) — é a
// paleta que o Mantine usa por padrão para `body`, `Paper`/`Card`/`Modal` e
// bordas no color scheme escuro. Como `app/providers.tsx` agora força
// `forceColorScheme="dark"` (redesign: sem alternância clara/escura, ver
// `.claude/rules/table-concept.md` seção 6), sobrescrever esta rampa é o que
// faz TODO componente Mantine (mesmo sem estilização custom) herdar o visual
// "pergaminho sobre madeira escura" em vez do cinza-azulado default do
// Mantine. Índice 7 = fundo de Card/Paper/Modal (== `PANEL_BG`), índice 8/9 =
// fundo de página (== `BOARD_BG`/`DARK_BG`), índice 0 = texto padrão (==
// `PARCHMENT`).
const DARK_INK_TUPLE: MantineColorsTuple = [
  '#E8D5A3', // 0 — texto padrão (parchment)
  '#CBB78C', // 1
  '#A8916C', // 2
  '#8A7355', // 3
  '#6B5842', // 4
  '#4F3F2E', // 5
  '#3D2F22', // 6 — borda default
  '#241A12', // 7 — Card/Paper/Modal (panel)
  '#1C140D', // 8 — fundo de página/tabuleiro (board)
  '#0D0A06', // 9 — mais escuro (vilgard)
];

export const mantineTheme = createTheme({
  primaryColor: 'primary',
  primaryShade: 4,
  colors: {
    primary: toMantineTuple(PRIMARY_COLOR_PALETTE),
    secondary: toMantineTuple(SECONDARY_COLOR_PALETTE),
    tertiary: toMantineTuple(TERTIARY_COLOR_PALETTE),
    accent: toMantineTuple(ACCENT_COLOR_PALETTE),
    dark: DARK_INK_TUPLE,
  },
  fontFamily: FONT_BODY_STACK,
  fontFamilyMonospace: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  headings: {
    fontFamily: FONT_DISPLAY_STACK,
    fontWeight: '600',
  },
  defaultRadius: 'md',
  radius: {
    sm: RADIUS.sm,
    md: RADIUS.md,
    lg: RADIUS.lg,
  },
  components: {
    Button: {
      defaultProps: {
        color: 'primary',
      },
    },
    Card: {
      defaultProps: {
        withBorder: true,
      },
      styles: {
        root: { borderColor: 'rgba(201, 168, 76, 0.22)' },
      },
    },
    Modal: {
      styles: {
        content: { border: '1px solid rgba(201, 168, 76, 0.25)' },
        title: { fontFamily: FONT_DISPLAY_STACK, fontWeight: 600, fontSize: '1.15rem', color: 'var(--mantine-color-primary-3)' },
      },
    },
    Divider: {
      styles: {
        label: { fontFamily: FONT_DISPLAY_STACK, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '0.68rem' },
      },
    },
  },
});
