import { Cinzel, Crimson_Text, MedievalSharp } from 'next/font/google';

// Fontes da identidade visual RPG (etapa 5 — ver `.claude/rules/table-concept.md`
// seção 6, bloco "Acabamento visual (etapa 5)"). Carregadas via `next/font/google`
// (self-hosted no build, sem request externo em runtime) e expostas como CSS
// custom properties (`variable`) aplicadas em `<html>` por `app/layout.tsx`, para
// que qualquer CSS/Tailwind/Mantine no projeto consiga referenciar
// `var(--font-display)` / `var(--font-body)` / `var(--font-accent)` sem precisar
// importar este módulo diretamente.
//
// Nomes canônicos ficam em `shared/constants/theme.ts` (`FONT_DISPLAY`/
// `FONT_BODY`/`FONT_ACCENT`) — mantenha os dois em sincronia se trocar alguma
// fonte no futuro.

export const fontDisplay = Cinzel({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

// `Crimson Text` substitui `MedievalSharp` como fonte de corpo (decisão desta
// etapa): MedievalSharp é decorativa e pouco legível em blocos de texto — ver
// nota já deixada em `theme.ts` pela etapa 2. Crimson Text é uma serif humanista
// com leve sabor antigo, legível em tamanhos pequenos (labels, parágrafos).
export const fontBody = Crimson_Text({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

// MedievalSharp não foi descartada — vira fonte de acento para elementos
// pequenos e muito específicos (selo da Home, badge de código da mesa), nunca
// para parágrafos ou formulários.
export const fontAccent = MedievalSharp({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-accent',
  display: 'swap',
});
