import {
  PRIMARY_COLOR_PALETTE,
  SECONDARY_COLOR_PALETTE,
  TERTIARY_COLOR_PALETTE,
  ACCENT_COLOR_PALETTE,
  PRIMARY_COLOR,
  PRIMARY_LIGHT,
  DARK_BG,
  BOARD_BG,
  PANEL_BG,
  PARCHMENT,
  PARCHMENT_BG,
  INK_TEXT,
} from './shared/constants/colors';

// Redesign visual (ver `.claude/rules/table-concept.md` seção 6, bloco
// "Redesign visual"): além das rampas `primary`/`secondary`/`tertiary`/`accent`
// (agora dourado/vinho/arcano/ink), expõe os tokens planos do projeto de
// referência (`gold`, `gold-light`, `vilgard`, `board`, `panel`, `parchment`)
// para uso direto em classes utilitárias com modificador de opacidade (ex:
// `border-gold/40`, `bg-gold/10`) — `primary-500` sozinho não aceita `/40`
// como um token de cor plano aceita — e as famílias de fonte `font-display`/
// `font-body`/`font-accent`, que apontam para as CSS custom properties
// setadas por `libs/fonts.ts` em `app/layout.tsx`.
export default {
  darkMode: ['class', '[data-mantine-color-scheme="dark"]'],
  theme: {
    extend: {
      colors: {
        primary: PRIMARY_COLOR_PALETTE,
        secondary: SECONDARY_COLOR_PALETTE,
        tertiary: TERTIARY_COLOR_PALETTE,
        accent: ACCENT_COLOR_PALETTE,
        gold: PRIMARY_COLOR,
        'gold-light': PRIMARY_LIGHT,
        vilgard: DARK_BG,
        board: BOARD_BG,
        panel: PANEL_BG,
        parchment: PARCHMENT,
        'parchment-panel': PARCHMENT_BG,
        ink: INK_TEXT,
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'Georgia', 'serif'],
        accent: ['var(--font-accent)', 'cursive'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 16px rgba(201,168,76,0.3), inset 0 0 20px rgba(201,168,76,0.05)' },
          '50%': { boxShadow: '0 0 32px rgba(201,168,76,0.5), inset 0 0 24px rgba(201,168,76,0.1)' },
        },
      },
    },
  },
};
