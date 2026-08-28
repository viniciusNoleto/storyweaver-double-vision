# Storyweaver — Conceito e Arquitetura da Mesa de RPG

Este arquivo é a fonte de verdade para qualquer trabalho relacionado à lógica da Mesa (criação, personagens, fichas, tempo real, telas de Mestre/Exibição). Fixa o vocabulário/nomenclatura e as decisões de arquitetura que **todo** código deve seguir.

Este projeto foi criado a partir do `~/personal/cross-poker` (mesma stack Next.js + Drizzle + TanStack Query + Mantine + Tailwind + SSE), mas é um produto totalmente diferente: um **gerenciador de mesa de RPG**, usado pelo Mestre para administrar personagens/fichas durante a sessão, com uma tela pública (projetor/TV) que os jogadores acompanham. **Ignore qualquer estilo visual do cross-poker** (mesa de baralho) — a identidade visual deste projeto é de RPG de mesa: pergaminho, madeira, fichas em formato de carta com moldura, tipografia de fantasia.

---

## 1. Vocabulário oficial e mapeamento para o código

| Termo (conceito) | Código (EN) | Significado |
|---|---|---|
| **Mesa** | `Table` | A sessão/campanha em andamento. Equivalente à Sala do cross-poker, mas é também o conceito central do produto (não há colisão com "meld" aqui — `Table` é o nome correto). |
| **Código da Mesa** | `code` | Identificador curto e público da Mesa, usado nas duas URLs (Mestre e Exibição). |
| **Chave do Mestre** | `master_key` | Segredo gerado na criação da Mesa; autentica o link do Mestre. Só o hash (`master_key_hash`) é persistido. |
| **Ficha / Personagem** | `Character` | Um personagem (jogador ou NPC) representado por uma carta na tela (etapa 10 — antes era um token circular). |
| **Vida** | `hp_current` / `hp_max` | Pontos de vida atuais/máximos. Só aparecem como número na Tela do Mestre — nunca na Exibição. |
| **Vida extra** | `extra_hp` | Bônus de vida separado da vida normal, adicionado/removido livremente pelo Mestre (sem teto próprio). Dano é sempre abatido daqui primeiro; só o excedente desconta de `hp_current`. Entra no numerador E denominador da fórmula de cor (seção 2). Mestre-only, nunca aparece na Exibição — mesma regra de `hp_current`/`hp_max`. |
| **Condições** | `status_effects` (`EStatusEffect[]`) | Desde a etapa 10: conjunto FIXO de 4 estados — atordoado, envenenado, preso, sangrando (`resources/character/enums/StatusEffect.ts`). Cada um tem ícone + animação contínua própria (`StatusEffectBadge.tsx`) enquanto ativo. Sem número associado; aparecem em ambas as telas. |
| **Mana** | `has_mana` / `mana_current` / `mana_max` | Desde a etapa 10: recurso numérico dedicado, opcional por personagem (`has_mana`). Representada visualmente por cristais azuis (`ManaCrystals.tsx`) — os gastos ficam marcados vazios na mesma posição, os não gastos continuam cheios. **Exceção deliberada** à regra de "nenhum número de jogo na Exibição": ao contrário de vida, `mana_current`/`mana_max` aparecem nas DUAS telas (decisão de produto tomada com o usuário nesta etapa — é um efeito visual de contagem, não um número escondido). Ações rápidas via `POST .../characters/[id]/actions` com `type: 'mana-spend'\|'mana-restore'`, clampado 0..mana_max. |
| **Tela do Mestre** | `master view` | `app/mesa/[code]/mestre` — números reais, edição de tudo. |
| **Tela de Exibição** | `display view` | `app/mesa/[code]/exibicao` — pública, só o anel de cor + nome + imagem, nenhum número. |
| **Tabuleiro** | `TableBoard` | Área onde as fichas ficam, organizada em divisões (ver linha abaixo). |
| **Divisão / Espaço** | `TableZone` (tabela `table_zones`) | Coluna do tabuleiro, sempre do mesmo tamanho que as demais (lado a lado). Toda Mesa nasce com 1; o Mestre pode adicionar (até 6) ou remover. Fichas pertencem a exatamente uma divisão (`characters.zone_id`) e se organizam automaticamente centralizadas dentro dela — não existe mais posicionamento livre por pixel/porcentagem. |

No código (rotas, tabelas, enums, interfaces, nomes de arquivo), use os nomes em inglês da coluna "Código". Texto voltado ao usuário final (labels, botões, mensagens) continua em português.

---

## 2. Regras de produto (resumo operacional)

- Não há sistema de contas. Criar uma Mesa gera `code` (público) + `master_key` (mostrado **uma única vez** na criação, dentro do link do Mestre).
- **Link do Mestre**: `/mesa/[code]/mestre?key=[master_key]`. No primeiro acesso com `key` válida, o servidor seta um cookie httpOnly `sw_master_{code}` (mesmo padrão de `cp_session_{roomCode}` do cross-poker) e a partir daí a `key` na URL não é mais necessária. Sem cookie válido, a rota nega qualquer mutação.
- **Link de Exibição**: `/mesa/[code]/exibicao`. Público, sem senha, sem cookie — feito para ser aberto num telão/TV. Só leitura.
- Personagens pertencem a uma **divisão** (`TableZone`/`zone_id`) do tabuleiro — não existe mais posicionamento livre por pixel/porcentagem (`position_x`/`position_y` foram removidos do schema na etapa 8). Divisões ficam sempre lado a lado, sempre do mesmo tamanho entre si (nunca porcentagem calculada manualmente — é `flex: 1 1 0` em cada uma). Toda Mesa nasce com 1 divisão; o Mestre pode adicionar (até 6, ver `MAX_ZONES_PER_TABLE` em `app/api/tables/[code]/zones/route.ts`) ou remover — ao remover, as fichas migram para a divisão vizinha que sobrar (a anterior por `position`; se não houver anterior, a próxima). Dentro de uma divisão, as fichas se auto-organizam centralizadas (flex-wrap), sem controle manual de posição.
- Mestre pode marcar um personagem como `visible: false` para escondê-lo da Exibição (ex.: antes de "revelar" um NPC).
- **Nenhum número de jogo** (hp) pode existir no payload nem no DOM da Exibição — nem mesmo em atributos ocultos, comentários ou `data-*`. Verificação obrigatória na Etapa de verificação final. Exceção documentada: `is_defeated` (booleano `hp_current <= 0`, calculado no servidor) é permitido na Exibição pelo mesmo motivo que `hp_color` já era — é um dado DERIVADO, nunca o número bruto.
- Mestre pode aplicar **dano** ou **cura** a um personagem (`POST /api/tables/[code]/characters/[id]/actions`, body `{ type: 'damage'|'heal', amount }`) — sempre clampado entre `0` e `hp_max`. Isso publica um evento realtime com payload (`character-action`, ver seção 3) para a Tela de Exibição animar a mudança **sem nunca mostrar o valor numérico** (só efeito visual — flash/tremor/brilho); a Tela do Mestre, que já mostra números reais, pode mostrar o valor (`-5`/`+3`) na própria animação.

### Cor do anel de vida (Exibição) — fórmula canônica

Vive em `resources/character/models/HealthColor.ts` — **única implementação**, não reimplementar em componente nenhum.

```
percent = clamp((hp_current + extra_hp) / (hp_max + extra_hp) * 100, 0, 100)
if percent <= 50: t = percent / 50;      color = lerp(RED,    YELLOW, t)
if percent  > 50: t = (percent - 50)/50; color = lerp(YELLOW, GREEN,  t)
```

`extra_hp` (vida extra, ver tabela de vocabulário acima) entra igualmente no numerador e denominador — sem ela (`extra_hp = 0`), a fórmula volta a ser exatamente `hp_current / hp_max`.

Interpolação linear componente-a-componente em RGB (não em HSL — HSL passaria por tons esverdeados/acinzentados indesejados no meio do caminho). Cores-base (`RED`/`YELLOW`/`GREEN`) ficam em `shared/constants/colors.ts`, ajustáveis num único lugar. `percent = 0` → vermelho puro; `50` → amarelo puro; `100` → verde puro; valores entre os pontos são mistura proporcional linear.

---

## 3. Decisões técnicas

### Stack (herdado do projeto base, mantido)
Next.js 16 (App Router, Route Handlers) + React 19 + Drizzle ORM + PostgreSQL + TanStack Query + Mantine 9 (base, tema totalmente customizado) + Tailwind 4 + Yup + i18next (pt-br, es-mx, en-us) + `motion` (transição suave de cor do anel, animações de drag).

### Identidade — sem login, dois papéis
Ver seção 2. Toda rota de mutação usa `libs/tableAuth.ts` (`getCurrentMaster(code)`) para resolver o papel a partir do cookie — **nunca confiar em papel/id vindo do body/query**.

### Tempo real — Server-Sent Events
Mesmo padrão do cross-poker: `libs/realtime.ts` (pub/sub em memória, singleton do processo), canal `` `table:${code}` ``. **Desde a etapa 8**, `publish`/`subscribe` carregam um payload de evento: `publish(channel, event: { type: string; data?: unknown } = { type: 'state-changed' })` — o default sem segundo argumento continua sendo "algo mudou, refaça o fetch" (comportamento de sempre, todo `publish(\`table:${code}\`)` existente continua funcionando sem mudança). O único `type` com payload hoje é `'character-action'` (publicado por `POST .../characters/[id]/actions`, dados: `{ character_id, action: 'damage'|'heal', amount, hp_current, hp_max }`), usado para animar dano/cura na hora, em vez de só disparar um refetch. Rota `app/api/tables/[code]/stream/route.ts` serializa o evento inteiro como `data: JSON.stringify(event)` dentro do mesmo nome de evento SSE `state-changed` (não criou nome novo). `useTableStream(code, { onCharacterAction? })` sempre chama `refetch()` e, se o evento for `character-action`, também invoca `onCharacterAction` — quem não passar essa opção mantém o comportamento antigo. Toda rota que muda personagens/mesa continua chamando `publish(\`table:${code}\`)` no final (com ou sem payload, conforme o caso).

### Redação de privacidade — uma única fonte, dois payloads
`GET /api/tables/[code]` é a **única** rota de snapshot. Ela resolve o papel via cookie e decide o formato de resposta:
- **Mestre**: inclui `hp_current`, `hp_max` de cada personagem.
- **Exibição** (sem cookie de Mestre válido): omite completamente `hp_current`/`hp_max`; inclui só `hp_color` (resultado já calculado de `HealthColor.ts`, no servidor) e `status_effects`.
Nunca crie uma segunda rota de snapshot com lógica de redação própria — isso divergiria da fonte de verdade (mesmo princípio do `IGameState` do cross-poker).

### Organização de módulos (`resources/`)
Segue `file-organization.md`.

