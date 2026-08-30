# Reset visual do Storyweaver — porte do canvas "Contos e Cantos de Vilgard"

Data: 2026-08-30

## Contexto

O projeto Storyweaver (mecânicas de mesa de RPG: criação/gestão de personagens,
tempo real via SSE, Tela do Mestre, Tela de Exibição) já está completo e
funcional em termos de lógica/backend, mas com um visual ("Vilgard" —
pergaminho/dourado sobre madeira escura, ver `table-concept.md`) que o usuário
decidiu abandonar. Em paralelo, o usuário desenhou do zero, no Claude Design,
um protótipo estático completo (`Site RPG com painéis interativos/Storyweaver.dc.html`)
cobrindo as mesmas funcionalidades, com uma estética "AAA HUD" diferente
(dourado/vinho sobre madeira escura, `Cinzel`+`EB Garamond`, cartas com flip
3D, animações de condição elaboradas).

**Princípio orientador (não negociável):** o canvas manda 100% nas decisões
de UI/UX. Onde o canvas divergir do comportamento/schema atual do app, o
backend é adaptado ao canvas — nunca o contrário. O código de UI do canvas
(HTML/CSS/JS) já está escrito e testado visualmente; ele deve ser **portado
quase literalmente** para React/Tailwind (mesmas classes, mesmos keyframes,
mesma estrutura), nunca reinterpretado/redesenhado do zero a partir da
"lembrança" do que ele faz. Only a "cola" muda: estado mock local
(`localStorage`, arrays hardcoded) é substituído por dados/mutations reais
(hooks, services, API routes já existentes).

## Objetivo

Reconstruir a camada de apresentação inteira do Storyweaver a partir do
canvas, mantendo 100% da lógica de backend/dados já construída (auth do
Mestre, SSE, CRUD de personagem/mesa, cálculo de cor de vida, wizard de
classe/espécie/origem, upload de imagem, personagens salvos), adaptando
schema/API apenas nos pontos onde o canvas exige um comportamento diferente
do atual.

## Fora de escopo

- Qualquer funcionalidade nova que não exista nem no app atual nem no canvas.
- Deploy/infra (docker-compose, CI) — só muda se a reestruturação de pastas
  exigir ajuste de caminho.
- Sistema de Magias/Ferramentas (removido deliberadamente numa etapa anterior
  do projeto e ausente do canvas — continua fora).

## Reestruturação do repositório (Fase 0)

O código Next.js atual (frontend **e** backend juntos) é movido inteiro para
uma pasta de referência somente-leitura, e só as peças de backend puro voltam
para a raiz — a raiz fica então livre para a UI nova ser construída do zero,
portada do canvas.

1. `git mv` de todo o conteúdo atual relevante (`app/`, `resources/`, `db/`,
   `libs/`, `shared/`) para `_reference-old-app/<mesmo caminho>` — preserva
   histórico. Esta pasta nunca mais é servida/importada pelo Next.js; existe
   só para eu consultar contratos exatos (payload de rota, assinatura de
   hook/service) enquanto porto a UI nova.
2. Movidos de volta para a raiz, **sem nenhuma alteração de conteúdo** (só de
   caminho): `db/` inteiro, `app/api/**` inteiro, `libs/session.ts`,
   `libs/tableAuth.ts`, `libs/realtime.ts`, `resources/*/services/`,
   `resources/*/models/`, `resources/*/enums/`, `shared/`. Depois desse
   passo, a raiz tem um Next.js funcional (API respondendo, banco migrável)
   sem nenhuma página ou componente visual.
3. Arquivos de configuração (`package.json`, `next.config.ts`, `tsconfig.json`,
   `tailwind.config.mjs`, `postcss`, `.claude/rules/*`, `AGENTS.md`) ficam na
   raiz e são ajustados durante as fases seguintes (fontes, tema Tailwind,
   novas regras de componente se fizer sentido).
4. Assets do canvas usados pela UI (`assets/mountain-bg.png`,
   `assets/table-bg.jpg`, `assets/chain.png`) são copiados para `public/`.
   Uploads de teste do canvas (`uploads/*.png`) não são copiados — são
   conteúdo de dev do protótipo, não asset de produto.
5. `Site RPG com painéis interativos/` continua existindo como está — é a
   fonte de onde o código é portado. Ao final de tudo, pergunto ao usuário se
   quer apagar ou manter.

