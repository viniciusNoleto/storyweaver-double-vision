# Rework visual "AAA HUD" — Home + /mesas (piloto)

Data: 2026-08-28
Contexto: a pedido do usuário, um rework visual não-conservador de toda a aplicação, inspirado numa referência de UI de jogo de estratégia (Crusader Kings/Total War-like — imagem fornecida: "Character Creator", "Strategy Choose Window", "Collaboration Offer"). Este documento cobre a primeira fatia — a tela piloto (Home + `/mesas`) — que estabelece o design system novo a ser reaproveitado nas telas seguintes (Wizard, Tela do Mestre, Tela de Exibição), cada uma com seu próprio spec futuro.

## Objetivo

Elevar a produção visual do app pro nível "jogo AAA de estratégia" — não um re-skin de cor, uma reestruturação de como painéis, cards, títulos e botões são construídos — seguindo a referência **à risca** (decisão explícita do usuário, escolhendo a abordagem "AAA HUD" sobre um meio-termo que preservasse mais da identidade Vilgard atual).

## Decisões já confirmadas com o usuário

- Escopo desta etapa: só visual/interação. Lógica e fluxos atuais continuam os mesmos — mas mudanças de UX são permitidas SE o novo visual pedir (ex.: um padrão de carrossel sugerindo uma navegação diferente) — não é proibido, só não é o foco.
- Pode construir componentes customizados por cima ou no lugar do Mantine puro, onde for necessário pra atingir o nível visual da referência — Mantine continua por baixo só pra lógica de formulário/modal/acessibilidade.
- Tela piloto: **Home (`app/page.tsx`) + `/mesas` (`app/mesas/page.tsx`)** juntas — é o mesmo fluxo de entrada e dá superfície suficiente pra validar os componentes novos (cards, botões, listas) antes de espalhar pro resto do app.
- Arte: o agente resolve texturas sozinho (CSS/SVG, sem asset externo). Se precisar de arte de personagem ou de paisagem/mundo (pintada, temática), pede ao usuário antes de prosseguir — não deve inventar/gerar essas por conta própria.
- Paleta/tipografia podem mudar livremente pra bater com a referência, mesmo que isso afaste da identidade Vilgard atual — mas ver análise abaixo: a paleta atual já está estruturalmente perto (dourado + vinho + quase-preto), então a mudança é mais de **construção/textura/hierarquia** do que de matiz.

## Análise da referência (características que se repetem nas 3 telas da imagem)

- Tipografia serifada dourada em versalete pros títulos de seção, com divisor ornamental (◇ entre linhas finas).
- Fundo sempre escuro, com vinheta e textura pintada — nunca chapado.
- Dois "materiais" de painel que se alternam: vidro escuro semi-transparente (HUD, Character Creator) e pergaminho/papel envelhecido (Collaboration Offer, cards de estratégia).
- Cards em carrossel com um item central maior/elevado = selecionado; vizinhos menores e mais escuros.
- Selo/brasão heráldico como elemento decorativo; banners em fita vermelha pra títulos de destaque.
- Botão CTA sólido vermelho vs. botão fantasma/outline pra ação secundária.

## Paleta e tipografia

`shared/constants/colors.ts` ganha 2 tokens novos, mantendo todos os existentes:

```ts
// Painel "de papel" — alterna com o painel "de vidro" (glass, já existente
// via PANEL_BG/ACCENT), mesmo padrão da referência (Collaboration Offer é
// pergaminho, Character Creator é vidro escuro).
export const PARCHMENT_BG = '#E8D9B8';
export const INK_TEXT = '#2A1D12'; // texto sobre PARCHMENT_BG (nunca PARCHMENT claro sobre claro)
```

Tipografia: mantém `FONT_DISPLAY` (Cinzel) e `FONT_BODY` (Crimson Text) — já batem com o estilo da referência. `FONT_ACCENT` (MedievalSharp) **deixa de ser usada em texto novo** (destoa da referência) — os usos existentes (selo da Home, badge de mesa) migram pro tratamento "small-caps rastreado" descrito abaixo. Não remove a fonte do projeto (ainda pode ter uso residual em algo não tocado nesta etapa), só para de ser a escolha para elementos novos.