```
resources/
├── table/
│   ├── models/            # Table, TableZone
│   ├── services/          # createTable, getTable, createZone, deleteZone
│   └── hooks/              # useTableStream (SSE + refetch + onCharacterAction)
└── character/
    ├── models/            # Character, HealthColor
    ├── services/          # createCharacter, updateCharacter, deleteCharacter, applyCharacterAction
    ├── logics/             # CreateCharacter, UpdateCharacter, DeleteCharacter
    └── components/        # TableBoard, MasterToken, DisplayToken, CharacterEditPanel
```

### Modelo de dados (Drizzle — `db/schema/`)

- `tables`: id (serial), code (varchar único, curto), master_key_hash (varchar), name (varchar, opcional), status (`active|archived`), created_at.
- `table_zones` (**desde a etapa 8**): id (serial), table_id (fk), position (integer, ordem 0-based esquerda→direita), created_at. Toda Mesa nasce com 1 (`position: 0`). Teto de 6 por Mesa.
- `characters`: id (serial), table_id (fk), name (varchar), image_url (varchar, nullable), zone_id (fk → table_zones.id, **substituiu position_x/position_y na etapa 8** — não existem mais no schema), hp_current (int), hp_max (int), status_effects (jsonb, default `[]`), visible (bool, default true), has_mana (bool, default false), mana_current (int, default 0), mana_max (int, default 0), created_at, updated_at. **`stats` (jsonb) existiu até a remoção documentada no fim da seção 6 — não existe mais no schema.**

### Formato de API
Segue `api-response-format.md` (envelope `{ success, message, data }`, chaves snake_case) e `resources-services.md`.

---

## 4. Fronteira de integração para subagentes (regra anti-conflito)

Peças compartilhadas — schema, modelos de domínio (`Character.ts`, `TableZone.ts`, `HealthColor.ts`), `libs/realtime.ts`, `shared/constants/{colors,theme}.ts`, `resources/table/hooks/useTableStream.ts`, `resources/character/components/TableBoard.tsx` — são construídas por **um agente por vez**, nunca em paralelo, porque definem o contrato que todo o resto consome.

Paralelismo só é permitido quando dois agentes escrevem em **árvores de arquivo totalmente disjuntas** e **apenas consomem** (nunca editam) as peças compartilhadas já fechadas. Ex.: a Tela do Mestre e a Tela de Exibição podem ser construídas em paralelo porque cada uma vive na sua própria página e só importa `TableBoard`/`Character`/`HealthColor`/`useTableStream` já prontos.

Depois de um lote paralelo, qualquer ajuste que precise tocar em mais de uma dessas árvores ao mesmo tempo (ex.: passada final de estética) é feito por **um único agente sozinho**.

Este arquivo (`table-concept.md`) é atualizado só pelo orquestrador entre etapas (nunca por dois agentes em paralelo), marcando o roadmap abaixo.

---

## 5. Roadmap deste projeto

1. ✅ Bootstrap do projeto (scaffold, config, `.claude/rules/` genéricas, `AGENTS.md`).
2. ✅ Domínio + dados (schema, `libs/session.ts`/`tableAuth.ts`/`realtime.ts`, `Character.ts`/`HealthColor.ts`, `shared/constants/{colors,theme}.ts`).
3. ✅ API + SSE + `TableBoard.tsx` + `useTableStream.ts`.
4. ✅ Tela do Mestre / Tela de Exibição / Home (paralelo).
5. ✅ Passada única de acabamento visual (estética RPG).
6. ✅ Verificação end-to-end.
7. ✅ Redesign visual (pergaminho claro → tema escuro "Vilgard"), a pedido do usuário.
8. ✅ Divisões/zonas no tabuleiro, ações de dano/cura com animação, legibilidade (fonte/tamanho de ficha), a pedido do usuário.
9. ✅ Fichas em formato de carta, 4 estados fixos com animação, sistema de mana com cristais, a pedido do usuário.

## 6. O que já existe (não reimplemente — reutilize)

### Infra / config (etapa 1)

- `package.json`: mesmas deps/versões do cross-poker, `name: "storyweaver"`.
- `docker-compose.{local,homolog,production}.yml`, `Makefile`, `configs/docker/node/`: portados com `cross-poker-*` → `storyweaver-*`, banco `storyweaver`. **Portas locais trocadas** (decisão do agente da etapa 1, para não colidir com o cross-poker rodando ao mesmo tempo): `APP_PORT=3002`, `POSTGRES_HOST_PORT=5434` — ver `.env`/`.env.example`.
- `app/layout.tsx`, `app/providers.tsx` (Mantine + TanStack Query + i18next, **sem tema custom ainda** — só entra na etapa 5, depois de `shared/constants/theme.ts` existir), `app/globals.css` (reset minimalista), `app/page.tsx` (placeholder "em construção", a Home real é etapa 4).
- `libs/utils.ts`, `libs/i18n.ts`, `libs/db.ts` (conexão Drizzle+pg pronta, mas `db/schema/index.ts` ainda é um barrel vazio — etapa 2 preenche).
- `shared/constants/locale.ts` (só `SUPPORTED_LOCALES`) e `locales/{pt-br,es-mx,en-us}.ts` (só strings genéricas `common.*`/`errorBoundary.*`/`header.*` — sem nada de domínio ainda).
- `tailwind.config.mjs`: **ainda sem** a extensão de paleta `primary/secondary/tertiary` (fica pra etapa 2, quando `shared/constants/colors.ts` existir).
- Nota herdada do cross-poker, não é bug novo: `Dockerfile.deploy` referencia `/app/dist` (Next gera `.next`) — mesmo problema já existe lá, não corrigir aqui fora de escopo sem avisar o orquestrador.

### Domínio / dados (etapa 2)

Arquivos criados nesta etapa — contrato fechado, próximas etapas só consomem (ver seção 4, "Fronteira de integração"):

- `db/schema/tables.ts`: tabela `tables` exatamente como a seção 3 descreve. Exporta também `tablePublicColumns` (seleção sem `master_key_hash` — copiar sempre que uma rota fizer `db.select`/`.returning()` client-facing, mesmo padrão de `roomPlayerPublicColumns` do cross-poker).
- `db/schema/characters.ts`: tabela `characters` exatamente como a seção 3 descreve (fk `table_id → tables.id`, `stats` jsonb default `{}`, `status_effects` jsonb default `[]`, `visible` bool default `true`).
- `db/schema/index.ts`: barrel agora reexporta `./tables` e `./characters` (deixou de ser vazio).
- `db/migrations/0000_famous_toad_men.sql`: migration gerada via `npm run db:generate` (não aplicada — sem Postgres local rodando nesta etapa; etapa 3 pode rodar `db:push`/`db:migrate`).
- `libs/session.ts`: `setMasterSessionCookie(tableCode: string, token: string): Promise<void>` / `getMasterSessionToken(tableCode: string): Promise<string | null>`. Cookie `sw_master_{code}`, httpOnly, sameSite=lax, path=`/`, `maxAge` de 30 dias (decisão: mesa de RPG dura uma campanha, não uma partida — maior que o 1 dia do cross-poker).
- `libs/tableAuth.ts`:
  - `hashMasterKey(masterKey: string): string` — sha256 hex via `crypto` nativo do Node, **sem salt**. Decisão: `master_key` é um segredo aleatório de alta entropia gerado pelo servidor (não senha de usuário), então um hash rápido e determinístico é suficiente; não há necessidade de bcrypt/scrypt/argon2. **Etapa 3 deve usar esta função** ao gerar/persistir `master_key_hash` na criação da Mesa — não reimplementar o hash em outro lugar.
  - `getCurrentMaster(tableCode: string, tableId: number): Promise<boolean>` — lê o cookie via `getMasterSessionToken`, re-hasheia com `hashMasterKey` e compara com `master_key_hash` da linha `tables` (busca só a coluna do hash, nunca devolve o registro completo). Retorna só `boolean` (não o registro da Mesa — rotas que precisarem dos dados da Mesa fazem sua própria busca separada). **Pressuposto que etapa 3 deve honrar**: o cookie guarda a `master_key` em texto puro (não um hash, não um token de sessão separado) — é `setMasterSessionCookie(code, masterKey)` que a rota de acesso ao link do Mestre deve chamar, no primeiro acesso com `?key=` válida, após validar `hashMasterKey(key) === master_key_hash`.
- `libs/realtime.ts`: cópia estrutural exata do padrão do cross-poker (`publish(channel)` / `subscribe(channel, listener): () => void`, `Map<string, Set<Listener>>` em memória, `'server-only'`). Nenhuma alteração de fundo.
- `shared/constants/colors.ts`: usa o pacote `color` (mesmo padrão de `colorVariations` do cross-poker, agora em TS). Cores do anel de vida (únicas consumidas por `HealthColor.ts`): `RED = '#C0392B'`, `YELLOW = '#F1C40F'`, `GREEN = '#27AE60'`. Paleta de UI fantasia medieval: `PRIMARY_COLOR = '#B8860B'` (dourado velho), `SECONDARY_COLOR = '#6E2C34'` (vinho), `TERTIARY_COLOR = '#2E4B3C'` (verde floresta), mais um token extra não pedido explicitamente mas citado como exemplo — `ACCENT_COLOR = '#7B4B32'` (marrom couro), cada um com sua `_PALETTE` (50–950) via `colorVariations()`. `tailwind.config.mjs` foi atualizado (só a extensão de paleta, mais nada) para expor `primary`/`secondary`/`tertiary` no Tailwind, importando este arquivo — funciona porque o pipeline do `@tailwindcss/postcss` v4 usa `jiti` (já presente em `node_modules`) para carregar o `@config`, então importar um `.ts` num `.mjs` é seguro (mesmo mecanismo que permitia o cross-poker importar `colors.js`).
- `shared/constants/theme.ts`: placeholder estruturado, sem aplicação ainda. `FONT_DISPLAY = 'Cinzel'` (títulos), `FONT_BODY = 'MedievalSharp'` (texto de apoio — etapa 5 decide se troca por serif mais legível em corpo de texto pequeno). `RADIUS` (`sm`/`md`/`lg`/`round`) e `SPACING` (`xs`…`xl`) como tokens simples em px. Nenhum `next/font` instalado/aplicado nesta etapa.
- `resources/character/models/HealthColor.ts`: `healthColor(hpCurrent: number, hpMax: number): string` — única implementação da fórmula da seção 2, retorna hex minúsculo (`#rrxxxx`). Interpolação RGB componente-a-componente via pacote `color`. `hp_max <= 0` → tratado como 0% (vermelho puro), nunca lança exceção. Validado manualmente (script descartável, já removido): 0→`#c0392b` (RED puro), 25→`#d97f1d`, 50→`#f1c40f` (YELLOW puro), 75→`#8cb938`, 100→`#27ae60` (GREEN puro); `hp_max=0` e valores fora de faixa (negativo, >100%) ficam clampados em vermelho/verde puro sem erro.
- `resources/character/models/Character.ts`: `IStatusEffect { key: string; icon: string }` (decisão nova — condição representada por slug + nome de ícone Iconify, sem número). **Decisão de modelagem (item 5 do escopo)**: duas interfaces nomeadas, `ICharacterMaster` (com `hp_current`/`hp_max`/`stats: Record<string, number>`/`visible`) e `ICharacterDisplay` (com `hp_color: string` no lugar dos números, sem `visible`) — **sem união discriminada**, porque a API não envia nenhum campo `view`/`kind`; o consumidor já sabe qual formato pediu (rota/página diferente para Mestre vs. Exibição). Etapa 3 deve montar exatamente esses dois shapes em `GET /api/tables/[code]`; etapa 4 importa a interface correspondente à página.
- `resources/table/enums/TableStatus.ts`: `ETableStatus = { ACTIVE = 'active', ARCHIVED = 'archived' }` (valores da coluna `status`).
- `resources/table/models/Table.ts`: `ITable` (espelha `tablePublicColumns` — **nunca** inclui `master_key_hash`) e `ITableRecord extends ITable` (só uso server-side, com `master_key_hash`; nunca serializar direto numa resposta de API).