## Mudanças de schema/dados (canvas manda)

Aplicadas via migration Drizzle antes de reconstruir a Tela do Mestre.

1. **Posicionamento livre**: `characters.zone_id` (fk pra `table_zones`) é
   removido; voltam `characters.position_x`/`characters.position_y`
   (integer, em pixels no espaço do tabuleiro). Tabela `table_zones` é
   removida. Drag é feito inteiramente no client com pointer events; o snap
   de 60px (`Math.round(p/60)*60`) acontece no client ao soltar, e só a
   posição final vai num `PATCH`.
2. **6 condições em vez de 4**: `EStatusEffect` ganha `DORMINDO` e
   `ENFEITICADO`, além das 4 existentes (`ATORDOADO`, `ENVENENADO`, `PRESO`,
   `SANGRANDO`). Cada uma tem sua animação própria (ver seção Tela do
   Mestre).
3. **Tipo do personagem em 3 valores**: o canvas trata `type` como
   `'PC' | 'NPC' | 'Monstro'` num campo único, substituindo o par atual
   `kind` (character/npc) + implícito "é vida/hp real". `EPersonagemTipo`
   novo (ou renomeia `ECharacterKind` existente) com os 3 valores. Personagens
   `Monstro` funcionam como PC/NPC em tudo (hp, mana, condições) — é só uma
   etiqueta visual/organizacional (cor do badge de tipo), sem regra de jogo
   diferente.
4. **Vida extra**: sem mudança — `extra_hp` já existe e bate exatamente com o
   `tempHp` do canvas (abate de dano primeiro, sem teto, editável livre).
5. **Wizard (classe/espécie/origem)**: sem mudança de schema — `classes`,
   `species`, `origins` já batem com os dados hardcoded do canvas
   (`SPECIES`/`CLASSES`/`ORIGINS`/`CLASS_RESOURCES` no script do canvas são os
   mesmos dados já seedados via `seedRules.ts`). Só a UI do wizard muda.
6. **Mana**: sem mudança — `has_mana`/`mana_current`/`mana_max` já modelam os
   "cristais de mana" do canvas (`manaPips`), visíveis nas duas telas como já
   é hoje.

## Design system (fundação visual)

- Fontes via `next/font/google`: `Cinzel` (headings, pesos 500/600/700) +
  `EB Garamond` (corpo, itálico incluso) — substituem `Cinzel`/`Crimson Text`
  atuais.
- Paleta como variáveis CSS (`:root` em `globals.css`, copiadas 1:1 do
  canvas): `--bg`, `--bg2`, `--bg3`, `--gold`, `--gold-light`, `--gold-dim`,
  `--maroon`, `--maroon-light`, `--text`, `--text-dim`, `--text-faint`,
  `--border`, `--mana-blue`. Tailwind config ganha essas cores como tokens
  (`bg-vg-panel`, `text-vg-gold`, etc.) para uso em `className`; os
  `box-shadow`/`animation` complexos (glow, flip, breathe, dano/cura) ficam em
  CSS puro (módulo CSS ou `globals.css`), copiados literalmente do canvas —
  não recriados via utilitário Tailwind.
- Ícones: `@phosphor-icons/react` (equivalente React do `@phosphor-icons/web`
  usado no canvas) — mesmos nomes de ícone (`ph-fill ph-sword` → `<Sword weight="fill">`).
- Mantine: **removido de todas as páginas/componentes novos**. Não é
  desinstalado do `package.json` nesta spec (baixo risco, zero custo), mas
  nenhum arquivo novo importa de `@mantine/*`. Primitivas próprias, uma por
  arquivo, seguindo o CSS do canvas exatamente:
  - `Button` (`.btn`/`.btn-primary`/`.btn-ghost`/`.btn-danger`)
  - `Field` (`.field`, input/select/textarea genérico)
  - `IconButton` (`.icon-btn`)
  - `Switch` (`.switch`/`.switch-track`/`.switch-dot`)
  - `Modal` (`.card-modal-backdrop`/`.card-modal-box`, com variante
    `fullscreen`)
  - `Chip`/`ChipButton` (condições, perícias do wizard)