**Tratamento "label ornamental"** (substitui o uso de `font-accent` em títulos de seção): `text-transform: uppercase`, `letter-spacing: 0.15em`-`0.3em`, `font-family: var(--font-display)`, cor dourada, tamanho pequeno (`0.65rem`-`0.8rem`) — é o mesmo tratamento de "USER INTERFACE"/"CHARACTER CREATOR" na referência, só usando a fonte display já existente no projeto em vez de uma fonte nova.

## Componentes novos — `components/rpg/`

Pasta nova (não existe hoje nenhuma pasta de componentes genéricos/cross-cutting no projeto — tudo vive em `resources/{module}/components/`, atado a um domínio). Estes componentes não pertencem a nenhum resource, então ficam em um top-level novo, irmão de `resources/`/`app/`/`libs/`.

### `components/rpg/RpgPanel.tsx`

```tsx
type RpgPanelVariant = 'glass' | 'parchment';

interface RpgPanelProps extends React.ComponentPropsWithoutRef<'div'> {
  variant?: RpgPanelVariant; // default 'glass'
  glow?: boolean; // borda com leve glow dourado pulsante — default false
}
```

- `glass`: fundo `rgba(28,20,13,0.72)` (baseado em `BOARD_BG`) + `backdrop-filter: blur(8px)`, borda 1px dourada translúcida (`rgba(201,168,76,0.35)`), cantos com pequenas cantoneiras decorativas (`::before`/`::after` ou 4 `<span>` absolutos com ícone Iconify `lucide:diamond` nos 4 cantos — decisão de implementação: usar CSS puro com `border-image` ou pseudo-elementos, sem imagem externa).
- `parchment`: fundo `PARCHMENT_BG` com leve textura de grão (mesmo SVG `feTurbulence`, cor invertida pro tom papel), texto `INK_TEXT`, borda marrom escura fina, sombra interna sutil simulando papel physical.
- `glow`: quando true, aplica uma animação `motion` de `boxShadow` pulsando entre dois estados dourados (mesma técnica já usada em `DisplayToken.tsx` pro anel de vida) — reservado pra elementos de destaque (ex.: o selo da Home).

### `components/rpg/RibbonHeading.tsx`

```tsx
interface RibbonHeadingProps {
  children: React.ReactNode; // texto do título
  size?: 'lg' | 'md'; // default 'md'
}
```

Título em `font-display`, uppercase, cor dourada, com um divisor ornamental (◇ entre duas linhas com gradiente, reaproveitando o padrão já existente em `app/page.tsx` — extraído pra componente reutilizável em vez de inline). `size="lg"` é maior, pra títulos de página (Home); `size="md"` pra cabeçalhos de seção (`/mesas`).

### `components/rpg/RpgButton.tsx`

```tsx
interface RpgButtonProps extends Omit<ButtonProps, 'variant' | 'color'> {
  tone?: 'cta' | 'ghost'; // default 'cta'
}
```

Wrapper fino sobre o `Button` do Mantine (mantém toda a lógica/acessibilidade dele — `onClick`, `loading`, `disabled`, `component={Link}`, etc. continuam funcionando via prop spread). Só reestiliza a aparência:
- `cta`: gradiente vermelho escuro→vinho (`SECONDARY_COLOR` como base), borda dourada fina, uppercase rastreado, sombra elevada; hover = leve `translateY(-2px)` + brilho dourado na borda (via `motion.div` wrapper ou CSS `transition`, decisão do implementador — CSS puro é suficiente aqui, não precisa de `motion` pra um hover simples).
- `ghost`: transparente, borda cinza/dourada translúcida, texto claro — pra ação secundária ("Voltar", "Cancelar").

### `components/rpg/RpgCard.tsx`

```tsx
interface RpgCardProps extends React.ComponentPropsWithoutRef<'div'> {
  featured?: boolean; // estado "selecionado/em destaque" — default false
}
```

Card com cantoneiras douradas ornamentais nos 4 cantos (mesma técnica de `RpgPanel`), hover com elevação (`translateY` + sombra + brilho de borda intensificado, via `motion.div` com `whileHover`). `featured=true` aplica o estado permanentemente (borda mais grossa/brilhante, leve escala maior) — é a base do padrão "card central em destaque" da referência, que será usado no carrossel de Espécie/Classe/Origem do Wizard numa etapa futura; nesta etapa (Home/`/mesas`) o prop existe mas não é usado ainda (nenhum card da tela piloto tem estado "featured").