### API + tempo real + `TableBoard`/`useTableStream` (etapa 3)

Contrato fechado — próximas etapas (4, em paralelo) só consomem, nunca editam `resources/table/hooks/useTableStream.ts` nem `resources/character/components/TableBoard.tsx` (ver seção 4).

**Infra nova de suporte** (não existia antes, necessária para os `services/` seguirem `resources-services.md`):
- `shared/types/api.ts`: `ApiMessage` (objeto i18n), `PayloadBody<T>`, `PayloadQuery<T>`.
- `shared/types/tanstack.ts`: `QueryFnCtx = { signal?: AbortSignal }`.
- `utils/app-client.ts`: `appClient` (`get`/`post`/`put`/`patch`/`delete`), fino wrapper sobre `ofetch` que tipa o envelope `{ success, message, data }`. Cópia estrutural de `utils/app-client.ts` do cross-poker, só com o import de `ApiMessage` ajustado para `@/shared/types/api` (este projeto não usa prefixo `/src`).

**Rotas de API** (todas em `app/api/tables/...`, envelope de `api-response-format.md`, `code` sempre normalizado para maiúsculo via `code.toUpperCase()` no servidor — aceita minúsculo na URL):
- `POST /api/tables` — cria a Mesa. Body opcional `{ name }`. Gera `code` (6 caracteres, alfabeto `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` — sem `0/O`, `1/I`, mesma lógica de `generateRoomCode()` do cross-poker — até 5 tentativas checando unicidade) e `master_key` via `crypto.randomBytes(16).toString('hex')`. Persiste só `hashMasterKey(master_key)`. **Decisão nova**: quem cria a Mesa já é o Mestre, então a rota já chama `setMasterSessionCookie(code, master_key)` antes de responder (mesmo comportamento de `createRoom` no cross-poker) — a Tela do Mestre não precisa re-autenticar logo após criar. Resposta `data`: **exatamente** `{ code, master_key }`, nada mais — nenhuma outra rota volta a devolver `master_key`.
- `POST /api/tables/[code]/master` — body `{ key }`. Busca só `{ id, master_key_hash }` (nunca a linha completa), compara `hashMasterKey(key)` e, se bater, chama `setMasterSessionCookie(code, key)`. 401 com envelope de erro se não bater, 404 se a Mesa não existir, 422 se `key` vier vazia. Resposta `data`: `{ table: ITable }` (via `tablePublicColumns`).
- `GET /api/tables/[code]` — única rota de snapshot (seção 3). Resolve `getCurrentMaster`, busca `characters` da Mesa e monta **objetos novos campo a campo** (nunca spread/reuso da linha do banco) — Mestre recebe `ICharacterMaster[]` (todos os personagens, inclusive `visible: false`); não-Mestre recebe `ICharacterDisplay[]` (só `visible: true`, `hp_color` via `healthColor()`, sem `hp_current`/`hp_max`/`stats`/`visible` em nenhum campo). **Shape decidido**: `data = { table: ITable, you: { is_master: boolean }, characters: ICharacterMaster[] | ICharacterDisplay[] }`.
- `POST /api/tables/[code]/characters` — cria personagem. Exige `getCurrentMaster`, senão 401 sem tocar no banco. Body: `{ name (obrigatório), image_url?, position_x?, position_y?, hp_current?, hp_max?, stats?, status_effects?, visible? }` — defaults: `position_x`/`position_y` = `50` (centro do tabuleiro em %), `hp_current` = `0`, `hp_max` = `1`, `stats` = `{}`, `status_effects` = `[]`, `visible` = `true`. Chama `publish(\`table:${code}\`)` antes de responder. Resposta `data`: `ICharacterMaster` (rota só acessível pelo Mestre, então sempre o shape completo).
- `PATCH /api/tables/[code]/characters/[id]` — exige `getCurrentMaster`. Todos os campos do body são opcionais, só os presentes são alterados (checagem de tipo por campo); verifica que o personagem pertence à Mesa do `code` antes de atualizar (404 separado de "Mesa não encontrada" vs. "Personagem não encontrado"). `publish` antes de responder. Resposta `data`: `ICharacterMaster` atualizado.
- `DELETE /api/tables/[code]/characters/[id]` — exige `getCurrentMaster`; delete com `and(id, table_id)` (nunca deleta por id cru sem confirmar que pertence à Mesa). `publish` antes de responder. Resposta `data`: `null`.
- `GET /api/tables/[code]/stream` — cópia estrutural exata de `app/api/games/[gameId]/stream/route.ts` do cross-poker (heartbeat 25s, evento `state-changed` sem payload, `subscribe`/cleanup no abort, `export const dynamic = 'force-dynamic'`). Canal `` `table:${code}` ``.

**`resources/table/services/`**: `createTable.ts` (`createTableService`, payload `{ name? }`, resposta `{ code, master_key }`), `getTable.ts` (`getTableService`, `GET_TABLE_KEY(code)`, resposta `GetTableServiceResponse = { table: ITable; you: { is_master }; characters: ICharacterMaster[] | ICharacterDisplay[] }`), `authenticateMaster.ts` (`authenticateMasterService`, payload `{ key }`, resposta `{ table: ITable }`).

**`resources/character/services/`**: `createCharacter.ts` (`createCharacterService`), `updateCharacter.ts` (`updateCharacterService`, payload todo opcional), `deleteCharacter.ts` (`deleteCharacterService`) — todos exigem `code` + (quando aplicável) `characterId`, batem nas rotas Mestre-only acima.

**`resources/table/hooks/useTableStream.ts`** — assinatura final:
```ts
function useTableStream(code: string): {
  data: GetTableServiceResponse | undefined; // snapshot já tipado — data.you.is_master + data.characters (tipo certo por papel, decidido no servidor)
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void; // do TanStack Query, exposto para refetch manual se necessário
}
```
Por dentro: `useQuery({ queryKey: GET_TABLE_KEY(code), queryFn: getTableService })` + um `EventSource(\`/api/tables/${code}/stream\`)` próprio (não reusa `useServerSentEvent` do cross-poker — não existe nesse projeto — a conexão SSE fica encapsulada dentro do próprio hook, não é responsabilidade de quem consome). A cada `state-changed`, chama `refetch()` da query (via `ref` para não recriar a conexão a cada render). Consumidor não precisa saber que SSE existe — só usa `data`/`isLoading`.

**`resources/character/components/TableBoard.tsx`** — API exata:
```tsx
interface ITableBoardCharacter { id: number; position_x: number; position_y: number; } // ICharacterMaster e ICharacterDisplay satisfazem isso estruturalmente

<TableBoard<T extends ITableBoardCharacter>
  characters={characters}                                   // T[]
  renderToken={(character: T) => React.ReactNode}            // obrigatório — render-prop, board não sabe desenhar ficha
  onMove={(id: number, position_x: number, position_y: number) => void} // opcional — presente = arrastável (Mestre), ausente = só leitura (Exibição)
  className={string}                                         // opcional
/>
```
Coordenadas em porcentagem (0–100) do container (`clampPercent`, sem extrapolar). Drag via pointer events nativos (`pointerdown`/`pointermove`/`pointerup`/`pointercancel`) + `setPointerCapture` no elemento do token — sem lib de drag-and-drop, `motion` não foi usado (não foi necessário para a mecânica; etapa 5 pode trocar por `motion.div` para suavizar a transição visual sem mudar a API pública do componente). Durante o drag, a posição visual é otimista (estado local `dragPosition`) até o `onMove` persistir e o snapshot seguinte (via `useTableStream`) confirmar; `onMove` só é chamado uma vez, no `pointerup`/`pointercancel` (não a cada `pointermove`, para não floodar `PATCH`).

**Testado manualmente end-to-end** (não fake — subiu `storyweaver-postgres` via `docker compose -f docker-compose.local.yml up -d storyweaver-postgres`, rodou `drizzle-kit push`, subiu `next dev -p 3002` local com `POSTGRES_HOST=localhost POSTGRES_PORT=5434`, testou com `curl` + cookie jar, depois derrubou container e volume — nenhum dado de teste ficou no ambiente): criação de Mesa + cookie automático do criador; snapshot Mestre vs. Exibição (confirmado por `grep` que `hp_current`/`hp_max`/`stats`/`visible` **nunca** aparecem no payload de Exibição, e que personagem `visible:false` some da lista); criação/edição (posição float, dano)/remoção de personagem só com cookie de Mestre válido (401 sem cookie); `master_key` errada → 401, correta → 200 com cookie novo; SSE emite `event: state-changed` imediatamente após um `PATCH`; `code` minúsculo na URL funciona (normalizado no servidor); 404 para Mesa inexistente e para personagem inexistente.

Nada ambíguo ficou pendente de decisão própria além do que já está documentado acima; qualquer mudança de hex/paleta ou de nome de interface deve vir acompanhada de atualização deste bloco.

### Telas — Mestre / Exibição / Home (etapa 4, paralelo)

3 agentes em árvores disjuntas: `app/mesa/[code]/mestre/page.tsx` + `resources/character/logics/{Create,Update,Delete}Character.tsx` + `resources/character/components/{MasterToken,CharacterEditPanel}.tsx`; `app/mesa/[code]/exibicao/page.tsx` + `resources/character/components/DisplayToken.tsx`; `app/page.tsx` (Home, cria Mesa e mostra os dois links) + `app/mesa/[code]/page.tsx` (landing que escolhe Mestre ou Exibição). Nenhum tocou nas peças fechadas da etapa 3. Sem estética RPG ainda (etapa 5).

**Gap descoberto (não é bug novo, é pré-existente da etapa 1)**: `.claude/rules/components-form*.md`, `resources-logic.md` e `validated-form.md` descrevem uma biblioteca de componentes de formulário (`components/form/{Button,TextInput,...}`, `useValidatedFormState`) que **nunca foi portada** do cross-poker — só os `.md` de regra foram copiados na etapa 1, os componentes reais não. Os 3 agentes desta etapa confirmaram isso e, pragmaticamente, usaram primitivas Mantine puras (`TextInput`/`NumberInput`/`Switch`/`Modal`/`Button`) + `useState`/`useMutation` direto, mantendo a estrutura de hook+UI de `resources-logic.md` (Padrão 1/2) mas sem a camada Yup/`useValidatedFormState`. **Convenção estabelecida daqui pra frente neste projeto**: seguir esse mesmo padrão (Mantine puro) até que alguém decida portar a biblioteca de formulário de verdade — não é dívida bloqueante, é a base real do projeto agora.