- `useValidatedFormState`/Yup **não é usado** nesses formulários novos — o
  canvas não tem validação declarativa, só checks simples (`disabled` em
  botão de continuar). Segue o mesmo padrão do canvas: estado local +
  validação inline no `onClick`/`disabled`.

## Telas

### Home (`app/page.tsx`)

Tela única: ícone + título "Contos e Cantos de Vilgard" + subtítulo em
itálico + botão "Iniciar" → `/mesas`. Fundo com glow radial dourado
(`.home-glow`) sobre a textura de montanha.

### Mesas (`app/mesas/page.tsx`)

Grid de cards (`.tables-board`, `auto-fill minmax(280px,1fr)`). Cada card:
nome da mesa, contagem de personagens, botão excluir, botões "Mestrar"
(`/mesa/[code]/mestre`) e "Exibir" (`/mesa/[code]/exibicao`, nova aba).
Formulário "Nova mesa" inline (`.add-form`, dashed border) em vez de modal.
Usa `getTablesService`/`createTableService`/`deleteTableService` já
existentes (voltam pra raiz na Fase 0 sem alteração).

### Tela do Mestre (`app/mesa/[code]/mestre/page.tsx`)

- **Topbar**: voltar, nome da mesa editável inline, slider de zoom das
  cartas (55%–115%, `.zoom-slider`), botão "Abrir telão" (nova aba pra
  Exibição), botão "Nova carta" (abre wizard).
- **Tabuleiro livre** (`.board.gm-canvas`): fundo com grade pontilhada de
  60px só durante o drag (`.is-dragging`). Cada carta é `position:absolute`
  em `position_x`/`position_y`, com `move-handle` (aparece no hover) pra
  iniciar o drag; solta com snap de 60px, manda `PATCH` só na soltura.
- **Carta com flip 3D** (`rpg-flip-inner`/`.flipped`, `perspective`,
  `rotateY(180deg)`), clicável pra virar:
  - **Frente**: retrato preenchendo o card, borda com cor/glow de vida
    (`hpBreathe` — respiração contínua na cor do anel), badge de tipo
    (PC/NPC/Monstro), cristais de mana (clicáveis pra ajustar rápido),
    nome, e — só no hover — 4 ícones de ação (Dano/Cura/Vida extra/Estado)
    que abrem os modais. Efeitos de condição inteiramente na frente:
    atordoado = wobble + órbita de 3 estrelas girando; envenenado = gás
    verde subindo + ícones de caveira/radioativo; preso = correntes
    (`chain.png`) sobrepostas + imagem congelada/escurecida; sangrando =
    gotas de sangue escorrendo + strobe vermelho sutil; dormindo = "Zzz"
    subindo + brilho reduzido; enfeitiçado = swirl cônico colorido +
    hue-rotate/warp contínuo na imagem. `hp <= 20%` ativa pulso de perigo
    (borda vinho pulsante + caveira semi-transparente central); `hp <= 0`
    = grayscale.
  - **Verso**: retrato pequeno + nome + tipo + botão editar; barras de
    Vida e Mana com número; grid de 7 atributos com ícone; chips de
    condição (removíveis); rodapé com os 4 ícones de ação + switch de
    visibilidade + excluir.
  - Ao lado da carta virada (hover), "abas de classe" (`.class-tabs`)
    mostram os recursos da classe (dano curto/médio/longo, defesa,
    recuperar fôlego) — dados hoje já modelados como `extra_resources` da
    classe.
  - Animações de feedback: dano = shake horizontal + flash vermelho; cura =
    brightness pulse + flash verde; mana ganho/perdido = pulse + glow
    azul/roxo nos cristais — todas via CSS, disparadas por uma classe
    temporária (`fx-damage`/`fx-heal`/`fx-mana-gain`/`fx-mana-loss`) que
    dura ~500-650ms (mesmo padrão do `activeEffect` do
    `DisplayToken`/`MasterToken` atuais — a técnica de "key para
    remontar" já usada no app é reaproveitável aqui).
- **4 modais de ação** (substituem o `CharacterActionsPanel` único de hoje):
  Dano, Cura, Vida extra (adicionar/remover), Estado (grid 2 colunas com as
  6 condições, toggle on/off por clique). Cada um é um `.card-modal-box`
  compacto ancorado perto da carta (não fullscreen).
- **Modal de edição em 3 páginas** (`.card-modal-box.fullscreen.edit-wide`):
  1) Identidade (tipo, vida máx., mana máx., espécie/classe/origem, upload
  de retrato via `image-slot` → componente próprio reaproveitando
  `uploadCharacterImageService`); 2) Atributos (grid 2 colunas, 7 inputs
  numéricos); 3) Perícias (até 3, pills) + equipamento inicial (radio
  cards) — dados que hoje já existem como `skill_proficiency_choice`/
  `equipment_choice` da classe.
