// Tokens não-cor da identidade visual (RPG de mesa). Aplicados na etapa 5 via
// `next/font/google` (ver `libs/fonts.ts`) + tema do Mantine
// (`libs/mantine/mantine-theme.ts`) + `app/globals.css`. Mantenha estes nomes
// em sincronia com `libs/fonts.ts` se trocar alguma fonte no futuro.

// `FONT_DISPLAY` — títulos/cabeçalhos ("Storyweaver", nome da Mesa, headers).
export const FONT_DISPLAY = 'Cinzel';

// `FONT_BODY` — decisão da etapa 5: trocado de `MedievalSharp` (previsto pelo
// placeholder da etapa 2) para `Crimson Text`. MedievalSharp é decorativa
// demais para blocos de texto (rótulos de formulário, parágrafos) — atrapalha
// a leitura em tamanhos pequenos, exatamente o risco que a etapa 2 já
// sinalizava. `Crimson Text` é uma serif humanista com leve sabor de
// pergaminho antigo e permanece legível em qualquer tamanho.
export const FONT_BODY = 'Crimson Text';

// `FONT_ACCENT` — nova, etapa 5. É a `MedievalSharp` original, remanejada para
// acentos pequenos e pontuais (selo/emblema da Home, badge do código da Mesa)
// em vez de texto de corpo.
export const FONT_ACCENT = 'MedievalSharp';

export const RADIUS = {
  sm: '4px',
  md: '8px',
  lg: '16px',
  round: '9999px', // fichas circulares de personagem
};

export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
};
