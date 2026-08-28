import Color from 'color';

// Cores-base do anel de vida (Tela de Exibição). Únicas cores consumidas por
// `resources/character/models/HealthColor.ts` — ver fórmula em
// `.claude/rules/table-concept.md` seção 2. Escolhidas para ler claramente como
// "perigo / atenção / seguro" à distância (projetor/TV), por isso ficam
// deliberadamente separadas da paleta de UI abaixo (não são douradas/vinho).
export const RED = '#C0392B';
export const YELLOW = '#F1C40F';
export const GREEN = '#27AE60';

// Cor do cristal de mana (Mestre + Exibição — ver `resources/character/models/Character.ts`
// para a exceção de privacidade documentada). Assim como RED/YELLOW/GREEN,
// deliberadamente isolada da paleta de UI dourada/vinho abaixo — não passa por
// `colorVariations()`, é usada como valor literal (arbitrário no Tailwind) em
// `ManaCrystals.tsx`. Escolhida para ler como "cristal mágico azul" com
// contraste forte sobre `DARK_BG`/`BOARD_BG`/`PANEL_BG`.
export const MANA_BLUE = '#2E86C1';
export const MANA_BLUE_LIGHT = '#6FB7E8'; // glow / hover / estado "cheio brilhante"

// Paleta de UI — repaginada para seguir a identidade visual de
// `~/personal/contosecantosvilgard` (dourado sobre fundo quase-preto, sem
// alternância claro/escuro — ver decisão registrada em
// `.claude/rules/table-concept.md` seção 6, bloco "Redesign visual"). Dourado é
// a cor de destaque dominante (títulos, bordas, botões); vinho ("blood") marca
// perigo/ênfase forte; arcano é um acento místico raro; a rampa `ACCENT` vira a
// família de superfícies escuras (painéis, badges, bordas tracejadas).
export const PRIMARY_COLOR = '#C9A84C'; // dourado (gold)
export const PRIMARY_LIGHT = '#E8C96A'; // dourado claro (gold-light) — glow, hover, texto de destaque
export const SECONDARY_COLOR = '#8B1A1A'; // vinho (blood) — perigo, ênfase forte
export const TERTIARY_COLOR = '#4A1A6B'; // arcano (arcane) — acento místico raro
// Rampa de superfícies escuras (ink/couro) — painéis, cards, bordas tracejadas.
export const ACCENT_COLOR = '#3D2B1A';

// Fundo base das telas (quase-preto, "vilgard") e duas superfícies elevadas
// (tabuleiro e painel/card) — usados como valores literais fora da rampa
// `colorVariations` porque compõem gradientes/vinhetas em `app/globals.css`,
// não classes Tailwind de uma escala.
export const DARK_BG = '#0D0A06';
export const BOARD_BG = '#1C140D';
export const PANEL_BG = '#241A12';

// Cor de texto padrão sobre o fundo escuro (tom pergaminho, nunca branco puro
// — mesma decisão do projeto de referência).
export const PARCHMENT = '#E8D5A3';

// Painel "de papel" — alterna com o painel "de vidro" (glass, via
// PANEL_BG/BOARD_BG acima), mesmo padrão da referência do rework AAA HUD
// (ver docs/superpowers/specs/2026-08-28-aaa-hud-redesign-design.md):
// Collaboration Offer é pergaminho, Character Creator é vidro escuro.
export const PARCHMENT_BG = '#E8D9B8';
// Texto sobre PARCHMENT_BG — nunca PARCHMENT (claro) sobre PARCHMENT_BG
// (claro sobre claro), precisa de um tom escuro próprio.
export const INK_TEXT = '#2A1D12';

export const PRIMARY_COLOR_PALETTE = colorVariations(PRIMARY_COLOR);
export const SECONDARY_COLOR_PALETTE = colorVariations(SECONDARY_COLOR);
export const TERTIARY_COLOR_PALETTE = colorVariations(TERTIARY_COLOR);
export const ACCENT_COLOR_PALETTE = colorVariations(ACCENT_COLOR);

function lighten(hex: string, amount: number): string {
  return Color(hex).lighten(amount).hex();
}

function darken(hex: string, amount: number): string {
  return Color(hex).darken(amount).hex();
}

export function colorVariations(color: string) {
  return {
    50: lighten(color, 0.5),
    100: lighten(color, 0.4),
    200: lighten(color, 0.3),
    300: lighten(color, 0.2),
    400: lighten(color, 0.1),
    500: color,
    600: darken(color, 0.1),
    700: darken(color, 0.2),
    800: darken(color, 0.3),
    900: darken(color, 0.4),
    950: darken(color, 0.5),
  };
}