- **Wizard de criação** (fullscreen modal, `.wiz-box`): Escolher
  alvo (Personagem/NPC) → [NPC: nome+foto direto] / [Personagem: nome+foto →
  Espécie (8 cards com ícone+info) → Classe (9 cards) → Escolhas de classe
  (perícias+equipamento, só se a classe tiver escolha) → Origem (8 cards +
  "criar customizada") → bônus de atributo da origem → resumo com preview
  de mini-carta frente/verso + recursos de classe → criar]. Mesmo motor que
  o `CharacterWizard.tsx` de referência já resolve (`classHasChoices`,
  `calculateAttributes`), só a casca visual muda; "Usar um personagem
  salvo" reaproveita `character_templates`/`CharacterTemplatePicker` de
  referência.

### Tela de Exibição (`app/mesa/[code]/exibicao/page.tsx`)

Grid (`.display-front-grid`) só com a **frente** da carta, travada (sem
flip, sem hover de ações) — nenhum HP numérico, nenhuma interação, mesma
garantia de privacidade que hoje (`?view=display`, payload sem
`hp_current`/`hp_max`/`attributes`/etc.). Chips de condição abaixo de cada
carta em vez de dentro dela. Mensagem "Aguardando a Esperança se erguer
sobre Vilgard…" quando não há personagem visível.

## Reaproveitamento de backend (o que NÃO muda)

- `useTableStream` (SSE) — mesmo hook, só o consumo visual dos eventos
  muda.
- `HealthColor.ts` (fórmula de cor de vida) — reaproveitado tal como está.
- Auth do Mestre via cookie (`getCurrentMaster`), rotas de API, serviços
  (`get/create/update/deleteCharacter`, `get/create/renameTable`, upload de
  imagem, `character_templates`, `classes`/`species`/`origins`) — todos
  voltam pra raiz na Fase 0 sem alteração de assinatura. Onde o payload
  precisa mudar (posição x/y, tipo PC/NPC/Monstro, 6 condições), ajusto a
  rota/model junto da migration de schema, mantendo o resto do contrato
  intacto.

## Fases de execução

1. Reestruturação do repositório (git mv + volta do backend puro pra raiz).
2. Migração de schema (position_x/y, 6 condições, tipo PC/NPC/Monstro) +
   ajuste dos models/rotas afetados.
3. Fundação visual: tokens/fontes/globals.css + primitivas (`Button`,
   `Field`, `IconButton`, `Switch`, `Modal`, `Chip`).
4. Tela do Mestre completa (tabuleiro, carta flip, 4 modais de ação, modal
   de edição em 3 páginas, wizard de criação).
5. Home + Mesas.
6. Tela de Exibição.
7. Verificação end-to-end (fluxo completo via Playwright real: criar mesa →
   criar personagem via wizard → mover no tabuleiro → dano/cura/mana/vida
   extra com animação → aplicar condição e ver efeito visual → abrir
   Exibição em outra aba e confirmar frente travada sem números → grep de
   payload confirmando ausência de campos proibidos).

## Riscos / pontos de atenção

- Sem `sudo` no ambiente de teste, Playwright headless precisa da mesma
  técnica de extrair `.so` via `apt-get download`/`dpkg-deb` já usada em
  etapas anteriores do projeto.
- `image-slot` custom element do canvas (crop/zoom de retrato) não existe
  em React — precisa de um componente próprio equivalente (upload + preview
  + reposicionar), reaproveitando `uploadCharacterImageService` já pronto;
  fica dentro da Fase 4 (parte do modal de edição/wizard).
- Migrations do Drizzle neste projeto historicamente precisam de aplicação
  manual via `psql` (bug documentado de `MAX(created_at)` — ver
  `_reference-old-app/table-concept.md`) — mesma mitigação de sempre.