## Home (`app/page.tsx`)

- Fundo: mantém a técnica de `app/globals.css` (vinheta + grão `feTurbulence`) — sem arte nova.
- Substituir o card único atual por: `RibbonHeading size="lg"` com "STORYWEAVER", selo circular central evoluído (anéis concêntricos dourados concêntricos, glow pulsante via `RpgPanel glow` ou animação própria — reaproveita o ícone `lucide:scroll-text` já usado), texto de apoio em `font-body` itálico, CTA "Iniciar" como `RpgButton tone="cta"`.
- O "rune band" (faixa de texto rolante ✦ STORYWEAVER ✦...) e o texto rodapé ("Sua mesa, suas fichas, sua lenda") mantêm a ideia mas migram pro tratamento de label ornamental descrito acima (em vez de `font-accent`).
- Toda a composição entra com `motion` (fade + leve scale-up, ~400ms, easing suave) ao montar.

## `/mesas` (`app/mesas/page.tsx`)

- Cabeçalho: `RibbonHeading size="md"` com "Mesas" (substitui o `<Title>` atual); botão "Voltar" vira `RpgButton tone="ghost"`.
- "Nova mesa": `RpgButton tone="cta"`, full width, mantém o ícone `lucide:dices`.
- Cada mesa da lista: `RpgCard` no lugar do `Card` do Mantine — nome da mesa em `font-display` dourado (já é assim), código da mesa como um pequeno "selo" (badge com borda dourada, `font-display` uppercase rastreado, no lugar do texto solto atual). Botões "Mestrar"/"Visualizar" mantêm os ícones/links atuais, só re-estilizados via `RpgButton` (Mestrar = `cta` menor, Visualizar = `ghost`). Menu de 3 pontinhos mantém `Menu` do Mantine (não precisa reconstruir — é um dropdown funcional, não uma peça "hero" da referência), só o `Menu.Dropdown` ganha o visual `glass` (via `styles` do Mantine, reaproveitando o token novo).
- Modais (Criar mesa, Renomear, Excluir) — `CreateTableLogicComponent`/`RenameTableLogicComponent`/`DeleteTableLogicComponent` continuam com a MESMA lógica (`useMutation`, validação, etc.); só o `Modal` do Mantine que os envolve ganha o visual `glass` via `styles` (mesmo padrão já usado em `Modal` no tema global — só reforça/ajusta pra bater com `RpgPanel`).
- Lista vazia ("Nenhuma mesa criada ainda"): ganha um ícone/flourish decorativo acima do texto (ex.: `lucide:scroll` grande e semi-transparente), não fica só texto solto.
- Entrada da lista: cada `RpgCard` anima com um leve fade+slide stagger (via `motion`, delay incremental por índice) ao carregar.

## Fora de escopo (consciente)

- Wizard de criação de personagem, Tela do Mestre, Tela de Exibição — ficam pro próximo spec, reaproveitando `components/rpg/*` já prontos.
- Nenhuma arte pintada/ilustrada nova nesta etapa (Home/`/mesas` não têm "personagem" ou "cena" — são telas de navegação, não precisam).
- Carrossel de card com destaque central (`RpgCard featured`) só ganha USO real na etapa do Wizard — aqui só o componente já nasce com o prop pronto.
- Sistema de partículas/efeitos 3D, parallax de mouse, ou qualquer coisa que exija WebGL/canvas — mantém tudo em CSS/`motion` (DOM), consistente com o resto do projeto.

## Verificação esperada

`npx tsc --noEmit` e `npm run lint` limpos (zero erros, mesmos 4 warnings pré-existentes). Teste manual via `claude-in-chrome`/Playwright: Home carrega com o novo visual, CTA leva pra `/mesas`; `/mesas` lista mesas existentes com o novo card, criar/renomear/excluir mesa continuam funcionando (a lógica não muda, só o invólucro visual); responsividade básica (mobile/desktop) não quebra.