**Texto/i18n**: todo texto de domínio está hardcoded em pt-br diretamente nos componentes (não passa por `locales/*.ts`/i18next) — `locales/*.ts` só tem chaves genéricas (`common`/`errorBoundary`/`header`). Mesma convenção acima: aceitar por ora, não é bloqueante para o v1.

**MasterToken/DisplayToken**: ambos usam `<img>` puro (não `next/image`) porque `next.config.ts` não tem `images.remotePatterns` configurado para URLs externas arbitrárias de `image_url` — gera 1 warning de lint cada (`@next/next/no-img-element`), aceito deliberadamente, documentado no código.

### Correção pós-paralelo (orquestrador, sozinho — antes da etapa 5)

**Achado de segurança** (levantado pelo agente da Tela de Exibição): `GET /api/tables/[code]` decidia o papel **só pela presença do cookie de Mestre no navegador**, não pela rota/intenção de quem chama. Se o Mestre abrisse `/mesa/[code]/exibicao` no mesmo navegador onde já tinha autenticado (`sw_master_{code}` presente), a API devolveria `ICharacterMaster[]` (com HP real) mesmo na URL de Exibição — violando a regra absoluta da seção 2 ("nenhum número de jogo na Exibição, nunca"). Risco baixo na prática (o telão real nunca tem esse cookie), mas violava a regra documentada.

**Correção aplicada** (editei eu mesmo, é peça compartilhada — `useTableStream.ts`/`getTable.ts`/`GET /api/tables/[code]`): parâmetro `?view=display`, opcional, só pode **restringir** a resposta (nunca ampliar) — não enfraquece "nunca confiar no cliente para identidade":
- `getTableService({ code, forceDisplay? })` → manda `?view=display` quando `forceDisplay: true`.
- `GET_TABLE_KEY(code, forceDisplay?)` → chave de query agora inclui o modo, pra nunca reaproveitar cache entre Mestre e Exibição no mesmo navegador/`QueryClient`.
- `useTableStream(code, { forceDisplay?: boolean })` → `forceDisplay` default `false` (Tela do Mestre não passa nada, comportamento inalterado).
- `app/mesa/[code]/exibicao/page.tsx` agora chama `useTableStream(code, { forceDisplay: true })`.
- `GET /api/tables/[code]/route.ts`: `const forcedDisplay = new URL(request.url).searchParams.get('view') === 'display'; const isMaster = forcedDisplay ? false : await getCurrentMaster(...)`.

`npx tsc --noEmit` e `npm run lint` seguem limpos (mesmos 4 warnings pré-existentes, zero erros) depois desta correção.

### Verificação end-to-end (etapa 6, orquestrador)

Bug de runtime corrigido antes de verificar (achado pelo agente da etapa 5, não corrigido por ele): `app/mesa/[code]/page.tsx` era Server Component `async` renderizando `<Button component={Link}>` do Mantine, que exige Client Component (função não pode cruzar a fronteira Server→Client) — dava 500 em runtime. Corrigido para `'use client'` + `use(params)`, mesmo padrão das outras páginas de `app/mesa/[code]/`.

Ambiente real (não simulado, derrubado ao final — nenhum dado de teste ficou): `docker compose -f docker-compose.local.yml up -d storyweaver-postgres` + `drizzle-kit push` + `next dev -p 3002` local (`POSTGRES_HOST=localhost POSTGRES_PORT=5434`). Testado via `curl`:
- `POST /api/tables` → cookie de Mestre automático; `POST .../characters` → personagem com hp 80/80.
- Snapshot Mestre (com cookie): `ICharacterMaster` completo. Snapshot `?view=display` **no mesmo cookie de Mestre**: `ICharacterMaster` vira `ICharacterDisplay` (`hp_color` em vez dos números) — confirma que a correção de segurança da seção acima funciona de verdade, não só em teoria. Snapshot sem cookie nenhum: idêntico ao `?view=display`.
- `grep` no payload de Exibição por `hp_current|hp_max|stats|visible` → nenhuma ocorrência.
- Personagem `visible:false`: aparece no snapshot do Mestre (2 personagens), some da Exibição (1 personagem).
- `PATCH` sem cookie → 401. `POST /master` com key errada → 401.
- SSE: 3 `PATCH` de hp seguidos (80→0→40→20) geraram exatamente 3 eventos `state-changed` no stream, na ordem certa.
- Fórmula de cor bate em produção real: hp 80/80 (100%) → `#27ae60` (verde puro); hp 20/80 (25%) → `#d97f1d` — idênticos aos valores validados isoladamente na etapa 2.
- As 4 páginas (`/`, `/mesa/[code]`, `/mesa/[code]/mestre?key=...`, `/mesa/[code]/exibicao`) respondem 200 depois da correção do bug acima.

**V1 concluído e verificado.** Próximos passos possíveis (não implementados, fora do escopo pedido): upload de imagem de personagem (hoje só URL), tela por jogador individual, formulário de digitar `master_key` manualmente (hoje só chega via `?key=` da URL), portar a biblioteca de componentes de formulário de verdade (ver gap documentado no bloco da etapa 4).

### Acabamento visual (etapa 5 — passada única, sozinho)

Único agente rodando, autorizado a tocar mais de uma árvore na mesma passada (ver seção 4). Nenhuma rota de API, schema ou lógica de auth/SSE/drag foi alterada — só CSS/JSX de apresentação. `npx tsc --noEmit` e `npm run lint` seguem limpos, mesmos 4 warnings pré-existentes (2× `@next/next/no-img-element` em `MasterToken.tsx`/`DisplayToken.tsx`, 2× `import/no-anonymous-default-export` em `locales/pt-br.ts`/`tailwind.config.mjs`), zero erros novos.

**Fontes** (`libs/fonts.ts`, novo — `next/font/google`, self-hosted no build):
- `FONT_DISPLAY = 'Cinzel'` — mantido como estava no placeholder da etapa 2. Títulos/headers (`Storyweaver`, nome da Mesa, `<h1>`-`<h6>` em geral — aplicado globalmente via `app/globals.css`, `h1,h2,h3,h4,h5,h6 { font-family: var(--font-display) }` —, e via `headings.fontFamily` no tema do Mantine para o componente `Title`).
- `FONT_BODY`: **trocado** de `MedievalSharp` (placeholder da etapa 2) para **`Crimson Text`** — decisão desta etapa, exatamente a ressalva que a etapa 2 já tinha deixado aberta (`MedievalSharp` é decorativa demais para texto corrido). `shared/constants/theme.ts` foi atualizado para refletir isso.
- `FONT_ACCENT = 'MedievalSharp'` (token novo em `theme.ts`) — a fonte original não foi descartada, virou acento pontual (selo da Home, código da mesa) via classe Tailwind `font-accent`, nunca em texto de corpo/formulário.
- Aplicação: `libs/fonts.ts` exporta `fontDisplay`/`fontBody`/`fontAccent` (cada um com `variable: '--font-display'` etc.); `app/layout.tsx` aplica as 3 classes `.variable` no `<html>`. `tailwind.config.mjs` ganhou `theme.extend.fontFamily.{display,body,accent}` apontando para essas CSS custom properties (com fallback `Georgia`/`serif`/`cursive`), então qualquer componente pode usar `className="font-display"` etc. `libs/mantine/mantine-theme.ts` usa as mesmas variáveis (com fallback) para `fontFamily`/`headings.fontFamily`/título do `Modal`.

**Tema do Mantine** (`libs/mantine/mantine-theme.ts`, novo arquivo — mesmo padrão estrutural de `~/personal/cross-poker/libs/matine/mantine-theme.ts`, só a estética é diferente): `createTheme()` com `colors.{primary,secondary,tertiary,accent}` a partir de `PRIMARY_COLOR_PALETTE`/`SECONDARY_COLOR_PALETTE`/`TERTIARY_COLOR_PALETTE`/`ACCENT_COLOR_PALETTE` de `shared/constants/colors.ts` (nunca `RED`/`YELLOW`/`GREEN` — essas continuam isoladas em `HealthColor.ts`/`DisplayToken.tsx`), `primaryColor: 'primary'`, `Button` com `defaultProps.color: 'primary'` (troca a cor default azul do Mantine em todos os botões do projeto de uma vez, sem precisar editar cada página). Aplicado em `app/providers.tsx` via `<MantineProvider theme={mantineTheme} ...>`. `tailwind.config.mjs` também ganhou a extensão `colors.accent` (só primary/secondary/tertiary existiam desde a etapa 2).

**Fundo/textura** (`app/globals.css`, sem componente `RpgBackground` dedicado — decisão desta etapa: as 3 telas já compartilham o mesmo `<body>` via `app/layout.tsx`, então um componente por página seria redundante): regra em `body`/`[data-mantine-color-scheme="dark"] body` — gradiente de pergaminho claro (`#f1e4c4` + vinheta radial) no claro, madeira escura (`#241a12` + vinheta) no escuro, mais grão sutil via SVG `feTurbulence` embutido como `data:image/svg+xml` (sem asset externo baixado). A Tela de Exibição (`app/mesa/[code]/exibicao/page.tsx`) mantém seu próprio fundo escuro por cima (recolorido de `slate-900`/`slate-800` genérico do Mantine/Tailwind para `#1c140d`/`#241a12`, combinando com a paleta) porque ali o "tabuleiro" precisa continuar bem mais escuro que o pergaminho (é telão).

**Moldura do token** (a parte crítica — `resources/character/components/{MasterToken,DisplayToken}.tsx`):
- Técnica: várias camadas de `box-shadow` sólido (`0 0 0 <spread>px <cor>`, sem blur) empilhadas com `spread` crescente. Como a camada declarada primeiro é pintada por cima das seguintes, cada camada aparece como um anel concêntrico — é a mesma técnica que a implementação anterior (etapa 4) já usava com um único `box-shadow`, só estendida para várias camadas.
- `DisplayToken.tsx`: 4 camadas, da mais interna pra mais externa — friso escuro colado na arte (2px) → **anel de vida** (`hp_color`, 7px — deliberadamente a camada MAIS GROSSA de todas) → filete escuro (2px) → trim dourado externo (2px). **Confirmado**: o anel de `hp_color` continua sendo a banda dominante/mais grossa da moldura — as camadas ornamentais (friso interno e trim externo) são finas (2px cada) e ficam por FORA/DENTRO do anel de cor, nunca sobre ele, então vermelho/amarelo/verde continuam claramente legíveis à distância (telão). A transição de cor quando `hp_color` muda entre snapshots (SSE) é animada via `motion` (`motion/react`, `motion.div` com `animate={{ boxShadow: [...] }}` e `transition={{ duration: 0.6 }}`) em vez de trocar a cor abruptamente — as 4 camadas mantêm os mesmos `spread`s entre renders, só a cor da camada do anel de vida muda, então a Motion consegue interpolar a cor suavemente (mesma técnica de "complex value" que a lib usa pra animar `boxShadow`).
- `MasterToken.tsx`: moldura decorativa sem anel de vida (a Tela do Mestre já mostra HP como número em texto) — friso escuro + trim dourado (`#B8860B`, `PRIMARY_COLOR`) via `box-shadow` quando `character.visible === true`; quando `false`, mantém a borda tracejada (lógica pré-existente da etapa 4, só recolorida para `#8A5A3E`) + opacidade reduzida — sinal de "escondido da Exibição" preservado.
- Nenhuma lógica de drag do `TableBoard`/`MasterToken` foi tocada, só o `style`/`className` do círculo.

**Outros ajustes de tipografia/cor nas 3 páginas**: `app/page.tsx` (Home) ganhou um selo circular com ícone (`lucide:scroll-text`) acima do título, título em `font-display`, código da mesa criada em `font-accent`; `app/mesa/[code]/page.tsx` (landing) e `app/mesa/[code]/mestre/page.tsx` (header + estados de loading/erro/acesso negado) e `app/mesa/[code]/exibicao/page.tsx` (título + fundo do tabuleiro) todos com títulos em `font-display` e cores trocadas de `gray`/`slate`/`blue` genéricos do Mantine/Tailwind para a paleta `primary`/`secondary`/`accent`.

**Achado não corrigido (bug de lógica, não visual — pré-existente da etapa 4, fora de escopo desta etapa)**: `app/mesa/[code]/page.tsx` é um Server Component (`async function`, sem `'use client'`) que renderiza `<Button component={Link} .../>` do Mantine. Isso quebra em runtime com `GET /mesa/[code] 500` e o erro `"Functions cannot be passed directly to Client Components"` (a referência à função `Link`/`LinkComponent` não pode atravessar a fronteira Server→Client sem serialização). Reproduzido rodando `next dev -p 3002` e acessando `/mesa/TEST01` (retornou 500; `/mesa/TEST01/mestre` e `/mesa/TEST01/exibicao`, que são `'use client'`, retornaram 200 normalmente). Não é um bug introduzido nesta etapa (o `component={Link}` já existia antes, só ganhou uma prop `className` a mais aqui) — provavelmente esta rota nunca foi testada de ponta a ponta na etapa 4 (o teste manual documentado ali foi só via `curl`, sem navegador). **Fix sugerido para quem for corrigir**: adicionar `'use client'` no topo do arquivo (a página não faz nenhum fetch server-side, só `await params` e navegação, então devería funcionar igual como client component), ou trocar `<Button component={Link} href=...>` por `<Link href={...}><Button component="span">...</Button></Link>`.

**Testado**: `npx tsc --noEmit` e `npm run lint` limpos. Subiu `next dev -p 3002` (sem Postgres — só validação estática/CSS, já que Home/landing não dependem do banco para renderizar o esqueleto visual); confirmado via HTML/CSS servidos: classes de fonte `next/font` aplicadas no `<html>`, CSS do fundo com `feTurbulence` presente no bundle, cor `#B8860B` (primary) presente nas classes Tailwind renderizadas. Não foi possível tirar screenshot em navegador headless (Playwright instalado mas faltam libs de sistema — `libnspr4.so` ausente — sem `sudo` disponível no ambiente para instalar); validação ficou por HTML/CSS servido + revisão manual do código, não por inspeção visual direta.

### Redesign visual — tema escuro "Vilgard" (etapa 7, sozinho)

A pedido do usuário: "não gostei do design desse projeto, quero que você se baseie no design do projeto `~/personal/contosecantosvilgard`" (um Angular RPG-creator do mesmo autor). Perguntei o escopo antes de mexer (three-way: sempre escuro / claro+escuro repaletizado / só paleta mantendo fundo claro) — usuário escolheu **sempre escuro**, abandonando a alternância clara/escura que existia desde a etapa 5 (`defaultColorScheme="auto"`). Única passada, sozinho (mexe em peças compartilhadas — `shared/constants/colors.ts`, `tailwind.config.mjs`, `libs/mantine/mantine-theme.ts`, `app/globals.css` — e em mais de uma árvore de página ao mesmo tempo, ver seção 4).

**Achado ao inspecionar a referência**: `FONT_DISPLAY`/`FONT_BODY` do Vilgard já são `Cinzel`/`Crimson Text` — **idênticas** às que este projeto já usava desde a etapa 5. Nenhuma mudança em `libs/fonts.ts`/`FONT_DISPLAY`/`FONT_BODY`/`FONT_ACCENT` foi necessária; o redesign é só paleta de cor + fundo + moldura/ornamentação, não tipografia.

**Paleta nova** (`shared/constants/colors.ts` — `RED`/`YELLOW`/`GREEN` do anel de vida **não foram tocadas**, seguem isoladas conforme seção 2):
- `PRIMARY_COLOR = '#C9A84C'` (dourado, era `#B8860B` dourado-velho) + `PRIMARY_LIGHT = '#E8C96A'` (novo — dourado claro, glow/hover/destaque).
- `SECONDARY_COLOR = '#8B1A1A'` (vinho/"blood", era `#6E2C34`) — perigo/ênfase forte (alerta de "guarde a chave", ícone de acesso negado).
- `TERTIARY_COLOR = '#4A1A6B'` (arcano, era `#2E4B3C` verde floresta) — acento místico, pouco usado por ora.
- `ACCENT_COLOR = '#3D2B1A'` (rampa de superfícies escuras/couro, era `#7B4B32`) — usada em `MasterToken`/`DisplayToken` (círculo do token).
- Novos tokens planos (fora da rampa `colorVariations`, usados como `bg-vilgard`/`bg-board`/`bg-panel`/`text-parchment`/`text-gold`/`text-gold-light` no Tailwind): `DARK_BG = '#0D0A06'` (fundo de página), `BOARD_BG = '#1C140D'` (tabuleiro), `PANEL_BG = '#241A12'` (cards/painéis), `PARCHMENT = '#E8D5A3'` (texto padrão).

**Mantine sempre escuro**: `app/providers.tsx` trocou `defaultColorScheme="auto"` por `forceColorScheme="dark"`; `app/layout.tsx` trocou `<ColorSchemeScript defaultColorScheme="auto">` por `"dark"`. `libs/mantine/mantine-theme.ts` ganhou `colors.dark` sobrescrita (tupla `DARK_INK_TUPLE`, índice 0=`PARCHMENT` até índice 9=`DARK_BG`, índice 7=`PANEL_BG`) — é o que faz **qualquer** componente Mantine sem estilização custom (Card, Paper, Modal, texto padrão) herdar a paleta "pergaminho sobre madeira escura" automaticamente, sem precisar sobrescrever cada componente um a um. `primaryShade` virou um número único (`4`, era `{ light: 5, dark: 4 }`) já que não existe mais tema claro. `Card` ganhou `defaultProps.withBorder: true` + borda dourada translúcida; `Modal` ganhou borda dourada + título em `primary.3`; `Divider` ganhou label em `font-display` uppercase tracked — replicando o "selo"/rótulo ornamental do Vilgard.

**`app/globals.css`**: removida a branch `[data-mantine-color-scheme="dark"] body` (não existe mais tema claro para alternar) — o gradiente de fundo (`radial-gradient` + `feTurbulence` de ruído embutido em data-uri, técnica já existente, só recalibrada) agora é fixo, ancorado em `DARK_BG`. `h1`-`h6` ganharam `color: #C9A84C` como fallback de baixa especificidade (Mantine normalmente vence via classe própria — por isso os `Title`/`Text` de heading nas páginas também recebem `c="primary.5"` explícito, não dependem só do CSS global).

**Páginas e componentes recolori­dos** (todos os 4 apontados por `grep` de `PRIMARY_COLOR|SECONDARY_COLOR|...` — ver início da sessão): `app/page.tsx` (Home — reformulado como card com borda dourada, faixa ornamental superior/inferior, selo circular com glow pulsante `animate-pulse-glow`, divisor central, mesmo padrão na tela pós-criação de mesa), `app/mesa/[code]/page.tsx` (landing, mesmo tratamento de card), `app/mesa/[code]/mestre/page.tsx` (header com `backdrop-blur` + borda dourada, tabuleiro em `bg-board`, estados de loading/erro/acesso-negado recoloridos), `app/mesa/[code]/exibicao/page.tsx` (já usava tons próximos — `#1c140d`/`#241a12` — literal; trocado pelos tokens `bg-vilgard`/`bg-board`, título com glow dourado), `resources/character/components/MasterToken.tsx` (trim do token e borda tracejada de "escondido" recoloridos para dourado/vinho, badge de olho-fechado em `bg-panel`), `resources/character/components/DisplayToken.tsx` (bezel/filete/trim externo recalibrados para os novos tokens; nome do personagem em `gold-light` com drop-shadow em vez de branco puro).

**Achado corrigido nesta etapa (não introduzido por ela)**: as faixas ornamentais superior/inferior e o glifo central do divisor na Home usavam caracteres Unicode do bloco Rúnico (ex: `᛫ ᚦ ᚢ ᚱ...`, `᛭`) — mesmo estilo do Vilgard original. Confirmado via screenshot real (ver abaixo) que esse bloco **não renderiza** no Chromium headless deste ambiente (aparece como caixas "tofu" — fontes sem cobertura do bloco Rúnico). Trocado por `✦ STORYWEAVER ✦ MESTRE E JOGADORES ✦` (texto) na faixa e `✦` (dingbat comum, bloco Miscellaneous Symbols, cobertura de fonte muito mais ampla) no divisor — mantém o espírito ornamental sem depender de um bloco Unicode de suporte incerto.

**Testado de ponta a ponta com screenshot real** (não só HTML/CSS servido como na etapa 6) — o ambiente não tinha `libnspr4.so`/`libnss3.so`/`libasound.so.2` para o Chromium headless do Playwright rodar (mesma limitação documentada na etapa 5) e não havia `sudo`, mas **sem precisar de root**: `apt-get download libnspr4 libnss3 libasound2` (baixa `.deb` sem instalar) + `dpkg-deb -x` pra extrair os `.so` numa pasta do scratchpad + `LD_LIBRARY_PATH` apontando pra lá — destravou o Chromium headless sem tocar no sistema. Com os containers locais já rodando (`storyweaver-front`/`storyweaver-postgres`, subidos antes desta sessão), rodei o fluxo completo via Playwright: Home → preencher nome da mesa → "Criar Mesa" → tela de links → abrir link do Mestre → "Novo personagem" → preencher formulário (nome, vida 18/30) → "Criar" → confirmar token aparecendo no tabuleiro com notificação de sucesso → abrir link de Exibição → confirmar anel de vida colorido (18/30 = 60%, tom entre amarelo e verde, bate com a fórmula da seção 2) e nome em `gold-light` com truncamento. Também testei a landing `/mesa/[code]` isolada. Nenhuma quebra de layout, nenhum texto ilegível, nenhum contraste ruim — só o achado do bloco Rúnico acima, já corrigido antes deste parágrafo ser escrito. `npx tsc --noEmit` e `npm run lint` seguem limpos (mesmos 4 warnings pré-existentes, zero erros).

### Divisões/zonas, dano/cura, legibilidade (etapa 8 — fundação, agente único)

A pedido do usuário: fichas sempre organizadas em **divisões** de tamanho igual (não mais posicionamento livre), botão de dar dano/curar por ficha com animação vista pela Mesa, ficha em tons de cinza ao chegar a 0 de vida, fonte/ficha maiores. Decisões de produto confirmadas antes de começar (pergunta direta ao usuário): divisões são **colunas lado a lado**; a Tela de Exibição **espelha as mesmas divisões** (só leitura); a animação de dano/cura na Exibição é **só visual, sem número** (achado de conflito com a regra da seção 2 — resolvido preservando a regra).

Único agente, sozinho, mexendo em peça compartilhada (ver seção 4): schema (`table_zones` nova tabela; `characters.position_x`/`position_y` **removidos**, `characters.zone_id` novo, FK para `table_zones`), `resources/character/models/Character.ts` (`zone_id` em ambos os formatos; `is_defeated` só em `ICharacterDisplay`, ver seção 2), novo `resources/table/models/TableZone.ts`, `libs/realtime.ts` + `app/api/tables/[code]/stream/route.ts` + `resources/table/hooks/useTableStream.ts` (payload de evento, ver seção 3), `resources/character/components/TableBoard.tsx` (reescrita completa: zonas lado a lado sempre do mesmo tamanho via `flex: 1 1 0`, conteúdo de cada zona auto-centralizado via flex-wrap, drag entre zonas via `document.elementFromPoint`/`data-zone-id` em vez de posição livre), rotas novas `POST/DELETE /api/tables/[code]/zones(/[id])` e `POST /api/tables/[code]/characters/[id]/actions`, e as rotas/services de personagem e criação de mesa/personagem ajustados para `zone_id`.

**Migration sem TTY**: `drizzle-kit generate`/`push` interativos (prompt de rename-detection) travavam em `make exec`/`docker compose exec -T` sem terminal. Como o Postgres local é efêmero e não tinha dado real (só sobra de teste manual, truncada com aviso), o schema foi aplicado direto via `psql` e a migration (`0001_add_table_zones.sql` + `meta/0001_snapshot.json`) escrita à mão para documentar — confirmado depois rodando `drizzle-kit generate` de novo e recebendo "No schema changes, nothing to migrate" (schema arquivo/snapshot/banco vivo todos batendo).

**Teto de 6 divisões por Mesa** (`MAX_ZONES_PER_TABLE` em `app/api/tables/[code]/zones/route.ts`) — decisão não pedida explicitamente pelo usuário, mas necessária: sem teto, uma Mesa com muitas divisões deixaria cada uma ilegível numa tela normal/telão (todas sempre do mesmo tamanho, `flex: 1 1 0`).

**Verificado via `curl` contra os containers já rodando** (sem precisar subir/derrubar nada): mesa nova → 1 zona automática; 2ª zona → zonas ordenadas; personagem novo → cai na zona de menor `position`; `PATCH` com `zone_id` move entre zonas (`zone_id` de outra mesa → 422); dano 999 → clamp em 0; cura 999 → clamp em `hp_max`; excluir zona com personagem → personagem migra pra zona que sobra; excluir a última zona → 422; 7ª zona → 422; payload de Exibição (`grep`) tem `zone_id`/`is_defeated`, nunca `hp_current`/`hp_max`/`stats`/`position_x`/`position_y`; stream SSE (`curl -N`) recebe `data: {"type":"character-action","data":{...}}` (não mais `data: {}` vazio) após uma ação de dano/cura. `npx tsc --noEmit`: zero erro novo fora de `app/mesa/[code]/mestre/page.tsx`/`exibicao/page.tsx` (ainda usam o contrato antigo — próxima etapa, em paralelo, atualiza as duas telas + `MasterToken`/`DisplayToken`).

### Tela do Mestre e Tela de Exibição — zonas, ações, legibilidade (etapa 9, dois agentes em paralelo)

Dois agentes, árvores disjuntas (ver seção 4), ambos só consumindo as peças fechadas na etapa 8 — nenhum tocou em schema, `TableBoard.tsx`, `Character.ts`, `TableZone.ts`, `realtime.ts`, `useTableStream.ts` ou em `app/api/**`.

**Agente A — Tela do Mestre** (`app/mesa/[code]/mestre/page.tsx`, `resources/character/components/{MasterToken,CharacterActionsPanel}.tsx` [novo]): página migrada para o `TableBoard` com zonas (`zones`, `renderZoneExtra` com botão de excluir divisão — escondido quando só resta 1 —, `trailing` com botão "Nova divisão" — escondido no teto de 6 —, `onDropCharacter` chamando `PATCH .../characters/[id]` com `zone_id`). Clique na ficha abre `CharacterActionsPanel` (modal com barra de HP colorida via `healthColor()`, campo+botão de dano e de cura separados, chamando `POST .../actions`) em vez do modal de edição completa direto — há um botão "Editar ficha completa" dentro do painel para chegar lá. `useTableStream(..., { onCharacterAction })` dirige um pulso animado (`motion`) de `-N`/`+N` sobre o token (`MasterToken` ganhou prop `pulse`), com números reais (a Tela do Mestre já mostra HP, ver seção 2). `MasterToken`: tamanho +50%, fonte de nome/HP maior, `filter: grayscale(1)` quando `hp_current <= 0`.

**Bug encontrado e corrigido pelo Agente A** (dentro de `MasterToken.tsx`, sem tocar em `TableBoard.tsx`, peça fechada): `TableBoard` chama `setPointerCapture()` no `pointerdown` do wrapper de drag, o que — pela spec de Pointer Events — retargeta o `click` sintético subsequente para o ancestral que capturou o ponteiro, então o `onClick` do próprio `MasterToken` nunca disparava ao clicar numa ficha (só reproduzível em navegador real; os testes anteriores eram só via `curl`). Corrigido escutando `pointerup`/`pointercancel` em `window` a partir do handler de `pointerdown` (o evento retargetado ainda borbulha até `window`, só com `target` diferente).

**Agente B — Tela de Exibição** (`app/mesa/[code]/exibicao/page.tsx`, `resources/character/components/DisplayToken.tsx`): página migrada para o `TableBoard` com zonas, sem `onDropCharacter`/`renderZoneExtra`/`trailing` (só leitura — a ausência dessas props já impede o board de desenhar qualquer controle de gestão). `useTableStream(..., { onCharacterAction })` só lê `character_id`/`action` do evento — `amount`/`hp_current`/`hp_max` nunca são lidos, renderizados ou logados nesta tela (confirmado por `grep` no payload e por revisão de código, ver regra da seção 2). `DisplayToken` ganhou: `is_defeated` → `filter: grayscale(1)` animado (imagem + moldura inteira, mesmo `motion.div` que já anima a cor do anel, para não "piscar"); `activeEffect` → flash vermelho + tremor (dano, 0.45s) ou brilho verde (cura, 0.75s), sem número, remontado via `key` a cada evento para sempre reiniciar do zero mesmo com ações repetidas. Tamanho do token +50% (mesma proporção de `MasterToken`), nome em fonte maior.

**Verificação final (orquestrador)**: `npx tsc --noEmit` e `npm run lint` no projeto inteiro — zero erros, exatamente os mesmos 4 warnings pré-existentes (2× `no-img-element`, 2× `import/no-anonymous-default-export`). Fluxo completo via `curl` contra os containers já rodando (`storyweaver-front`/`storyweaver-postgres`, ativos desde antes desta sessão — não subidos nem derrubados por ela): mesa nova → 1 zona; personagem novo cai nela; 2ª zona criada; mover personagem via `PATCH zone_id`; dano 999 → clamp em 0, `is_defeated: true` na Exibição, `hp_color` vermelho puro; cura 15 → `is_defeated: false`, `hp_color` recalculado (`#f1c40f`, 50%, bate com a fórmula da seção 2); payload de Exibição sem `hp_current`/`hp_max`/`stats`/`visible`/`amount` (grep negativo); SSE (`curl -N`) entrega `data: {"type":"character-action","data":{...}}` com o payload completo no canal compartilhado (esperado — cada tela decide o que lê; confirmado por leitura de código que a Exibição só usa `character_id`/`action`); excluir zona vazia → personagem que estava na outra zona permanece intacto, zona remanescente renumerada para `position: 0`; excluir a última zona → 422; criar a 7ª zona → 422 ("A Mesa já tem o máximo de 6 divisões."). Ambos os agentes reportaram falha por limite de uso de sessão em algum ponto do próprio teste manual (Playwright); os dois já tinham persistido todas as edições de código em disco antes de falhar — confirmado lendo os arquivos finais e rodando `tsc`/`eslint` do zero, sem depender do relatório de nenhum dos dois. Agente A também completou sua própria bateria de 10 screenshots via Playwright (fluxo completo: criar mesa → 2 personagens → 2ª zona → drag-and-drop → clique abre painel de ações → dano anima e HP atualiza → dano a 0 fica cinza → editar ficha completa → excluir zona → personagem migra) antes de finalizar.

**V2 (divisões/zonas/ações/legibilidade) concluído e verificado.** Dados de teste residuais no Postgres local (mesas `62YHMW`, `H9ZYSQ`, `M9UWHX` e outras da verificação desta etapa) — não removidos, mesmo padrão de "resíduo aceito" já documentado nas etapas anteriores (banco de dev efêmero, sem dado real).

### Correção de legibilidade — fichas centralizadas na divisão (agente único, pós-etapa 9)

A pedido do usuário: na Tela de Exibição a moldura da ficha (aumentada na etapa 8/9) estava estourando a caixa de layout e cobrindo o nome abaixo; além disso, as fichas ficavam sempre coladas no topo da divisão em vez de centralizadas vertical e horizontalmente. Mexeu em peça compartilhada (`TableBoard.tsx`) e nas duas páginas de tabuleiro — agente único (ver seção 4).

**Causa raiz nº 1 (moldura cobrindo o nome, `DisplayToken.tsx`/`MasterToken.tsx`)**: a moldura é pintada via `box-shadow` empilhado (sem blur), que renderiza FORA da caixa de layout do círculo (`TOKEN_SIZE`/`IMAGE_SIZE`) sem reservar espaço para isso — o `mt-2`/`gap-1` entre o círculo e o nome era menor que o `spread` total da moldura, então o anel externo vazava por cima do texto. Corrigido envolvendo o círculo num wrapper do tamanho visual final (`TOKEN_SIZE/IMAGE_SIZE + margem da moldura × 2`, centralizado via flex) em ambos os componentes — o layout agora reserva exatamente o espaço que a moldura ocupa de verdade, então o nome nunca mais é sobreposto.

**Causa raiz nº 2 (fichas coladas no topo, `TableBoard.tsx` + as duas pages)**: `TableBoard` dependia de `h-full` (`height: 100%`) para preencher a altura da divisão, mas os containers pais (`app/mesa/[code]/exibicao/page.tsx` e `.../mestre/page.tsx`) eram `<div>` de bloco comum (`display: block`), cuja própria altura vinha de `flex-1` (herdada de um ancestral flex) — CSS resolve porcentagem de altura contra a altura *explicitamente especificada* do bloco-pai, e uma altura resultante de `flex-grow` não conta como "explícita" para esse cálculo. Resultado: `height: 100%` colapsava para `auto`, e o board (e cada divisão dentro dele, via `align-items: stretch`) encolhia para a altura do próprio conteúdo — daí as fichas sempre no topo, sem sobra de espaço para centralizar. Corrigido tornando os dois containers-pai `display: flex` (então o único filho `TableBoard` estica via `align-self: stretch`, mecanismo do próprio algoritmo de flexbox, não porcentagem) e trocando, dentro de `TableBoard.tsx`, a classe `h-full` por `self-stretch` — reforça o mesmo comportamento explicitamente e não briga com percentual nenhum. **Consumidores futuros de `TableBoard`**: sempre envolver em um container `display: flex` (não bloco comum) para a altura funcionar; nunca passar `h-*`/`height` no `className` (conflitaria/mascararia o `self-stretch` interno).

Com a altura corrigida, a centralização (`justify-content: center` + `align-items: center` no conteúdo de cada divisão, já existente desde a etapa 8) passou a funcionar de verdade — fichas centralizadas vertical e horizontalmente dentro de cada divisão, em qualquer papel (Mestre/Exibição), com qualquer número de zonas.

**Testado via Playwright real** (ambiente sem `sudo`: `apt-get download libnspr4 libnss3 libasound2` + `dpkg-deb -x` + `LD_LIBRARY_PATH` apontando pros `.so` extraídos, mesma técnica documentada na etapa 7, sem precisar reinstalar nada globalmente) contra os containers já rodando (`storyweaver-front`/`storyweaver-postgres`, ativos desde antes desta sessão): 1 zona com 3 personagens (incluindo um com `hp_current: 0`, grayscale) → centralizados, nome legível, anel de vida com a cor certa; 2 zonas (3 + 1 personagens) → cada divisão centraliza seu próprio conteúdo de forma independente; Tela do Mestre com 2 zonas + botão "Nova divisão" → mesmo comportamento, incluindo o `trailing` esticando a altura toda. `npx tsc --noEmit` e `npm run lint` seguem limpos, exatamente os mesmos 4 warnings pré-existentes, zero erros novos.

### Remoção de `style={{...}}` em favor de classes Tailwind (agente único, a pedido do usuário)

A pedido do usuário ("evite sempre que possível usar style, o ideal é usar as classes tailwind") — não havia regra sobre isso em `.claude/rules/`. Criada `styling-tailwind.md` (referenciada em `AGENTS.md`, seção "Formatação JSX/TSX") documentando: preferir classe Tailwind (padrão ou arbitrária `[...]`) a `style`; usar `cn()` (`@/src/libs/utils`) para classes condicionais em vez de ternário dentro de `style`; para tamanhos calculados de constantes JS que não mudam em runtime, usar o valor literal na classe (`w-[84px]`) com comentário apontando a constante de origem; `style`/a prop `animate` da `motion` continuam aceitáveis só para valores genuinamente dinâmicos por frame/render (posição seguindo o ponteiro num drag, `boxShadow`/`filter` interpolados pela `motion`).

Varredura (`grep -rn "style="`) encontrou 27 ocorrências em 6 arquivos: `MasterToken.tsx`, `DisplayToken.tsx`, `CharacterEditPanel.tsx`, `TableBoard.tsx`, `CharacterActionsPanel.tsx`, `app/page.tsx`. Convertidas 26 para classes Tailwind (incluindo composição condicional via `cn()` para os dois estados do trim/opacidade/cursor/flash de dano-cura, que antes eram ternários dentro de `style`). As constantes JS que só alimentavam essas propriedades estáticas (`IMAGE_SIZE`/`BUTTON_WIDTH`/`INNER_SPREAD`/`OUTER_SPREAD` em `MasterToken.tsx`; `TOKEN_SIZE`/`FRAME_MARGIN` em `DisplayToken.tsx`) foram removidas — os valores agora só existem como número literal na classe, com comentário explicando de onde vêm (não há checagem automática ligando os dois, documentado na própria regra).

**A única ocorrência que ficou** (`TableBoard.tsx`, preview do token durante o drag): `style={{ left: pointer.x, top: pointer.y }}` — posição do preview `position: fixed` que segue o ponteiro a cada `pointermove`, genuinamente dinâmica por frame, exatamente a exceção documentada em `styling-tailwind.md`. O resto do mesmo elemento (`pointer-events-none fixed z-[1000] -translate-x-1/2 -translate-y-1/2`) já virou classe. `BEZEL_SPREAD`/`HP_RING_SPREAD`/`INNER_TRIM_SPREAD`/`OUTER_TRIM_SPREAD` em `DisplayToken.tsx` também continuam como constantes JS (não viraram classe) porque alimentam o `boxShadow` animado pela `motion` — muda com `character.hp_color`, mesma exceção.

**Verificado**: `npx tsc --noEmit` e `npm run lint` limpos, mesmos 4 warnings pré-existentes, zero erros novos. `grep -rn "style="` no projeto inteiro (fora `node_modules`/`.next`) confirma só a linha acima sobrando. Containers locais (`storyweaver-front`/`storyweaver-postgres`, já rodando desde antes desta sessão, não subidos nem derrubados por ela) recarregaram via Fast Refresh sem erro após os ajustes; `curl` em `/`, `/mesa/[code]/mestre` e `/mesa/[code]/exibicao` (mesa de teste já existente, `6QQNGY`, mais uma mesa `TESTXX` inexistente só para checar 404) retornou 200 em todos os casos, sem regressão de runtime.

### Fichas em formato de carta, estados fixos com animação, sistema de mana (etapa 10 — três agentes, fundação sozinha + dois em paralelo)

A pedido do usuário: fichas em formato de carta (maiores que o token circular anterior), 4 estados fixos com animação específica cada (atordoado, envenenado, preso, sangrando), e um sistema de mana (cristais azuis na carta, gasto/restauração com animação). Decisão de produto tomada com o usuário antes de começar (pergunta direta, ver seção "Mana" da tabela de vocabulário acima): mana aparece nas DUAS telas (Mestre e Exibição), diferente de vida — é tratada como exceção deliberada à regra de "nenhum número de jogo na Exibição", não como um enfraquecimento dela (hp/stats continuam proibidos na Exibição, sem exceção).

**Orquestração**: 1 agente de fundação (schema/API/models/componentes compartilhados), sozinho, seguido de 2 agentes em paralelo em árvores disjuntas (Tela do Mestre vs. Tela de Exibição) — mesmo padrão da etapa 8→9. O agente de fundação deixou de propósito 4 arquivos com erro de `tsc` esperado (`CharacterEditPanel.tsx`, `DisplayToken.tsx`, `mestre/page.tsx`, `exibicao/page.tsx`) para os dois agentes seguintes consertarem cada um na sua árvore — mesma técnica já usada na etapa 8.

**Fundação — schema/API/contratos**:
- `db/schema/characters.ts` + migration `0002_add_mana_and_status_effects.sql`: 3 colunas novas — `has_mana` (boolean, default `false`), `mana_current`/`mana_max` (integer, default `0`). `status_effects` (jsonb) muda de `{key, icon}[]` livre para array de strings do enum fixo abaixo.
- `resources/character/enums/StatusEffect.ts`: `EStatusEffect { ATORDOADO, ENVENENADO, PRESO, SANGRANDO }` — substitui `IStatusEffect` (removido de `Character.ts`), que não existe mais.
- `resources/character/models/StatusEffectVisual.ts`: ícone (Iconify) + label por estado — atordoado→`lucide:sparkles`, envenenado→`lucide:flask-conical`, preso→`lucide:link-2`, sangrando→`lucide:droplet`.
- `resources/character/components/StatusEffectBadge.tsx` (novo, compartilhado): `{ effect, size? }` — ícone com animação contínua em loop, diferente por estado (rotação para atordoado, pulso+glow verde para envenenado, jitter para preso, gota pingando para sangrando). Usado sem alteração por Mestre e Exibição.
- `resources/character/components/ManaCrystals.tsx` (novo, compartilhado): `{ current, max, crystalSize?, className? }` — renderiza `max` slots, os primeiros `current` cheios (azul), o resto vazio na mesma posição (nunca reordena). **Autocontido**: guarda o `current` anterior internamente e anima sozinho (estilhaça ao gastar, brilha ao restaurar) sempre que a prop muda — nenhum consumidor precisa passar evento/pulso externo. `max <= 0` → não renderiza nada.
- `shared/constants/colors.ts`: `MANA_BLUE = '#2E86C1'` / `MANA_BLUE_LIGHT = '#6FB7E8'`, isoladas da paleta de UI (mesmo padrão de RED/YELLOW/GREEN do anel de vida).
- `resources/character/models/Character.ts`: `ICharacterMaster` e `ICharacterDisplay` ganham `has_mana`/`mana_current`/`mana_max` (números crus nos dois — comentário explícito de que é exceção deliberada, só para mana). `status_effects: EStatusEffect[]` nos dois.
- API (`app/api/tables/[code]/characters/route.ts`, `.../[id]/route.ts`, `.../[id]/actions/route.ts`, `app/api/tables/[code]/route.ts`): aceitam/retornam os campos de mana; `status_effects` recebido é filtrado para só manter valores válidos do enum (silenciosamente, sem rejeitar a requisição); `POST .../actions` aceita `type: 'mana-spend'|'mana-restore'` além de `'damage'|'heal'`, clampando `mana_current` entre `0` e `mana_max` (422 se `has_mana` for `false`); evento SSE `character-action` passa a incluir sempre `mana_current`/`mana_max` no payload.
- `resources/table/hooks/useTableStream.ts`: `UseTableStreamCharacterAction.action` ganha os dois tipos de mana.
- Testado via `curl` contra os containers já rodando (`storyweaver-front`/`storyweaver-postgres`): criação com mana, clamp de `mana-spend`/`mana-restore` (inclusive 422 sem `has_mana`), filtragem de `status_effects` inválido, payload de Exibição com mana mas sem hp/stats, evento SSE com mana no payload.

**Agente A — Tela do Mestre**: `MasterToken.tsx` redesenhado como carta (176px de largura, moldura via `box-shadow` empilhado igual antes, mesma técnica de reserva de espaço da correção pós-etapa-9) com fileira de `StatusEffectBadge` (lacuna que não existia antes — o Mestre agora também vê os estados, não só a Exibição) e `ManaCrystals`. `MasterTokenPulse` (popup flutuante de dano/cura) estendido para `mana-spend`/`mana-restore`, colorido com `MANA_BLUE`/`MANA_BLUE_LIGHT`. `CharacterEditPanel.tsx`: "Condições" virou `Chip.Group` fixo dos 4 estados (era texto livre `{key, icon}`); nova seção "Mana" com `Switch` (`has_mana`) + dois `NumberInput` (atual/máxima). `CharacterActionsPanel.tsx`: nova seção "Mana" espelhando Dano/Cura, com `ManaCrystals` de feedback imediato. `mestre/page.tsx` não precisou de mudança além do tipo já vir pronto do hook.

**Agente B — Tela de Exibição**: `DisplayToken.tsx` redesenhado como carta (220×320px, maior que a do Mestre — é pro telão), anel de vida adaptado de círculo pra borda de carta (continua a camada mais grossa/dominante da moldura, mesma regra de sempre), `is_defeated`/`activeEffect` (flash de dano/cura) mantidos. Fileira de `StatusEffectBadge` e `ManaCrystals` adicionadas (mana agora É intencionalmente visível aqui, ver decisão de produto acima). `exibicao/page.tsx`: único ajuste foi filtrar `handleCharacterAction` para só reagir a `'damage'/'heal'` (mana não precisa de evento — o `ManaCrystals` já anima sozinho a partir do snapshot).

**Verificação final (orquestrador)**: `npx tsc --noEmit` limpo (zero erros, projeto inteiro) e `npm run lint` com exatamente os mesmos 4 warnings pré-existentes — confirmado depois dos dois agentes paralelos terminarem, sem depender só do autorrelato de cada um. Cada agente também validou sozinho via Playwright real (técnica de destravar o Chromium headless sem `sudo` já documentada nas etapas 7/8/9) contra os containers já rodando: carta do Mestre com condições+mana visíveis e ações de gastar/restaurar mana refletindo na contagem de cristais; carta de Exibição com `?view=display` confirmado sem `hp_current`/`hp_max`/`stats` mas com mana/condições, anel de vida na cor certa, e animação de estilhaçar ao gastar mana via SSE. Dados de teste residuais no Postgres local (mesas `7T7EEJ`, `26VQBT`, `VJPYR5`, `VT22DM`) não removidos — mesmo padrão de "resíduo aceito" já documentado nas etapas anteriores.

**V3 (cartas/estados/mana) concluído e verificado.**

### Remoção do campo Atributos (`stats`) — agente único, a pedido do usuário

A pedido do usuário: "Retire dos personagens toda a parte de atributos pois ela não está sendo utilizada" — o campo livre de atributos numéricos (`stats`, seção "Atributos" do `CharacterEditPanel.tsx`) nunca foi consumido por nenhuma outra parte do produto (não influenciava o anel de vida, não aparecia na Exibição, não tinha nenhuma lógica de jogo associada), então foi removido por completo em vez de só escondido.

Mexeu em peça compartilhada (schema, `Character.ts`) — agente único, sem paralelismo (ver seção 4).

- `db/schema/characters.ts`: coluna `stats` (jsonb) removida. Migration `0003_narrow_wrecking_crew.sql` gerada via `npx drizzle-kit generate` (rodou não-interativo desta vez — só travava em rename-detection, que não se aplica a uma coluna dropada) e aplicada no Postgres local via `psql` (`ALTER TABLE characters DROP COLUMN stats`), mesmo padrão de aplicação manual das migrations 0001/0002.
- `resources/character/models/Character.ts`: `stats: Record<string, number>` removido de `ICharacterMaster` (nunca existiu em `ICharacterDisplay`).
- `resources/character/services/{createCharacter,updateCharacter}.ts`: campo `stats?` removido dos payloads.
- Rotas (`app/api/tables/[code]/characters/route.ts`, `.../[id]/route.ts`, `.../[id]/actions/route.ts`, `app/api/tables/[code]/route.ts`): leitura/escrita de `stats` removida de todos os pontos (`toCharacterMaster`, `POST`, `PATCH`, snapshot do Mestre em `GET /api/tables/[code]`).
- `resources/character/components/CharacterEditPanel.tsx`: removida a seção "Atributos" inteira (lista de `{key, value}` editável, botão "Adicionar atributo", handlers `addStat`/`updateStat`/`removeStat`) e o campo `stats` de `ICharacterFormState`/`CHARACTER_FORM_DEFAULT_STATE`/`characterToFormState`/`characterFormStateToPayload`. Import `ActionIcon` removido (só era usado pelo botão de excluir linha de atributo).
- Comentários que citavam `hp/stats` como par de "números de jogo proibidos na Exibição" (em `Character.ts`, `DisplayToken.tsx`, `ManaCrystals.tsx`, `exibicao/page.tsx`, `app/api/tables/[code]/route.ts`) atualizados para citar só `hp` — a regra de privacidade da seção 2 continua exatamente a mesma, só não menciona mais um campo que não existe.

**Verificado**: `npx tsc --noEmit` e `npm run lint` limpos, exatamente os mesmos 4 warnings pré-existentes, zero erros novos. `grep -rn "\bstats\b"` no projeto inteiro (fora `node_modules`/`.next`) não retorna nenhuma ocorrência. Testado via `curl` contra os containers já rodando (`storyweaver-front`/`storyweaver-postgres`, ativos desde antes desta sessão): `POST /api/tables/[code]/characters` cria personagem normalmente, resposta sem campo `stats`.

### Vida extra (`extra_hp`) — agente único, a pedido do usuário

A pedido do usuário: qualquer ficha ganha um segundo "reservatório" de vida — vida extra —, separado da vida normal, que o Mestre pode adicionar/remover a qualquer momento. Dano é sempre abatido primeiro da vida extra; só o excedente (se sobrar) desconta da vida normal. A cor do anel/carta passa a considerar `hp_max + extra_hp` como máximo e `hp_current + extra_hp` como atual.

Mexeu em peça compartilhada (schema, `HealthColor.ts`, `Character.ts`, rota de snapshot, rota de ações) — agente único, sem paralelismo (ver seção 4).

- `db/schema/characters.ts`: coluna nova `extra_hp` (integer, default `0`, `NOT NULL`). Sem coluna de "máximo" própria — `extra_hp` entra igualmente no numerador e denominador da fórmula de cor, então o próprio valor atual já funciona como o teto que ele concede. Migration `0004_add_extra_hp.sql` gerada via `npx drizzle-kit generate` (rodou não-interativo desta vez — pura adição de coluna não aciona rename-detection) e aplicada no Postgres local via `psql` (`ALTER TABLE characters ADD COLUMN extra_hp integer DEFAULT 0 NOT NULL`), mesmo padrão de aplicação manual das migrations anteriores.
- `resources/character/models/HealthColor.ts`: `healthColor`/`healthPercent` (esta última agora exportada) ganham um terceiro parâmetro opcional `extraHp = 0`. `effectiveMax = hpMax + extraHp`; `percent = (hpCurrent + extraHp) / effectiveMax * 100`, clampado 0–100 (nunca ultrapassa 100 porque `hp_current <= hp_max` sempre).
- `resources/character/models/Character.ts`: `ICharacterMaster` ganha `extra_hp: number` — Mestre-only, mesma regra do `hp_current`/`hp_max` (NUNCA em `ICharacterDisplay`; a Exibição só vê o resultado já embutido em `hp_color`/`is_defeated`).
- `is_defeated` (rota de snapshot, `MasterToken.tsx`) passou de `hp_current <= 0` para `hp_current + extra_hp <= 0` — vida extra conta como vida restante, inclusive podendo "reviver" visualmente um personagem que estava a 0 se o Mestre adicionar vida extra.
- `POST .../characters/[id]/actions`: dois tipos novos, `extra-add` (soma, sem teto) e `extra-remove` (subtrai, nunca abaixo de 0). `damage` reescrito: `extraAbsorbed = min(extra_hp, amount)`, abate isso de `extra_hp`, e só `amount - extraAbsorbed` desconta de `hp_current` (clampado 0..hp_max, como antes). `heal` não toca em `extra_hp` (só cura vida normal). Payload do evento SSE `character-action` ganhou `extra_hp` (sempre presente, mesmo padrão de `mana_current`/`mana_max` — o canal já era compartilhado e já vazava `hp_current`/`hp_max` no payload cru desde a etapa 8/9, decisão aceita e documentada; a Exibição continua nunca lendo esses campos).
- `CharacterEditPanel.tsx`: `NumberInput` "Vida extra" (min 0) logo abaixo do grupo Vida máxima/atual — edição direta, sem toggle (diferente de mana, vida extra está sempre disponível para qualquer personagem).
- `CharacterActionsPanel.tsx`: nova seção "Vida Extra" espelhando Dano/Cura — dois `NumberInput`+`Button` ("Adicionar vida extra"/"Remover vida extra", ambos `color="green"`, o de remover em `variant="outline"` só para diferenciar visualmente o par). Barra de progresso/texto de vida no topo do painel agora usa `healthPercent`/`healthColor` com `extra_hp` embutido, e mostra um `+N` verde ao lado do `hp_current/hp_max` quando `extra_hp > 0`.
- `MasterToken.tsx`: mesmo badge `+N` verde ao lado do texto de HP da carta; `PULSE_IS_NEGATIVE`/`PULSE_COLOR_CLASS` (popup flutuante de dano/cura/mana) ganham `extra-add`/`extra-remove` — **reusam a MESMA cor verde de `heal`** nos dois sentidos (adicionar E remover), a pedido explícito do usuário ("a mesma animação da de curar, porém com a cor verde").
- `DisplayToken.tsx`/`exibicao/page.tsx`: `DisplayTokenActiveEffect.action` ganha `extra-add`/`extra-remove` — reusam o mesmo flash verde de `heal` (a condicional do componente já tratava qualquer ação não-`damage` como o caminho verde, então nenhuma mudança de lógica de cor foi necessária ali, só o tipo). Diferente de mana (que nunca dispara esse flash — o `ManaCrystals` anima sozinho a partir do snapshot), vida extra dispara o flash porque não há nenhum elemento equivalente ao `ManaCrystals` para ela na Exibição (o número é Mestre-only) — é o único feedback visual que o jogador tem de que algo mudou.

**Testado via `curl` contra os containers já rodando** (`storyweaver-front`/`storyweaver-postgres`, ativos desde antes desta sessão): personagem criado com `hp 30/30, extra_hp 10`; `damage 5` → só `extra_hp` cai (10→5), `hp_current` intacto; `damage 12` → `extra_hp` zera (5→0) e o excedente (7) desconta de `hp_current` (30→23); `extra-add 20`/`extra-remove 15`/`extra-remove 100` (clamp em 0) todos corretos; payload de Exibição (`?view=display`, `grep`) confirmado sem `hp_current`/`hp_max`/`extra_hp`; `hp_color` bate com a fórmula nova (84.4% → `#66b547`, calculado à mão a partir do lerp YELLOW→GREEN); `is_defeated` vira `true` quando `hp_current + extra_hp` chega a 0, e volta a `false` só com `extra-add` (sem tocar `hp_current`) — confirma que vida extra sozinha já é suficiente pra "reviver" visualmente. Mesa de teste (`QCUECJ`) removida do Postgres local ao final (sem resíduo desta vez, diferente do padrão aceito em etapas anteriores). `npx tsc --noEmit` e `npm run lint` seguem limpos, exatamente os mesmos 4 warnings pré-existentes, zero erros novos.
