# Reset Visual (Porte do Canvas Vilgard) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir toda a camada de apresentação do Storyweaver (Home, Mesas, Tela do Mestre, Tela de Exibição) por um porte fiel do protótipo `Site RPG com painéis interativos/Storyweaver.dc.html`, mantendo o backend/lógica de dados já construído.

**Architecture:** O código Next.js atual (frontend + backend) é movido inteiro para `_reference-old-app/` (read-only, nunca importado). Só as peças 100% backend voltam para a raiz sem alteração de conteúdo. A UI nova é escrita do zero na raiz, portando quase literalmente o HTML/CSS/JS do canvas para React/Tailwind + CSS puro, consumindo os hooks/services que voltaram para a raiz. Onde o UX do canvas exige um dado diferente do schema atual (posição livre em vez de zonas, 6 condições em vez de 4, tipo PC/NPC/Monstro), o schema/API é ajustado — nunca o inverso.

**Tech Stack:** Next.js (App Router) + React + TanStack Query + Drizzle/Postgres + Tailwind (tokens) + CSS puro (animações/glow complexos) + `next/font/google` (Cinzel + EB Garamond) + `@phosphor-icons/react`. Sem Mantine nas páginas/componentes novos.

**Spec:** `docs/superpowers/specs/2026-08-30-visual-reset-canvas-port-design.md`

## Global Constraints

- Canvas manda 100% no UX/visual. Toda divergência entre canvas e schema/comportamento atual é resolvida adaptando o backend ao canvas.
- Nunca editar em lugar os arquivos que forem movidos para `_reference-old-app/` — eles são só leitura, consultados apenas para saber contrato exato de endpoint/hook/service.
- Nenhum arquivo novo de página/componente visual importa de `@mantine/*`.
- Fontes: `Cinzel` (headings) + `EB Garamond` (corpo), via `next/font/google`.
- Paleta (variáveis CSS, copiadas do canvas `Storyweaver.dc.html` linhas 16-24): `--bg:#161009; --bg2:#1f1610; --bg3:#2a1d13; --gold:#c9a227; --gold-light:#e8cf7c; --gold-dim:#8a6d24; --maroon:#7a2430; --maroon-light:#a83f4a; --text:#ece3d1; --text-dim:#b7a888; --text-faint:#8b7c5e; --border:#5a4324; --mana-blue:#4a8cc7;`.
- Ícones via `@phosphor-icons/react`, mesmos nomes do canvas (`ph-fill ph-sword` → `<Sword weight="fill" />`).
- Toda rota de mutação continua exigindo `getCurrentMaster` (cookie do Mestre) — nenhuma mudança de auth.
- `HealthColor.ts` (`healthColor`/`healthPercent`) é a ÚNICA fonte de cor de vida — nunca reimplementar o lerp em componente.
- Migrations Drizzle neste projeto historicamente precisam de aplicação manual via `psql` quando `npm run db:migrate` pula silenciosamente (bug de `MAX(created_at)` documentado em `_reference-old-app/.claude/rules/table-concept.md`) — se isso acontecer, aplicar o SQL gerado manualmente e registrar o hash em `drizzle.__drizzle_migrations`.

---

## Fase 0 — Reestruturação do repositório

### Task 1: Mover UI antiga para `_reference-old-app/`, restaurar backend puro na raiz

**Files:**
- Move (git mv, para dentro de `_reference-old-app/` mantendo o mesmo caminho relativo): `app/`, `resources/`, `db/`, `libs/`, `shared/`, `components/`, `utils/`, `locales/`, `src/`, `.claude/rules/` (as regras específicas de domínio antigo — `table-concept.md` etc. — continuam válidas como referência histórica).
- Depois do move acima, mover de volta pra raiz (git mv de dentro de `_reference-old-app/` para a raiz), sem alterar conteúdo: `db/`, `app/api/`, `libs/session.ts`, `libs/tableAuth.ts`, `libs/realtime.ts`, `libs/db.ts`, `resources/character/services/`, `resources/character/models/`, `resources/character/enums/`, `resources/table/services/`, `resources/table/models/`, `resources/table/enums/`, `resources/table/hooks/`, `shared/`, `utils/`.
- Config que fica na raiz sem mover: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.mjs`, `postcss.config.mjs`, `drizzle.config.ts`, `eslint.config.mjs`, `AGENTS.md`, `CLAUDE.md`.
- Create: `app/layout.tsx` mínimo temporário (só pra a raiz buildar com API mas sem página — será sobrescrito na Fase 2).
- Create: `app/globals.css` vazio temporário (idem).

**Interfaces:**
- Produces: raiz com `app/api/**` funcional (rotas antigas ainda respondendo com o schema ANTIGO — position/zone só muda na Task 2), `db/`, `resources/*/services|models|enums|hooks` intactos e importáveis via os mesmos aliases (`@/resources/...`, `@/db/...`, `@/libs/...`).

- [ ] **Step 1: Confirmar árvore atual e criar a pasta de destino**

```bash
git status
mkdir -p _reference-old-app
```

- [ ] **Step 2: Mover tudo (frontend+backend) para a pasta de referência**

```bash
git mv app _reference-old-app/app
git mv resources _reference-old-app/resources
git mv db _reference-old-app/db
git mv libs _reference-old-app/libs
git mv shared _reference-old-app/shared
git mv components _reference-old-app/components
git mv utils _reference-old-app/utils
git mv locales _reference-old-app/locales
git mv src _reference-old-app/src
git mv .claude/rules _reference-old-app/claude-rules-old
```

- [ ] **Step 3: Restaurar as peças 100% backend na raiz**

```bash
git mv _reference-old-app/db db
git mv _reference-old-app/app/api app/api
git mv _reference-old-app/libs/session.ts libs/session.ts
git mv _reference-old-app/libs/tableAuth.ts libs/tableAuth.ts
git mv _reference-old-app/libs/realtime.ts libs/realtime.ts
git mv _reference-old-app/libs/db.ts libs/db.ts
git mv _reference-old-app/shared shared
git mv _reference-old-app/utils utils
mkdir -p resources/character resources/table
git mv _reference-old-app/resources/character/services resources/character/services
git mv _reference-old-app/resources/character/models resources/character/models
git mv _reference-old-app/resources/character/enums resources/character/enums
git mv _reference-old-app/resources/table/services resources/table/services
git mv _reference-old-app/resources/table/models resources/table/models
git mv _reference-old-app/resources/table/enums resources/table/enums
git mv _reference-old-app/resources/table/hooks resources/table/hooks
```

- [ ] **Step 4: Criar layout/globals mínimos pra raiz buildar**

`app/layout.tsx`:
```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  );
}
```

`app/globals.css`:
```css
@import "tailwindcss";
```

- [ ] **Step 5: Verificar que a raiz builda (sem páginas visuais, só API)**

Run: `npx tsc --noEmit`
Expected: erros apontando só para páginas/componentes visuais que ainda faltam (Fases 2-6) — nenhum erro dentro de `app/api/**`, `db/`, `resources/*/services|models|enums|hooks`, `libs/session.ts|tableAuth.ts|realtime.ts|db.ts`.

Run: `npm run dev` (checar log), depois `curl http://localhost:3000/api/tables`
Expected: resposta JSON válida do envelope `{ success, message, data }` (lista de mesas), confirmando que a API sobrevive à reestruturação.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: move old app to _reference-old-app, restore backend at root"
```

---

## Fase 1 — Schema e API (canvas manda)

### Task 2: Migration — posição livre, tipo de personagem, 6 condições

**Files:**
- Modify: `db/schema/characters.ts`
- Delete: `db/schema/table_zones.ts`
- Modify: `db/schema/index.ts`
- Create: `resources/character/enums/CharacterType.ts`
- Modify: `resources/character/enums/StatusEffect.ts`
- Delete: `resources/table/models/TableZone.ts`
- Delete: `resources/table/services/createZone.ts`, `resources/table/services/deleteZone.ts`
- Create: `db/migrations/0011_position_and_type.sql` (gerado, ver Step 5)

**Interfaces:**
- Consumes: nada (schema é a base).
- Produces: `characters` table com `position_x: integer`, `position_y: integer`, `type: varchar(20)` (default `'PC'`), sem `zone_id`; `EStatusEffect` com 6 valores; `ECharacterType` com `PC`/`NPC`/`MONSTRO` (valores exatos `'PC' | 'NPC' | 'Monstro'`).

- [ ] **Step 1: Editar `db/schema/characters.ts`**

```ts
import { boolean, integer, jsonb, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { tables } from './tables';

export const characters = pgTable('characters', {
  id: serial('id').primaryKey(),
  table_id: integer('table_id').notNull().references(() => tables.id),
  name: varchar('name', { length: 100 }).notNull(),
  image_url: varchar('image_url', { length: 500 }),
  // Tipo do personagem — replica o campo único do canvas (PC/NPC/Monstro em
  // vez do antigo par kind character/npc). Puramente organizacional/visual
  // (badge de tipo), sem regra de jogo diferente entre os 3 valores.
  type: varchar('type', { length: 20 }).notNull().default('PC'),
  // Posicionamento livre no tabuleiro (substitui zone_id/table_zones — canvas
  // usa drag livre com snap de 60px feito no client). Em pixels, relativo ao
  // container do tabuleiro.
  position_x: integer('position_x').notNull().default(20),
  position_y: integer('position_y').notNull().default(20),
  hp_current: integer('hp_current').notNull().default(0),
  hp_max: integer('hp_max').notNull().default(1),
  extra_hp: integer('extra_hp').notNull().default(0),
  // Array of EStatusEffect string slugs — 6 estados fixos (ver
  // resources/character/enums/StatusEffect.ts).
  status_effects: jsonb('status_effects').notNull().default([]),
  visible: boolean('visible').notNull().default(true),
  has_mana: boolean('has_mana').notNull().default(false),
  mana_current: integer('mana_current').notNull().default(0),
  mana_max: integer('mana_max').notNull().default(0),
  class_id: integer('class_id'),
  species_id: integer('species_id'),
  origin_id: integer('origin_id'),
  level: integer('level').notNull().default(1),
  attributes: jsonb('attributes'),
  created_at: timestamp('created_at'),
  updated_at: timestamp('updated_at'),
});
```

- [ ] **Step 2: Apagar `db/schema/table_zones.ts` e atualizar o barrel**

```bash
git rm db/schema/table_zones.ts
```

`db/schema/index.ts`:
```ts
export * from './tables';
export * from './characters';
export * from './character_templates';
export * from './classes';
export * from './species';
export * from './origins';
```

- [ ] **Step 3: Criar `ECharacterType` e expandir `EStatusEffect`**

`resources/character/enums/CharacterType.ts`:
```ts
// Tipo do personagem — mesmo campo único que o canvas usa (badge de tipo na
// carta: type-PC/type-NPC/type-Monstro). Puramente organizacional, sem regra
// de jogo diferente entre os 3.
export enum ECharacterType {
  PC = 'PC',
  NPC = 'NPC',
  MONSTRO = 'Monstro',
}
```

`resources/character/enums/StatusEffect.ts`:
```ts
// Slugs fixos de condição/estado persistidos em `characters.status_effects`
// (jsonb, array de strings deste enum). 6 estados — cada um com
// ícone/animação próprios (ver StatusEffectVisual.ts / StatusEffectBadge.tsx),
// espelhando as 6 condições do canvas `Storyweaver.dc.html` (CONDITIONS,
// linhas 1075-1082).
export enum EStatusEffect {
  ATORDOADO = 'atordoado',
  ENVENENADO = 'envenenado',
  PRESO = 'preso',
  SANGRANDO = 'sangrando',
  DORMINDO = 'dormindo',
  ENFEITICADO = 'enfeiticado',
}
```

- [ ] **Step 4: Apagar os arquivos de zona que não existem mais**

```bash
git rm resources/table/models/TableZone.ts
git rm resources/table/services/createZone.ts
git rm resources/table/services/deleteZone.ts
git rm -r app/api/tables/[code]/zones
```

- [ ] **Step 5: Gerar e aplicar a migration**

```bash
npx drizzle-kit generate
```

Se o prompt de rename-detection travar (mesmo bug documentado no projeto de referência), responda que `zone_id` foi REMOVIDO (não renomeado) e que `position_x`/`position_y`/`type` são colunas NOVAS.

Aplicar no Postgres local (`docker compose -f docker-compose.local.yml up -d storyweaver-postgres` se ainda não estiver rodando):

```bash
docker compose -f docker-compose.local.yml exec -T storyweaver-postgres psql -U postgres -d storyweaver -f - < db/migrations/0011_position_and_type.sql
```

Se `npm run db:migrate` pular a migration silenciosamente (bug de `MAX(created_at)` já documentado no projeto), aplique o SQL manualmente via `psql` como acima e registre a linha em `drizzle.__drizzle_migrations` com um `created_at` maior que o da migration anterior (mesmo procedimento já usado nas migrations `0002`-`0010` do projeto de referência).

- [ ] **Step 6: Verificar a migration**

```bash
docker compose -f docker-compose.local.yml exec -T storyweaver-postgres psql -U postgres -d storyweaver -c "\d characters"
```

Expected: colunas `type`, `position_x`, `position_y` presentes; `zone_id` ausente; `table_zones` não existe mais (`\dt` não lista).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: replace zones with free positioning, add character type, expand status effects to 6"
```

---

### Task 3: Atualizar models e API pra `position_x`/`position_y`/`type`

**Files:**
- Modify: `resources/character/models/Character.ts`
- Modify: `resources/character/services/createCharacter.ts`
- Modify: `resources/character/services/updateCharacter.ts`
- Modify: `resources/table/services/getTable.ts`
- Modify: `app/api/tables/[code]/route.ts`
- Modify: `app/api/tables/[code]/characters/route.ts`
- Modify: `app/api/tables/[code]/characters/[id]/route.ts`
- Modify: `app/api/tables/[code]/characters/[id]/actions/route.ts`

**Interfaces:**
- Consumes: `ECharacterType` (Task 2), `EStatusEffect` (Task 2, 6 valores).
- Produces: `ICharacterMaster`/`ICharacterDisplay` com `type: \`${ECharacterType}\``, `position_x: number`, `position_y: number` (em vez de `zone_id`); `GetTableServiceResponse` sem `zones`.

- [ ] **Step 1: `resources/character/models/Character.ts`**

Substituir o campo `zone_id: number;` em `ICharacterBase` por:

```ts
  type: `${import('../enums/CharacterType').ECharacterType}`;
  position_x: number;
  position_y: number;
```

(Import real no topo do arquivo: `import type { ECharacterType } from '../enums/CharacterType';` e usar `type: \`${ECharacterType}\`;` normalmente — sem `import()` inline.)

Arquivo completo resultante:

```ts
import type { ECharacterType } from '../enums/CharacterType';
import type { EStatusEffect } from '../enums/StatusEffect';
import type { ICharacterAttributes } from './RulesContent';

interface ICharacterBase {
  id: number;
  table_id: number;
  name: string;
  image_url: string | null;
  type: `${ECharacterType}`;
  // Posição livre no tabuleiro, em pixels. Seguro em ambos os formatos — não
  // é um número de jogo, é só organização visual (mesmo raciocínio que
  // zone_id tinha antes).
  position_x: number;
  position_y: number;
  status_effects: EStatusEffect[];
  created_at: string | null;
  updated_at: string | null;
}

interface ICharacterMana {
  has_mana: boolean;
  mana_current: number;
  mana_max: number;
}

export interface ICharacterMaster extends ICharacterBase, ICharacterMana {
  hp_current: number;
  hp_max: number;
  extra_hp: number;
  visible: boolean;
  class_id: number | null;
  species_id: number | null;
  origin_id: number | null;
  level: number;
  attributes: ICharacterAttributes | null;
}

export interface ICharacterDisplay extends ICharacterBase, ICharacterMana {
  hp_color: string;
  is_defeated: boolean;
}
```

- [ ] **Step 2: `resources/character/services/createCharacter.ts`**

```ts
import { appClient } from '@/utils/app-client';
import { PayloadBody } from '@/shared/types/api';
import type { ICharacterMaster } from '../models/Character';
import type { ECharacterType } from '../enums/CharacterType';
import type { EStatusEffect } from '../enums/StatusEffect';

export type CreateCharacterServicePayload = {
  name: string;
  image_url?: string | null;
  type?: `${ECharacterType}`;
  position_x?: number;
  position_y?: number;
  hp_current?: number;
  hp_max?: number;
  extra_hp?: number;
  status_effects?: EStatusEffect[];
  visible?: boolean;
  has_mana?: boolean;
  mana_current?: number;
  mana_max?: number;
  class_id?: number | null;
  species_id?: number | null;
  origin_id?: number | null;
  level?: number;
  attributes?: import('./../models/RulesContent').ICharacterAttributes | null;
};

export function createCharacterService({ code, body }: PayloadBody<CreateCharacterServicePayload> & { code: string }) {
  return appClient.post<ICharacterMaster>(`/api/tables/${code}/characters`, { body });
}
```

- [ ] **Step 3: `resources/character/services/updateCharacter.ts`**

Trocar `zone_id?: number;` por `position_x?: number; position_y?: number; type?: \`${ECharacterType}\`;` (mesmo padrão de import do `ECharacterType`).

- [ ] **Step 4: `resources/table/services/getTable.ts`**

Remover `zones: ITableZone[];` do tipo `GetTableServiceResponse` e o import de `ITableZone`:

```ts
import { appClient } from '@/utils/app-client';
import { QueryFnCtx } from '@/shared/types/tanstack';
import type { ICharacterDisplay, ICharacterMaster } from '@/resources/character/models/Character';
import type { ITable } from '../models/Table';

export type GetTableServiceResponse = {
  table: ITable;
  you: { is_master: boolean };
  characters: ICharacterMaster[] | ICharacterDisplay[];
};

export const GET_TABLE_KEY = (code: string, forceDisplay = false) => [
  'get-table',
  code,
  forceDisplay ? 'display' : 'auto',
];

export function getTableService({
  signal,
  code,
  forceDisplay = false,
}: QueryFnCtx & { code: string; forceDisplay?: boolean }) {
  const query = forceDisplay ? '?view=display' : '';

  return appClient.get<GetTableServiceResponse>(`/api/tables/${code}${query}`, { signal });
}
```

- [ ] **Step 5: `app/api/tables/[code]/route.ts` (GET) — remover zonas, mapear posição/tipo**

Remover o import de `tableZones`/`ITableZone`, o bloco `zoneRows`/`zoneList`, e `zones: zoneList` do JSON final. Em `characterList`, trocar `zone_id: c.zone_id,` por `type: c.type as \`${import('@/resources/character/enums/CharacterType').ECharacterType}\`, position_x: c.position_x, position_y: c.position_y,` (import real no topo: `import type { ECharacterType } from '@/resources/character/enums/CharacterType';`) em AMBOS os branches (`ICharacterMaster` e `ICharacterDisplay`). `data:` final vira `{ table, you: { is_master: isMaster }, characters: characterList }`.

- [ ] **Step 6: `app/api/tables/[code]/characters/route.ts` (POST)**

- Remover import de `tableZones`.
- Remover todo o bloco de resolução de `zoneId` (linhas do `let zoneId` até o `if (zoneId === null) { ... }`).
- Em `toCharacterMaster`, trocar `zone_id: c.zone_id,` por `type: c.type as \`${ECharacterType}\`, position_x: c.position_x, position_y: c.position_y,` (import `ECharacterType`).
- No `db.insert(characters).values({...})`, trocar `zone_id: zoneId,` por:

```ts
      type: typeof body.type === 'string' && ['PC', 'NPC', 'Monstro'].includes(body.type) ? body.type : 'PC',
      position_x: typeof body.position_x === 'number' ? body.position_x : 20,
      position_y: typeof body.position_y === 'number' ? body.position_y : 20,
```

Remover também a checagem de "Mesa sem nenhuma divisão" (não existe mais o conceito de zona obrigatória).

- [ ] **Step 7: `app/api/tables/[code]/characters/[id]/route.ts` (PATCH)**

- Remover import de `tableZones`, a função `invalidZone()`, e o bloco `if (typeof body.zone_id === 'number') { ... }`.
- Substituir por:

```ts
    if (typeof body.type === 'string' && ['PC', 'NPC', 'Monstro'].includes(body.type)) updates.type = body.type;
    if (typeof body.position_x === 'number') updates.position_x = body.position_x;
    if (typeof body.position_y === 'number') updates.position_y = body.position_y;
```

- Em `toCharacterMaster`, mesma troca do Step 6.

- [ ] **Step 8: `app/api/tables/[code]/characters/[id]/actions/route.ts`**

Em `toCharacterMaster`, mesma troca do Step 6 (`zone_id` → `type`/`position_x`/`position_y`).

- [ ] **Step 9: Verificar**

Run: `npx tsc --noEmit`
Expected: zero erros em `app/api/**`, `resources/character/**`, `resources/table/**`.

Run (com `storyweaver-postgres` no ar e `next dev` rodando):
```bash
curl -X POST http://localhost:3000/api/tables -H "Content-Type: application/json" -d '{"name":"Mesa de teste"}' -c /tmp/cj.txt
```
Expected: `{ "success": true, ..., "data": { "code": "...", "master_key": "..." } }`.

```bash
CODE=<code retornado acima>
curl -X POST http://localhost:3000/api/tables/$CODE/characters -H "Content-Type: application/json" -b /tmp/cj.txt -d '{"name":"Teste","type":"Monstro","position_x":100,"position_y":40,"hp_max":10}'
```
Expected: `data.type === "Monstro"`, `data.position_x === 100`, `data.position_y === 40`, nenhum campo `zone_id`.

```bash
curl http://localhost:3000/api/tables/$CODE
```
Expected: `data.characters[0]` tem `type`/`position_x`/`position_y`; nenhum campo `zones` na raiz de `data`.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: wire position/type fields through models, services and API routes"
```

---

## Fase 2 — Fundação visual

### Task 4: Fontes, tokens de cor, `globals.css`

**Files:**
- Modify: `libs/fonts.ts`
- Create: `libs/vilgard-colors.ts`
- Modify: `tailwind.config.mjs`
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

**Interfaces:**
- Produces: classes utilitárias Tailwind `bg-vg-bg`/`bg-vg-bg2`/`bg-vg-bg3`/`text-vg-gold`/`text-vg-gold-light`/`border-vg-gold-dim`/`text-vg-maroon-light`/`text-vg-text-dim`/`text-vg-text-faint`/`border-vg-border`/`bg-vg-mana` (paleta do canvas); classes globais `.btn`/`.btn-primary`/`.btn-ghost`/`.btn-danger`/`.field`/`.icon-btn` disponíveis para as primitivas da Task 5; fontes `--font-display` (Cinzel) e `--font-body` (EB Garamond) em `<html>`.

- [ ] **Step 1: `libs/fonts.ts`**

```ts
import { Cinzel, EB_Garamond } from 'next/font/google';

// Fontes do canvas Storyweaver.dc.html (linha 12): Cinzel para headings,
// EB Garamond para corpo. Self-hosted via next/font, expostas como CSS custom
// properties aplicadas em <html> por app/layout.tsx.
export const fontDisplay = Cinzel({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

export const fontBody = EB_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-body',
  display: 'swap',
});
```

- [ ] **Step 2: `libs/vilgard-colors.ts`**

```ts
// Paleta exata do canvas Storyweaver.dc.html (linhas 16-24). Fonte única —
// nunca hard-code esses hex em outro arquivo, sempre importe daqui ou use os
// tokens Tailwind `vg-*` (ver tailwind.config.mjs).
export const VG_BG = '#161009';
export const VG_BG2 = '#1f1610';
export const VG_BG3 = '#2a1d13';
export const VG_GOLD = '#c9a227';
export const VG_GOLD_LIGHT = '#e8cf7c';
export const VG_GOLD_DIM = '#8a6d24';
export const VG_MAROON = '#7a2430';
export const VG_MAROON_LIGHT = '#a83f4a';
export const VG_TEXT = '#ece3d1';
export const VG_TEXT_DIM = '#b7a888';
export const VG_TEXT_FAINT = '#8b7c5e';
export const VG_BORDER = '#5a4324';
export const VG_MANA_BLUE = '#4a8cc7';
```

- [ ] **Step 3: `tailwind.config.mjs`**

```js
import {
  VG_BG, VG_BG2, VG_BG3, VG_GOLD, VG_GOLD_LIGHT, VG_GOLD_DIM,
  VG_MAROON, VG_MAROON_LIGHT, VG_TEXT, VG_TEXT_DIM, VG_TEXT_FAINT,
  VG_BORDER, VG_MANA_BLUE,
} from './libs/vilgard-colors';

export default {
  theme: {
    extend: {
      colors: {
        'vg-bg': VG_BG,
        'vg-bg2': VG_BG2,
        'vg-bg3': VG_BG3,
        'vg-gold': VG_GOLD,
        'vg-gold-light': VG_GOLD_LIGHT,
        'vg-gold-dim': VG_GOLD_DIM,
        'vg-maroon': VG_MAROON,
        'vg-maroon-light': VG_MAROON_LIGHT,
        'vg-text': VG_TEXT,
        'vg-text-dim': VG_TEXT_DIM,
        'vg-text-faint': VG_TEXT_FAINT,
        'vg-border': VG_BORDER,
        'vg-mana': VG_MANA_BLUE,
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'serif'],
      },
    },
  },
};
```

- [ ] **Step 4: `app/globals.css`**

Copiar literalmente do canvas (`Site RPG com painéis interativos/Storyweaver.dc.html`):
- Linhas 16-24 (`:root{...}`) — variáveis CSS cruas (mantidas ADEMAIS dos tokens Tailwind, porque `box-shadow`/`animation` em CSS puro referenciam `var(--gold)` etc. diretamente).
- Linhas 25-31 (`@keyframes fadeUp/glowPulse/torchFlicker/portraitBreathe/hpBreathe`).
- Linhas 32-60 (`html{scroll-behavior...}`, `body{...background...}`, `a{}`, `h1,h2,h3,h4{}`, `.fade`, `.card-enter`, `.btn*`, `.field*`).
- Linha 61 (`.table-title-input*`), 67-79 (`.brand`, `.board`, `.card*`).

Resultado esperado (topo do arquivo, resto copiado das linhas indicadas):

```css
@import "tailwindcss";

:root{
  --bg:#161009; --bg2:#1f1610; --bg3:#2a1d13;
  --gold:#c9a227; --gold-light:#e8cf7c; --gold-dim:#8a6d24;
  --maroon:#7a2430; --maroon-light:#a83f4a;
  --text:#ece3d1; --text-dim:#b7a888; --text-faint:#8b7c5e;
  --border:#5a4324; --shadow-deep: 0 20px 50px rgba(0,0,0,.55), inset 0 0 0 1px rgba(201,162,39,.08);
  --heading: 'var(--font-display)', serif; --body: 'var(--font-body)', serif;
  --mana-blue:#4a8cc7;
}
@keyframes fadeUp { from { opacity:0; } to { opacity:1; } }
@keyframes glowPulse { 0%,100% { opacity:.5; } 50% { opacity:1; } }
@keyframes torchFlicker { 0%,100%{opacity:.9} 45%{opacity:1} 50%{opacity:.75} 55%{opacity:1} }
@keyframes portraitBreathe { 0%,100%{ transform:scale(1); } 50%{ transform:scale(1.05); } }
@keyframes hpBreathe { 0%,100%{ box-shadow:0 0 0 1px rgba(0,0,0,.4), 0 12px 26px rgba(0,0,0,.5), 0 0 14px var(--hp-glow-a), inset 0 0 16px var(--hp-glow-a); } 50%{ box-shadow:0 0 0 1px rgba(0,0,0,.4), 0 12px 26px rgba(0,0,0,.5), 0 0 28px var(--hp-glow-b), inset 0 0 24px var(--hp-glow-b); } }
html{scroll-behavior:smooth}
body{margin:0;min-height:100vh;background:
  radial-gradient(900px 500px at 10% -10%, rgba(122,36,48,.16), transparent 60%),
  radial-gradient(1100px 700px at 90% 0%, rgba(201,162,39,.09), transparent 60%),
  linear-gradient(rgba(10,7,4,.88), rgba(10,7,4,.93)),
  url('/assets/mountain-bg.png');
  background-size:cover; background-position:center top; background-attachment:fixed;
  font-family:var(--body); color:var(--text);
}
a{color:var(--gold-light)}
a:hover{color:var(--gold)}
h1,h2,h3,h4{font-family:var(--heading);font-weight:600;margin:0}
.fade{animation:fadeUp .5s cubic-bezier(.16,1,.3,1) forwards}
.btn{font-family:var(--heading);font-size:12.5px;letter-spacing:.06em;text-transform:uppercase;padding:9px 16px;
  border-radius:3px;cursor:pointer;transition:all .2s ease;display:inline-flex;align-items:center;justify-content:center;gap:7px;border:1px solid var(--gold-dim);background:transparent;color:var(--text-dim)}
.btn-primary{background:linear-gradient(to bottom, rgba(201,162,39,.16), rgba(201,162,39,.05));color:var(--gold-light);border-color:var(--gold)}
.btn-primary:hover{background:linear-gradient(to bottom, rgba(201,162,39,.28), rgba(201,162,39,.1));box-shadow:0 0 18px rgba(201,162,39,.22)}
.btn-ghost{border-color:var(--border)}
.btn-ghost:hover{border-color:var(--gold-dim);color:var(--gold-light)}
.btn-danger{border-color:var(--maroon-light);color:var(--maroon-light)}
.btn-danger:hover{background:rgba(168,63,74,.15)}
.field{background:rgba(0,0,0,.3);border:1px solid var(--border);border-radius:3px;color:var(--text);padding:8px 10px;font-family:var(--body);font-size:14px}
.field::placeholder{color:var(--text-faint)}
.field:focus{outline:none;border-color:var(--gold-dim)}
.icon-btn{background:none;border:none;color:var(--text-faint);cursor:pointer;font-size:16px;padding:2px;transition:color .15s ease}
.icon-btn:hover{color:var(--gold-light)}
.switch{display:flex;align-items:center;cursor:pointer;user-select:none}
.switch-track{width:30px;height:16px;border-radius:8px;background:rgba(0,0,0,.4);border:1px solid var(--border);position:relative;transition:border-color .2s ease}
.switch-track.on{border-color:var(--gold)}
.switch-dot{position:absolute;top:1px;left:1px;width:12px;height:12px;border-radius:50%;background:var(--text-faint);transition:transform .2s ease,background .2s ease}
.switch-track.on .switch-dot{transform:translateX(14px);background:var(--gold-light)}
```

- [ ] **Step 5: Copiar assets do canvas para `public/`**

```bash
mkdir -p public/assets
cp "Site RPG com painéis interativos/assets/mountain-bg.png" public/assets/
cp "Site RPG com painéis interativos/assets/table-bg.jpg" public/assets/
cp "Site RPG com painéis interativos/assets/chain.png" public/assets/
```

- [ ] **Step 6: `app/layout.tsx`**

```tsx
import type { Metadata } from 'next';
import { fontBody, fontDisplay } from '@/libs/fonts';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Storyweaver',
  description: 'Gerenciador de mesa de RPG para o Mestre administrar personagens e fichas em tempo real.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${fontDisplay.variable} ${fontBody.variable}`}
    >
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 7: `app/providers.tsx` (sem Mantine, só TanStack Query)**

```tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

- [ ] **Step 8: Instalar `@phosphor-icons/react`**

```bash
npm install @phosphor-icons/react
```

- [ ] **Step 9: Verificar**

Run: `npm run dev`, abrir `http://localhost:3000` no browser.
Expected: fundo de montanha com vinheta escura visível, sem erro no console, sem classes Mantine carregadas.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: design foundation - fonts, vilgard color tokens, base CSS from canvas"
```

---

### Task 5: Primitivas — Button, Field, IconButton, Switch, Modal, Chip

**Files:**
- Create: `components/vilgard/Button.tsx`
- Create: `components/vilgard/Field.tsx`
- Create: `components/vilgard/IconButton.tsx`
- Create: `components/vilgard/Switch.tsx`
- Create: `components/vilgard/Modal.tsx`
- Create: `components/vilgard/Chip.tsx`
- Modify: `app/globals.css` (adicionar classes de modal usadas pelo `Modal.tsx`)

**Interfaces:**
- Produces:
  - `Button({ variant?: 'primary' | 'ghost' | 'danger', children, onClick, type, disabled, style, className })`
  - `Field(props: React.InputHTMLAttributes<HTMLInputElement>)` (input) e `FieldSelect`/`FieldTextarea` variantes com a mesma classe `.field`
  - `IconButton({ icon: ReactNode, onClick, title, className })`
  - `Switch({ checked, onChange })`
  - `Modal({ open, onClose, children, fullscreen? })`
  - `Chip({ color, icon, children, onRemove? })`

- [ ] **Step 1: `components/vilgard/Button.tsx`**

```tsx
'use client';

type ButtonVariant = 'primary' | 'ghost' | 'danger';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
};

export function Button({ variant = 'ghost', className = '', ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      className={`btn ${VARIANT_CLASS[variant]} ${className}`}
      {...rest}
    />
  );
}
```

- [ ] **Step 2: `components/vilgard/Field.tsx`**

```tsx
'use client';

export function Field(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = '', ...rest } = props;

  return (
    <input
      className={`field ${className}`}
      {...rest}
    />
  );
}

export function FieldSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = '', ...rest } = props;

  return (
    <select
      className={`field ${className}`}
      {...rest}
    />
  );
}

export function FieldTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = '', ...rest } = props;

  return (
    <textarea
      className={`field ${className}`}
      {...rest}
    />
  );
}
```

- [ ] **Step 3: `components/vilgard/IconButton.tsx`**

```tsx
'use client';

type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: React.ReactNode;
};

export function IconButton({ icon, className = '', ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      className={`icon-btn ${className}`}
      {...rest}
    >
      {icon}
    </button>
  );
}
```

- [ ] **Step 4: `components/vilgard/Switch.tsx`**

```tsx
'use client';

export function Switch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <label
      className="switch"
      onClick={onChange}
    >
      <div className={`switch-track ${checked ? 'on' : ''}`}>
        <div className="switch-dot" />
      </div>
    </label>
  );
}
```

- [ ] **Step 5: `components/vilgard/Modal.tsx`**

Adicionar em `app/globals.css` (copiado do canvas linhas 408-412):

```css
.card-modal-backdrop{position:absolute;inset:0;z-index:20;background:rgba(6,4,2,.82);display:flex;align-items:center;justify-content:center;border-radius:8px;animation:fadeUp .18s ease both;cursor:pointer}
.card-modal-backdrop.fullscreen{position:fixed;inset:0;border-radius:0;z-index:100}
.card-modal-box{cursor:default;width:78%;max-width:180px;background:linear-gradient(160deg, var(--bg3), var(--bg2));border:1px solid var(--gold-dim);border-radius:8px;padding:14px;display:flex;flex-direction:column;gap:10px;box-shadow:0 0 30px rgba(201,162,39,.3), var(--shadow-deep)}
.card-modal-box.fullscreen{width:min(90vw,340px);max-width:none;max-height:85vh;overflow:auto}
.card-modal-box.fullscreen.edit-wide{width:min(92vw,420px)}
```

```tsx
'use client';

export function Modal({
  open,
  onClose,
  children,
  fullscreen = false,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  fullscreen?: boolean;
  wide?: boolean;
}) {
  if (!open) return null;

  return (
    <div
      className={`card-modal-backdrop ${fullscreen ? 'fullscreen' : ''}`}
      onClick={onClose}
    >
      <div
        className={`card-modal-box ${fullscreen ? 'fullscreen' : ''} ${wide ? 'edit-wide' : ''}`}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: `components/vilgard/Chip.tsx`**

Adicionar em `app/globals.css` (copiado do canvas linhas 96-99, 372-375):

```css
.chips{display:flex;flex-wrap:wrap;gap:6px;flex:1;min-height:0;overflow:hidden;align-content:flex-start}
.chip{font-size:11.5px;padding:4px 9px 4px 7px;border-radius:12px;border:1px solid color-mix(in srgb, var(--cond-color, var(--gold)) 55%, var(--border));color:color-mix(in srgb, var(--cond-color, var(--gold-light)) 75%, var(--text));display:inline-flex;align-items:center;gap:5px;background:color-mix(in srgb, var(--cond-color, var(--gold)) 16%, rgba(0,0,0,.2))}
.chip i, .chip svg{color:var(--cond-color, var(--gold))}
.chip button{background:none;border:none;color:inherit;opacity:.6;cursor:pointer;font-size:12px;padding:0;line-height:1}
.chip button:hover{opacity:1;color:var(--maroon-light)}
```

```tsx
'use client';

export function Chip({
  color,
  icon,
  children,
  onRemove,
}: {
  color?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onRemove?: () => void;
}) {
  return (
    <span
      className="chip"
      style={color ? ({ '--cond-color': color } as React.CSSProperties) : undefined}
    >
      {icon}
      <span>
        {children}
      </span>

      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
        >
          ✕
        </button>
      ) : null}
    </span>
  );
}
```

- [ ] **Step 7: Verificar visualmente**

Criar uma página de teste temporária `app/_primitives-test/page.tsx` renderizando um `Button` de cada variante, um `Field`, um `Switch`, um `Modal` aberto com um `Chip` dentro. Abrir no browser, confirmar visual batendo com o canvas (dourado sobre madeira escura, bordas finas). Apagar a página de teste depois de confirmar.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: vilgard UI primitives (Button, Field, IconButton, Switch, Modal, Chip)"
```

---

## Fase 3 — Tela do Mestre

### Task 6: `StatusEffectVisual` (6 condições) + `StatusEffectBadge`

**Files:**
- Modify: `resources/character/models/StatusEffectVisual.ts` (arquivo novo na raiz — não existe ainda, foi recriado do zero nesta fase; consultar `_reference-old-app/resources/character/models/StatusEffectVisual.ts` só para saber o formato de `IStatusEffectVisual` das 4 condições antigas)
- Create: `resources/character/components/StatusEffectBadge.tsx`

**Interfaces:**
- Consumes: `EStatusEffect` (6 valores, Task 2).
- Produces: `STATUS_EFFECT_VISUAL: Record<EStatusEffect, IStatusEffectVisual>`, `<StatusEffectBadge effect={EStatusEffect} size?={number} />`.

- [ ] **Step 1: `resources/character/models/StatusEffectVisual.ts`**

Dados exatos do canvas `CONDITIONS` (linhas 1075-1082), mapeados para `@phosphor-icons/react`:

```ts
import { EStatusEffect } from '../enums/StatusEffect';

export interface IStatusEffectVisual {
  label: string;
  color: string;
  iconName: 'Star' | 'Radioactive' | 'Link' | 'Drop' | 'MoonStars' | 'Sparkle';
}

export const STATUS_EFFECT_VISUAL: Record<EStatusEffect, IStatusEffectVisual> = {
  [EStatusEffect.ATORDOADO]: { label: 'Atordoado', color: '#d4b876', iconName: 'Star' },
  [EStatusEffect.ENVENENADO]: { label: 'Envenenado', color: '#7fa376', iconName: 'Radioactive' },
  [EStatusEffect.PRESO]: { label: 'Preso', color: '#a3927a', iconName: 'Link' },
  [EStatusEffect.SANGRANDO]: { label: 'Sangrando', color: '#b06868', iconName: 'Drop' },
  [EStatusEffect.DORMINDO]: { label: 'Dormindo', color: '#9088ab', iconName: 'MoonStars' },
  [EStatusEffect.ENFEITICADO]: { label: 'Enfeitiçado', color: '#b592ae', iconName: 'Sparkle' },
};
```

- [ ] **Step 2: `resources/character/components/StatusEffectBadge.tsx`**

```tsx
'use client';

import { Star, Radioactive, Link, Drop, MoonStars, Sparkle } from '@phosphor-icons/react';
import { EStatusEffect } from '../enums/StatusEffect';
import { STATUS_EFFECT_VISUAL } from '../models/StatusEffectVisual';

const ICONS = { Star, Radioactive, Link, Drop, MoonStars, Sparkle };

export function StatusEffectBadge({ effect, size = 20 }: { effect: EStatusEffect; size?: number }) {
  const visual = STATUS_EFFECT_VISUAL[effect];
  const IconComponent = ICONS[visual.iconName];

  return (
    <span
      className="cond-badge"
      style={{ '--cb-color': visual.color, width: size, height: size } as React.CSSProperties}
      title={visual.label}
    >
      <IconComponent
        weight="fill"
        size={size * 0.6}
      />
    </span>
  );
}
```

Adicionar em `app/globals.css` (copiado do canvas linhas 340-344):

```css
.cond-badge-row{position:absolute;top:34px;left:8px;z-index:3;display:flex;flex-direction:column;gap:6px;pointer-events:none}
@keyframes badgeGlow{0%,100%{box-shadow:0 0 6px var(--cb-color), 0 0 2px #fff, 0 1px 3px rgba(0,0,0,.7)}50%{box-shadow:0 0 16px var(--cb-color), 0 0 4px #fff, 0 1px 3px rgba(0,0,0,.7)}}
.cond-badge{border-radius:50%;display:flex;align-items:center;justify-content:center;
  background:color-mix(in srgb, var(--cb-color) 68%, #14100a);border:1.5px solid color-mix(in srgb, var(--cb-color) 85%, white 15%);color:#fff;
  animation:badgeGlow 1.8s ease-in-out infinite}
```

- [ ] **Step 3: Verificar**

Escrever teste manual: renderizar `<StatusEffectBadge effect={EStatusEffect.SANGRANDO} />` numa página de teste, confirmar glow vermelho pulsante.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: 6-state status effect visuals matching canvas CONDITIONS"
```

---

### Task 7: `ManaCrystals`

**Files:**
- Create: `resources/character/components/ManaCrystals.tsx`

**Interfaces:**
- Produces: `<ManaCrystals current={number} max={number} onPipClick?={(n: number) => void} />` — renderiza até 8 cristais (`Math.min(8, max)`), clicáveis se `onPipClick` for passado.

- [ ] **Step 1: Implementar**

Lógica de `manaPips` do canvas (linhas 1113-1117: `count = Math.min(8, manaMax)`, clique no cristal N seta mana para N (ou N-1 se já estava em N, permitindo "desmarcar")):

```tsx
'use client';

export function ManaCrystals({
  current,
  max,
  onPipClick,
  className = '',
}: {
  current: number;
  max: number;
  onPipClick?: (value: number) => void;
  className?: string;
}) {
  const count = max > 0 ? Math.min(8, max) : 0;

  if (count === 0) return null;

  return (
    <div className={`mana-crystals ${className}`}>
      {Array.from({ length: count }, (_, i) => {
        const filled = i < current;
        const n = i + 1;

        return (
          <span
            key={i}
            className={`crystal ${filled ? '' : 'empty'}`}
            style={{ '--delay': `${i * 0.18}s` } as React.CSSProperties}
            onClick={onPipClick ? (event) => {
              event.stopPropagation();
              onPipClick(current === n ? n - 1 : n);
            } : undefined}
          />
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: CSS (copiado do canvas linhas 334, 345-349, 257-260)**

Adicionar em `app/globals.css`:

```css
.mana-crystals{position:absolute;top:8px;right:8px;z-index:2;display:flex;flex-direction:column;gap:4px;align-items:flex-end}
@keyframes crystalGleam{0%,100%{transform:scale(1) rotate(0deg)}50%{transform:scale(1.15) rotate(-6deg)}}
.crystal{position:relative;width:12px;height:12px;cursor:pointer;font-size:10px;line-height:1;display:flex;align-items:center;justify-content:center;transition:transform .15s ease;filter:drop-shadow(0 0 3px rgba(74,140,199,.9));animation:crystalGleam 1.8s ease-in-out infinite;animation-delay:var(--delay,0s)}
.crystal::before{content:"\1F535"}
.crystal:hover{transform:scale(1.2)}
.crystal.empty{opacity:.28;filter:none;animation:none}
@keyframes fxManaPulse{0%{transform:scale(1)}35%{transform:scale(1.35)}100%{transform:scale(1)}}
.mana-crystals.fx-mana-gain .crystal,.mana-crystals.fx-mana-loss .crystal{animation:fxManaPulse .5s ease}
.mana-crystals.fx-mana-gain{filter:drop-shadow(0 0 8px #7cc4ff)}
.mana-crystals.fx-mana-loss{filter:drop-shadow(0 0 8px #5a4a8a)}
```

- [ ] **Step 3: Verificar e commitar**

```bash
git add -A
git commit -m "feat: ManaCrystals component matching canvas mana pips"
```

---

### Task 8: Carta do personagem com flip (frente + verso)

Este é o componente mais complexo — a carta que substitui `MasterToken`. Consultar `_reference-old-app/resources/character/components/MasterToken.tsx` só para lembrar quais props o resto do app espera de um "token de personagem" (não copiar visual de lá).

**Files:**
- Create: `resources/character/components/CharacterCard.tsx`
- Create: `resources/character/components/CharacterCard.module.css` (efeitos de condição — ver Step 3)

**Interfaces:**
- Consumes: `ICharacterMaster` (Task 3), `healthColor`/`healthPercent` (`resources/character/models/HealthColor.ts`, reaproveitado sem alteração), `ATTRIBUTE_ORDER`/`ATTRIBUTE_LABEL` (`resources/character/enums/Attribute.ts`, reaproveitado), `STATUS_EFFECT_VISUAL` (Task 6), `ManaCrystals` (Task 7).
- Produces:

```ts
export interface CharacterCardFx {
  type: 'damage' | 'heal' | 'mana-gain' | 'mana-loss';
  token: number; // valor aleatório único por disparo, pra permitir re-disparar o mesmo tipo em sequência
}

export interface CharacterCardProps {
  character: ICharacterMaster;
  fx: CharacterCardFx | null;
  onManaClick: (value: number) => void;
  onOpenDano: () => void;
  onOpenCura: () => void;
  onOpenVidaExtra: () => void;
  onOpenEstado: () => void;
  onOpenEdit: () => void;
  onToggleVisible: () => void;
  onRemove: () => void;
}
```
`<CharacterCard>` gerencia seu próprio estado de flip (`flipped: boolean`, clique na carta vira/desvira) — não é prop externa.

- [ ] **Step 1: Estrutura base + estado de flip + cálculo de vida**

```tsx
'use client';

import { useState } from 'react';
import { Sword, Heart, ShieldPlus, Sparkle, PencilSimple, Skull } from '@phosphor-icons/react';
import type { ICharacterMaster } from '../models/Character';
import { healthColor, healthPercent } from '../models/HealthColor';
import { ATTRIBUTE_ORDER, ATTRIBUTE_LABEL } from '../enums/Attribute';
import { EStatusEffect } from '../enums/StatusEffect';
import { STATUS_EFFECT_VISUAL } from '../models/StatusEffectVisual';
import { ManaCrystals } from './ManaCrystals';
import { StatusEffectBadge } from './StatusEffectBadge';

export interface CharacterCardFx {
  type: 'damage' | 'heal' | 'mana-gain' | 'mana-loss';
  token: number;
}

export interface CharacterCardProps {
  character: ICharacterMaster;
  fx: CharacterCardFx | null;
  onManaClick: (value: number) => void;
  onOpenDano: () => void;
  onOpenCura: () => void;
  onOpenVidaExtra: () => void;
  onOpenEstado: () => void;
  onOpenEdit: () => void;
  onToggleVisible: () => void;
  onRemove: () => void;
}

export function CharacterCard({
  character: c,
  fx,
  onManaClick,
  onOpenDano,
  onOpenCura,
  onOpenVidaExtra,
  onOpenEstado,
  onOpenEdit,
  onToggleVisible,
  onRemove,
}: CharacterCardProps) {
  const [flipped, setFlipped] = useState(false);

  const hpPct = healthPercent(c.hp_current, c.hp_max, c.extra_hp);
  const hpColor = healthColor(c.hp_current, c.hp_max, c.extra_hp);
  const manaPct = c.mana_max ? Math.round((c.mana_current / c.mana_max) * 100) : 0;
  const isNearDeath = hpPct > 0 && hpPct <= 20;
  const isDead = hpPct <= 0;

  const conditionClass = (condition: EStatusEffect) => c.status_effects.includes(condition);

  const fxClass = fx ? `fx-${fx.type}` : '';

  return (
    <div className="rpg-flip-viewport">
      <div className={`rpg-flip-inner ${flipped ? 'flipped' : ''}`}>
        {/* FRENTE */}
        <div
          className={`rpg-face rpg-front ${isNearDeath ? 'danger' : ''} ${conditionClass(EStatusEffect.SANGRANDO) ? 'bleed-flash' : ''} ${fxClass}`}
          style={{ borderColor: hpColor, '--hp-glow-a': `${hpColor}66`, '--hp-glow-b': `${hpColor}aa` } as React.CSSProperties}
          onClick={() => setFlipped(true)}
        >
          <div className={`rpg-portrait-fill ${isDead ? 'dead' : ''} ${conditionClass(EStatusEffect.ATORDOADO) ? 'dizzy' : ''} ${conditionClass(EStatusEffect.PRESO) ? 'trapped' : ''} ${conditionClass(EStatusEffect.ENFEITICADO) ? 'enchanted' : ''} ${conditionClass(EStatusEffect.DORMINDO) ? 'asleep' : ''}`}>
            {c.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={c.image_url}
                alt={c.name}
              />
            ) : null}
          </div>

          {conditionClass(EStatusEffect.PRESO) ? <div className="chain-border" /> : null}
          {conditionClass(EStatusEffect.SANGRANDO) ? (
            <div className="blood-fx">
              <span className="blood-drip bd1" />
              <span className="blood-drip bd3" />
              <span className="blood-drip bd5" />
            </div>
          ) : null}
          {conditionClass(EStatusEffect.ATORDOADO) ? (
            <div className="stun-orbit">
              <span className="stun-star s1">✦</span>
              <span className="stun-star s2">✧</span>
              <span className="stun-star s3">✦</span>
            </div>
          ) : null}
          {conditionClass(EStatusEffect.ENVENENADO) ? (
            <div className="toxic-gas">
              <span className="gas-blob g1" />
              <span className="gas-blob g2" />
              <span className="gas-blob g3" />
              <span className="gas-blob g4" />
            </div>
          ) : null}
          {conditionClass(EStatusEffect.DORMINDO) ? (
            <div className="zzz-fx">
              <span className="zzz z1">Zzz</span>
              <span className="zzz z2">Zz</span>
              <span className="zzz z3">Zzz</span>
            </div>
          ) : null}
          {conditionClass(EStatusEffect.ENFEITICADO) ? <div className="enchant-fx" /> : null}

          {isNearDeath ? (
            <span className="danger-badge">
              <Skull weight="fill" />
            </span>
          ) : null}

          <span className={`type-tag rpg-type-badge type-${c.type}`}>
            {c.type}
          </span>

          <ManaCrystals
            current={c.mana_current}
            max={c.mana_max}
            onPipClick={onManaClick}
            className={fx?.type === 'mana-gain' ? 'fx-mana-gain' : fx?.type === 'mana-loss' ? 'fx-mana-loss' : ''}
          />

          {c.status_effects.length > 0 ? (
            <div className="cond-badge-row">
              {c.status_effects.map((effect) => (
                <StatusEffectBadge
                  key={effect}
                  effect={effect}
                  size={23}
                />
              ))}
            </div>
          ) : null}

          <div className="rpg-bottom-stack">
            <span className="nm">
              {c.name}
            </span>

            <div className="rpg-hover-icons">
              <button
                className="hover-icon"
                style={{ '--act-color': '#a83f4a' } as React.CSSProperties}
                onClick={(e) => { e.stopPropagation(); onOpenDano(); }}
                title="Dano"
              >
                <Sword weight="fill" />
              </button>

              <button
                className="hover-icon"
                style={{ '--act-color': '#7a9b5c' } as React.CSSProperties}
                onClick={(e) => { e.stopPropagation(); onOpenCura(); }}
                title="Curar"
              >
                <Heart weight="fill" />
              </button>

              <button
                className="hover-icon"
                style={{ '--act-color': '#c9a227' } as React.CSSProperties}
                onClick={(e) => { e.stopPropagation(); onOpenVidaExtra(); }}
                title="Vida extra"
              >
                <ShieldPlus weight="fill" />
              </button>

              <button
                className="hover-icon"
                style={{ '--act-color': '#b592ae' } as React.CSSProperties}
                onClick={(e) => { e.stopPropagation(); onOpenEstado(); }}
                title="Estado"
              >
                <Sparkle weight="fill" />
              </button>
            </div>
          </div>
        </div>

        {/* VERSO */}
        <div
          className="rpg-face rpg-face-back"
          style={{ borderColor: hpColor, boxShadow: `0 0 14px ${hpColor}66` }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="rpg-back-head">
            <span className="rpg-back-name">
              {c.name}
            </span>

            <span className={`type-tag type-${c.type}`}>
              {c.type}
            </span>

            <button
              className="icon-btn edit-btn"
              onClick={onOpenEdit}
              title="Editar personagem"
            >
              <PencilSimple weight="bold" />
            </button>
          </div>

          <div className="stat-row-pair">
            <div className="stat-row">
              <div className="stat-label">
                <span>Vida</span>
                <span className="stat-nums">
                  {c.hp_current}/{c.hp_max}
                  {c.extra_hp > 0 ? <span style={{ color: 'var(--gold-light)' }}> +{c.extra_hp}</span> : null}
                </span>
              </div>

              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${hpPct}%`, background: hpColor }}
                />
              </div>
            </div>

            <div className="stat-row">
              <div className="stat-label">
                <span>Mana</span>
                <span className="stat-nums">{c.mana_current}/{c.mana_max}</span>
              </div>

              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${manaPct}%`, background: 'var(--mana-blue)' }}
                />
              </div>
            </div>
          </div>

          <div className="attr-grid">
            {c.attributes ? ATTRIBUTE_ORDER.map((attribute) => (
              <div
                key={attribute}
                className="attr-cell"
                title={ATTRIBUTE_LABEL[attribute]}
              >
                <span className="av">
                  {c.attributes![attribute]}
                </span>
              </div>
            )) : null}
          </div>

          <div className="chips">
            {c.status_effects.map((effect) => {
              const visual = STATUS_EFFECT_VISUAL[effect];

              return (
                <span
                  key={effect}
                  className="chip"
                  style={{ '--cond-color': visual.color } as React.CSSProperties}
                >
                  <span>{visual.label}</span>
                </span>
              );
            })}
          </div>

          <div className="card-foot">
            <div
              className="back-hover-icons"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="hover-icon"
                style={{ '--act-color': '#a83f4a' } as React.CSSProperties}
                onClick={onOpenDano}
                title="Dano"
              >
                <Sword weight="fill" />
              </button>

              <button
                className="hover-icon"
                style={{ '--act-color': '#7a9b5c' } as React.CSSProperties}
                onClick={onOpenCura}
                title="Curar"
              >
                <Heart weight="fill" />
              </button>

              <button
                className="hover-icon"
                style={{ '--act-color': '#c9a227' } as React.CSSProperties}
                onClick={onOpenVidaExtra}
                title="Vida extra"
              >
                <ShieldPlus weight="fill" />
              </button>

              <button
                className="hover-icon"
                style={{ '--act-color': '#b592ae' } as React.CSSProperties}
                onClick={onOpenEstado}
                title="Estado"
              >
                <Sparkle weight="fill" />
              </button>
            </div>

            <label
              className="switch"
              onClick={(e) => { e.stopPropagation(); onToggleVisible(); }}
            >
              <div className={`switch-track ${c.visible ? 'on' : ''}`}>
                <div className="switch-dot" />
              </div>
            </label>

            <button
              className="icon-btn"
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              title="Remover"
            >
              🗑
            </button>
          </div>

          <button
            className="wiz-back"
            onClick={() => setFlipped(false)}
            style={{ marginTop: 'auto' }}
          >
            Virar
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: CSS de flip/frente/verso/glow de perigo (copiado do canvas linhas 143-145, 238-266, 350-361)**

Adicionar em `app/globals.css`:

```css
.rpg-flip-viewport{position:absolute;inset:0;perspective:1400px}
.rpg-flip-inner{position:relative;width:100%;height:100%;transition:transform .55s cubic-bezier(.16,1,.3,1);transform-style:preserve-3d}
.rpg-flip-inner.flipped{transform:rotateY(180deg)}
.rpg-face{position:absolute;inset:0;backface-visibility:hidden;border-radius:8px;overflow:hidden}
.rpg-face-back{transform:rotateY(180deg);background:linear-gradient(160deg, var(--bg3), var(--bg2));border:2px solid var(--border);padding:9px;display:flex;flex-direction:column;gap:4px;overflow:hidden;cursor:default}
.rpg-front{border:4px solid var(--border);box-shadow:var(--shadow-deep);cursor:pointer;animation:hpBreathe 3.4s ease-in-out infinite;overflow:hidden}
@keyframes dangerPulse { 0%,100%{ box-shadow:0 0 0 1px rgba(0,0,0,.4), 0 12px 26px rgba(0,0,0,.5), 0 0 16px rgba(168,63,74,.55), inset 0 0 30px rgba(168,63,74,.3); } 50%{ box-shadow:0 0 0 1px rgba(0,0,0,.4), 0 12px 26px rgba(0,0,0,.5), 0 0 40px rgba(168,63,74,.95), inset 0 0 50px rgba(168,63,74,.55); } }
.rpg-front.danger{animation:dangerPulse 1.1s ease-in-out infinite;border-color:#a83f4a}
@keyframes dangerBadgePulse { 0%,100%{ transform:scale(1); opacity:.9 } 50%{ transform:scale(1.15); opacity:1 } }
.danger-badge{position:absolute;inset:0;z-index:3;display:flex;align-items:center;justify-content:center;color:rgba(240,184,189,.5);font-size:64%;pointer-events:none;animation:dangerBadgePulse 1.1s ease-in-out infinite}
.rpg-portrait-fill{position:absolute;inset:0;overflow:hidden}
.rpg-portrait-fill img{width:100%;height:100%;object-fit:cover;display:block;animation:portraitBreathe 9s ease-in-out infinite}
.rpg-portrait-fill.dead img{filter:grayscale(1) brightness(.7)}
.rpg-name-bar,.rpg-bottom-stack{position:absolute;left:0;right:0;bottom:0;z-index:6;display:flex;flex-direction:column;align-items:center;padding:10px 10px 0;background:linear-gradient(to top, rgba(10,7,4,.96) 40%, rgba(10,7,4,.65) 72%, transparent);overflow:visible}
.rpg-bottom-stack .nm{font-family:var(--heading);font-size:14.5px;color:var(--gold-light);line-height:1.2;text-shadow:0 2px 6px rgba(0,0,0,.9);display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%;text-align:center;padding-bottom:10px}
.rpg-hover-icons{display:flex;gap:6px;max-height:0;opacity:0;overflow:visible;pointer-events:none;margin-top:0;padding-bottom:0;transition:max-height .32s cubic-bezier(.16,1,.3,1), opacity .22s ease, margin-top .32s cubic-bezier(.16,1,.3,1), padding-bottom .32s cubic-bezier(.16,1,.3,1)}
.rpg-front:hover .rpg-hover-icons{max-height:36px;opacity:1;pointer-events:auto;margin-top:8px;padding-bottom:10px}
.hover-icon{width:30px;height:30px;border-radius:50%;background:radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--act-color, var(--gold)) 30%, #241a10), rgba(10,7,4,.85));border:2px solid var(--act-color, var(--gold));color:var(--act-color, var(--gold-light));display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;flex-shrink:0;box-shadow:0 0 10px color-mix(in srgb, var(--act-color, var(--gold)) 45%, transparent), 0 4px 10px rgba(0,0,0,.5)}
.back-hover-icons{display:flex;gap:6px;flex-shrink:0}
.back-hover-icons .hover-icon{width:24px;height:24px;font-size:11px}
.rpg-type-badge{position:absolute;top:8px;left:8px;z-index:2;background:rgba(10,7,4,.6)}
.type-tag{font-size:10px;letter-spacing:.08em;text-transform:uppercase;padding:1px 6px;border-radius:3px;display:inline-flex;width:fit-content}
.type-PC{background:rgba(201,162,39,.16);color:var(--gold-light);border:1px solid var(--gold-dim)}
.type-NPC{background:rgba(139,124,94,.16);color:var(--text-dim);border:1px solid var(--border)}
.type-Monstro{background:rgba(168,63,74,.18);color:var(--maroon-light);border:1px solid var(--maroon-light)}
.rpg-back-head{display:flex;align-items:center;gap:8px}
.rpg-back-name{flex:1;min-width:0;font-family:var(--heading);font-size:13.5px;color:var(--gold-light);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.stat-row-pair{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.stat-row{display:flex;flex-direction:column;gap:3px}
.stat-label{display:flex;justify-content:space-between;font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--text-faint)}
.stat-nums{font-variant-numeric:tabular-nums;color:var(--text-dim);font-size:9.5px}
.bar-track{height:8px;border-radius:4px;background:rgba(0,0,0,.4);overflow:hidden;border:1px solid var(--border)}
.bar-fill{height:100%;border-radius:4px;transition:width .3s ease, background .3s ease}
.attr-grid{display:grid;grid-template-columns:1fr 1fr;gap:3px}
.attr-cell{display:flex;align-items:center;justify-content:center;font-size:11px;background:rgba(0,0,0,.22);border:1px solid var(--border);border-radius:4px;padding:4px 5px;color:var(--text-dim)}
.av{font-family:var(--heading);color:var(--gold-light);font-size:12.5px;font-variant-numeric:tabular-nums}
.card-foot{display:flex;align-items:center;justify-content:space-between;gap:6px;flex-shrink:0;padding-top:5px;border-top:1px solid var(--border)}
```

- [ ] **Step 3: Efeitos de condição restantes (correntes, gás, órbita, zzz, enchant, sangue) — copiar literalmente do canvas linhas 267-331 e 296-309**

Adicionar em `app/globals.css` exatamente os blocos entre as linhas 267-331 do canvas (`.rpg-portrait-fill.dizzy`, `.stun-orbit`/`.stun-star`, `.toxic-gas`/`.gas-blob`/`.toxic-icons`/`.gi*`, `.rpg-portrait-fill.trapped/.asleep`, `.zzz-fx`/`.zzz*`, `.rpg-portrait-fill.enchanted`, `.enchant-fx`, `.chain-fx`/`.chain-border`, `.blood-fx`, `.strobe-fx`, `.blood-drip`/`.bd1`-`.bd6`), trocando `image-slot` por `img` nos seletores (ex: `.rpg-portrait-fill.dizzy image-slot` vira `.rpg-portrait-fill.dizzy img`) e `url('assets/chain.png')` por `url('/assets/chain.png')`.

- [ ] **Step 4: Efeitos de dano/cura/mana (fx classes) — copiar do canvas linhas 250-261**

```css
@keyframes fxDamage{0%{transform:translateX(0)}15%{transform:translateX(-7px)}30%{transform:translateX(6px)}45%{transform:translateX(-4px)}60%{transform:translateX(3px)}75%{transform:translateX(-1px)}100%{transform:translateX(0)}}
.rpg-front.fx-damage{animation:fxDamage .5s ease}
.rpg-front.fx-damage::after{content:"";position:absolute;inset:0;z-index:15;pointer-events:none;background:rgba(216,64,64,.38);animation:fxFade .5s ease}
@keyframes fxHeal{0%{filter:brightness(1)}30%{filter:brightness(1.35)}100%{filter:brightness(1)}}
.rpg-front.fx-heal{animation:fxHeal .55s ease}
.rpg-front.fx-heal::after{content:"";position:absolute;inset:0;z-index:15;pointer-events:none;background:rgba(122,180,110,.32);animation:fxFade .55s ease}
@keyframes fxFade{0%{opacity:1}100%{opacity:0}}
```

- [ ] **Step 5: Verificar**

Renderizar `<CharacterCard>` numa página de teste com um personagem mock com `hp_current: 5, hp_max: 20` (deve ficar `danger`), `status_effects: [SANGRANDO]` (deve mostrar gotas de sangue), `mana_max: 4, mana_current: 2` (2 cristais cheios, 2 vazios). Clicar na carta → deve virar mostrando o verso com barras/atributos.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: CharacterCard with 3D flip, HP/mana bars, condition FX, matching canvas"
```

---

### Task 9: `TableBoard` — tabuleiro livre com drag + snap de 60px

**Files:**
- Create: `resources/character/components/TableBoard.tsx`

**Interfaces:**
- Consumes: `ICharacterMaster[]`.
- Produces:

```ts
export interface TableBoardProps {
  characters: ICharacterMaster[];
  renderCard: (character: ICharacterMaster) => React.ReactNode;
  onMove: (id: number, position_x: number, position_y: number) => void;
  cardScale?: number; // 0.55 a 1.15
}
```

- [ ] **Step 1: Implementar** (drag via pointer events, snap de 60px no `pointerup`, posição otimista durante o drag — mesmo algoritmo do canvas `beginDrag`, linhas 1200-1225)

```tsx
'use client';

import { useRef, useState } from 'react';
import type { ICharacterMaster } from '../models/Character';

export interface TableBoardProps {
  characters: ICharacterMaster[];
  renderCard: (character: ICharacterMaster) => React.ReactNode;
  onMove: (id: number, position_x: number, position_y: number) => void;
  cardScale?: number;
}

const CARD_W = 220;
const CARD_H = 315;

export function TableBoard({ characters, renderCard, onMove, cardScale = 1 }: TableBoardProps) {
  const [dragId, setDragId] = useState<number | null>(null);
  const [dragPos, setDragPos] = useState<Record<number, { x: number; y: number }>>({});
  const [isDragging, setIsDragging] = useState(false);
  const originRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  function beginDrag(character: ICharacterMaster, event: React.PointerEvent) {
    setDragId(character.id);
    setIsDragging(true);
    originRef.current = { x: character.position_x, y: character.position_y };
    startRef.current = { x: event.clientX, y: event.clientY };

    function onMoveHandler(ev: PointerEvent) {
      const dx = ev.clientX - startRef.current.x;
      const dy = ev.clientY - startRef.current.y;

      setDragPos((prev) => ({
        ...prev,
        [character.id]: {
          x: Math.max(0, originRef.current.x + dx),
          y: Math.max(0, originRef.current.y + dy),
        },
      }));
    }

    function onUpHandler() {
      window.removeEventListener('pointermove', onMoveHandler);
      window.removeEventListener('pointerup', onUpHandler);

      setDragPos((prev) => {
        const p = prev[character.id];

        if (p) {
          const snapped = { x: Math.round(p.x / 60) * 60, y: Math.round(p.y / 60) * 60 };

          onMove(character.id, snapped.x, snapped.y);
        }

        return prev;
      });

      setDragId(null);
      setIsDragging(false);
    }

    window.addEventListener('pointermove', onMoveHandler);
    window.addEventListener('pointerup', onUpHandler);
  }

  return (
    <div className={`board gm-canvas ${isDragging ? 'is-dragging' : ''}`}>
      {characters.map((character) => {
        const pos = dragPos[character.id] ?? { x: character.position_x, y: character.position_y };

        return (
          <div
            key={character.id}
            className={`rpg-card-shell ${dragId === character.id ? 'dragging' : ''}`}
            style={{
              left: pos.x,
              top: pos.y,
              width: Math.round(CARD_W * cardScale),
              height: Math.round(CARD_H * cardScale),
            }}
          >
            <button
              className="move-handle"
              onPointerDown={(event) => beginDrag(character, event)}
              title="Mover"
            >
              ⤧
            </button>

            <div style={{ transform: `scale(${cardScale})`, transformOrigin: 'top left', width: CARD_W, height: CARD_H }}>
              {renderCard(character)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: CSS (copiado do canvas linhas 68-77, 144-145, 73-76)**

```css
.board{max-width:1400px;min-height:calc(100vh - 68px);margin:0 auto;padding:24px 28px 60px;position:relative}
.board.gm-canvas::before{content:"";position:absolute;inset:0;pointer-events:none;z-index:0;opacity:0;transition:opacity .35s ease;background-image:linear-gradient(color-mix(in srgb, var(--border) 55%, transparent) 1px, transparent 1px),linear-gradient(90deg, color-mix(in srgb, var(--border) 55%, transparent) 1px, transparent 1px);background-size:60px 60px}
.board.gm-canvas.is-dragging::before{opacity:1}
.move-handle{position:absolute;top:-10px;left:50%;transform:translateX(-50%);z-index:6;width:26px;height:26px;border-radius:50%;border:1px solid var(--border);background:var(--bg2);color:var(--text-dim);display:flex;align-items:center;justify-content:center;cursor:grab;opacity:0;transition:opacity .18s ease;pointer-events:none}
.rpg-card-shell:hover .move-handle{opacity:1;pointer-events:auto}
.rpg-card-shell{position:absolute;cursor:pointer;transition:transform .28s cubic-bezier(.16,1,.3,1), opacity .28s ease}
.rpg-card-shell.dragging{cursor:grabbing;z-index:20;transition:none !important}
.rpg-card-shell:hover{transform:scale(1.09);z-index:2}
```

- [ ] **Step 3: Verificar**

Renderizar `TableBoard` com 3 personagens mock em posições diferentes; arrastar um pelo `move-handle`; confirmar que a grade pontilhada aparece durante o drag e que a posição final é múltiplo de 60.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: TableBoard with free drag + 60px snap, matching canvas gm-canvas"
```

---

### Task 10: Modais de ação (Dano/Cura/Vida extra/Estado)

**Files:**
- Create: `resources/character/components/ActionModals.tsx`

**Interfaces:**
- Consumes: `applyCharacterActionService` (`resources/character/services/applyCharacterAction.ts`, reaproveitado sem alteração), `EStatusEffect` (6 valores), `updateCharacterService` (pra `status_effects`).
- Produces:

```ts
export type ActionModalKind = 'dano' | 'cura' | 'vida-extra' | 'estado' | null;

export interface ActionModalsProps {
  code: string;
  character: ICharacterMaster | null;
  open: ActionModalKind;
  onClose: () => void;
  onApplied: () => void; // chamado depois de qualquer mutation bem-sucedida (deixa a Tela do Mestre disparar o fx de dano/cura via onCharacterAction do useTableStream — não precisa fazer nada aqui além de fechar)
}
```

- [ ] **Step 1: Implementar (4 modais, um por `open`)**

```tsx
'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sword, Heart, ShieldPlus, Sparkle, Plus, Minus, Check } from '@phosphor-icons/react';
import { Modal } from '@/components/vilgard/Modal';
import { Button } from '@/components/vilgard/Button';
import { Field } from '@/components/vilgard/Field';
import { applyCharacterActionService } from '../services/applyCharacterAction';
import { updateCharacterService } from '../services/updateCharacter';
import { GET_TABLE_KEY } from '@/resources/table/services/getTable';
import { EStatusEffect } from '../enums/StatusEffect';
import { STATUS_EFFECT_VISUAL } from '../models/StatusEffectVisual';
import type { ICharacterMaster } from '../models/Character';

export type ActionModalKind = 'dano' | 'cura' | 'vida-extra' | 'estado' | null;

export interface ActionModalsProps {
  code: string;
  character: ICharacterMaster | null;
  open: ActionModalKind;
  onClose: () => void;
  onApplied: () => void;
}

export function ActionModals({ code, character, open, onClose, onApplied }: ActionModalsProps) {
  const [amount, setAmount] = useState('');
  const queryClient = useQueryClient();

  const actionMutation = useMutation({
    mutationFn: (body: { type: 'damage' | 'heal' | 'extra-add' | 'extra-remove'; amount: number }) => {
      if (!character) return Promise.reject(new Error('sem personagem'));

      return applyCharacterActionService({ code, characterId: character.id, body });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GET_TABLE_KEY(code) });
      setAmount('');
      onApplied();
    },
  });

  const conditionMutation = useMutation({
    mutationFn: (status_effects: EStatusEffect[]) => {
      if (!character) return Promise.reject(new Error('sem personagem'));

      return updateCharacterService({ code, characterId: character.id, body: { status_effects } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GET_TABLE_KEY(code) });
    },
  });

  if (!character) return null;

  function toggleCondition(effect: EStatusEffect) {
    if (!character) return;

    const has = character.status_effects.includes(effect);
    const next = has ? character.status_effects.filter((e) => e !== effect) : [...character.status_effects, effect];

    conditionMutation.mutate(next);
  }

  return (
    <>
      <Modal
        open={open === 'dano'}
        onClose={onClose}
      >
        <p className="card-modal-title">
          <Sword weight="fill" />
          {`Aplicar dano em ${character.name}`}
        </p>

        <Field
          type="number"
          min={0}
          placeholder="Quantidade"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          autoFocus
        />

        <Button
          variant="primary"
          onClick={() => actionMutation.mutate({ type: 'damage', amount: Number(amount) || 0 })}
        >
          Aplicar dano
        </Button>
      </Modal>

      <Modal
        open={open === 'cura'}
        onClose={onClose}
      >
        <p className="card-modal-title">
          <Heart weight="fill" />
          {`Curar ${character.name}`}
        </p>

        <Field
          type="number"
          min={0}
          placeholder="Quantidade"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          autoFocus
        />

        <Button
          variant="primary"
          onClick={() => actionMutation.mutate({ type: 'heal', amount: Number(amount) || 0 })}
        >
          Aplicar cura
        </Button>
      </Modal>

      <Modal
        open={open === 'vida-extra'}
        onClose={onClose}
      >
        <p className="card-modal-title">
          <ShieldPlus weight="fill" />
          {`Vida extra de ${character.name}`}
        </p>

        <Field
          type="number"
          min={0}
          placeholder="Quantidade"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          autoFocus
        />

        <Button
          variant="primary"
          onClick={() => actionMutation.mutate({ type: 'extra-add', amount: Number(amount) || 0 })}
        >
          <Plus weight="bold" />
          Adicionar
        </Button>

        <Button
          variant="ghost"
          onClick={() => actionMutation.mutate({ type: 'extra-remove', amount: Number(amount) || 0 })}
        >
          <Minus weight="bold" />
          Retirar
        </Button>
      </Modal>

      <Modal
        open={open === 'estado'}
        onClose={onClose}
      >
        <p className="card-modal-title">
          <Sparkle weight="fill" />
          {`Estados de ${character.name}`}
        </p>

        <div className="cond-quick">
          {Object.values(EStatusEffect).map((effect) => {
            const visual = STATUS_EFFECT_VISUAL[effect];
            const active = character.status_effects.includes(effect);

            return (
              <button
                key={effect}
                className={`cond-chip-btn ${active ? 'active' : ''}`}
                style={{ '--cond-color': visual.color } as React.CSSProperties}
                onClick={() => toggleCondition(effect)}
              >
                {active ? <Check weight="bold" /> : null}
                {visual.label}
              </button>
            );
          })}
        </div>
      </Modal>
    </>
  );
}
```

- [ ] **Step 2: CSS (copiado do canvas linhas 358-370)**

```css
.card-modal-title{display:flex;align-items:center;gap:6px;font-family:var(--heading);font-size:12px;color:var(--gold-light);margin:0;line-height:1.3}
.estado-popover,.cond-quick{display:grid;grid-template-columns:1fr 1fr;gap:7px}
.cond-chip-btn{font-size:10.5px;padding:6px 8px;border-radius:6px;border:1px solid color-mix(in srgb, var(--cond-color) 55%, var(--border));background:color-mix(in srgb, var(--cond-color) 14%, rgba(0,0,0,.3));color:color-mix(in srgb, var(--cond-color) 70%, var(--text));cursor:pointer;transition:transform .15s ease, box-shadow .15s ease;display:flex;align-items:center;gap:6px}
.cond-chip-btn.active{background:color-mix(in srgb, var(--cond-color) 38%, rgba(0,0,0,.3));border-color:var(--cond-color);box-shadow:0 0 10px color-mix(in srgb, var(--cond-color) 50%, transparent)}
```

- [ ] **Step 3: Verificar**

Abrir cada um dos 4 modais numa página de teste com um personagem mock; confirmar que `applyCharacterActionService` é chamado com o `type` certo e que o modal de Estado alterna os 6 chips corretamente.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: action modals (damage/heal/extra HP/conditions) matching canvas"
```

---

### Task 11: Modal de edição (3 páginas: Identidade / Atributos / Perícias)

**Files:**
- Create: `resources/character/components/CharacterEditModal.tsx`

Consultar `_reference-old-app/resources/character/components/CharacterEditPanel.tsx` (funções `characterToFormState`/`characterFormStateToPayload`/`CharacterRulesSummary`) e `_reference-old-app/resources/character/components/ImageUploadInput.tsx` só para saber os nomes/contratos exatos — a UI é toda nova (3 páginas com dots, ver canvas linhas 921-1007).

**Interfaces:**
- Consumes: `updateCharacterService`, `uploadCharacterImageService`, `getClassesService`/`getSpeciesService`/`getOriginsService` (pros selects de identidade), `ATTRIBUTE_ORDER`.
- Produces: `<CharacterEditModal code open character onClose onSaved />`.

- [ ] **Step 1: Implementar (estado local de formulário + 3 páginas + dots)**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PencilSimple, Check, ArrowRight } from '@phosphor-icons/react';
import { Modal } from '@/components/vilgard/Modal';
import { Button } from '@/components/vilgard/Button';
import { Field, FieldSelect } from '@/components/vilgard/Field';
import { updateCharacterService } from '../services/updateCharacter';
import { getClassesService, GET_CLASSES_KEY } from '../services/getClasses';
import { getSpeciesService, GET_SPECIES_KEY } from '../services/getSpecies';
import { getOriginsService, GET_ORIGINS_KEY } from '../services/getOrigins';
import { GET_TABLE_KEY } from '@/resources/table/services/getTable';
import { ATTRIBUTE_ORDER, ATTRIBUTE_LABEL } from '../enums/Attribute';
import type { ICharacterMaster } from '../models/Character';
import type { ECharacterType } from '../enums/CharacterType';

export function CharacterEditModal({
  code,
  open,
  character,
  onClose,
}: {
  code: string;
  open: boolean;
  character: ICharacterMaster | null;
  onClose: () => void;
}) {
  const [page, setPage] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState('');
  const [type, setType] = useState<`${ECharacterType}`>('PC');
  const [hpMax, setHpMax] = useState(1);
  const [manaMax, setManaMax] = useState(0);
  const [attrs, setAttrs] = useState<Record<string, number>>({});

  const queryClient = useQueryClient();

  const { data: classesData } = useQuery({ queryKey: GET_CLASSES_KEY, queryFn: getClassesService, enabled: open });
  const { data: speciesData } = useQuery({ queryKey: GET_SPECIES_KEY, queryFn: getSpeciesService, enabled: open });
  const { data: originsData } = useQuery({ queryKey: GET_ORIGINS_KEY, queryFn: getOriginsService, enabled: open });

  useEffect(() => {
    if (character) {
      setPage(1);
      setName(character.name);
      setType(character.type);
      setHpMax(character.hp_max);
      setManaMax(character.mana_max);
      setAttrs(character.attributes ?? {});
    }
  }, [character]);

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!character) return Promise.reject(new Error('sem personagem'));

      return updateCharacterService({
        code,
        characterId: character.id,
        body: { name, type, hp_max: hpMax, mana_max: manaMax },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GET_TABLE_KEY(code) });
      onClose();
    },
  });

  if (!character) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      fullscreen
      wide
    >
      <p className="card-modal-title">
        <PencilSimple weight="bold" />
        {`Editar ${character.name}`}
      </p>

      <div className="edit-page-dots">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={`edit-page-dot ${page === n ? 'active' : ''}`}
          />
        ))}
      </div>

      {page === 1 ? (
        <>
          <span className="edit-section-label">Identidade</span>

          <label className="edit-lbl">
            Nome
            <Field
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="edit-lbl">
            Tipo
            <FieldSelect
              value={type}
              onChange={(e) => setType(e.target.value as `${ECharacterType}`)}
            >
              <option value="PC">Jogador (PC)</option>
              <option value="NPC">NPC</option>
              <option value="Monstro">Monstro</option>
            </FieldSelect>
          </label>

          <div style={{ display: 'flex', gap: 8 }}>
            <label
              className="edit-lbl"
              style={{ flex: 1 }}
            >
              Vida máx.
              <Field
                type="number"
                min={1}
                value={hpMax}
                onChange={(e) => setHpMax(Number(e.target.value) || 1)}
              />
            </label>

            <label
              className="edit-lbl"
              style={{ flex: 1 }}
            >
              Mana máx.
              <Field
                type="number"
                min={0}
                value={manaMax}
                onChange={(e) => setManaMax(Number(e.target.value) || 0)}
              />
            </label>
          </div>

          <Button
            variant="primary"
            onClick={() => setPage(2)}
          >
            Próximo
            <ArrowRight weight="bold" />
          </Button>
        </>
      ) : null}

      {page === 2 ? (
        <>
          <span className="edit-section-label">Atributos</span>

          <div className="attr-edit-grid">
            {ATTRIBUTE_ORDER.map((attribute) => (
              <label
                key={attribute}
                className="edit-lbl attr-lbl"
              >
                {ATTRIBUTE_LABEL[attribute]}
                <Field
                  type="number"
                  value={attrs[attribute] ?? 0}
                  onChange={(e) => setAttrs({ ...attrs, [attribute]: Number(e.target.value) || 0 })}
                />
              </label>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="wiz-back"
              onClick={() => setPage(1)}
            >
              Anterior
            </button>

            <Button
              variant="primary"
              onClick={() => setPage(3)}
              style={{ marginLeft: 'auto' }}
            >
              Próximo
              <ArrowRight weight="bold" />
            </Button>
          </div>
        </>
      ) : null}

      {page === 3 ? (
        <>
          <span className="edit-section-label">Resumo</span>

          <p className="wiz-resource-line">
            {`Espécie: ${speciesData?.data.find((s) => s.id === character.species_id)?.name ?? '—'}`}
          </p>

          <p className="wiz-resource-line">
            {`Classe: ${classesData?.data.find((c) => c.id === character.class_id)?.name ?? '—'}`}
          </p>

          <p className="wiz-resource-line">
            {`Origem: ${originsData?.data.find((o) => o.id === character.origin_id)?.name ?? '—'}`}
          </p>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="wiz-back"
              onClick={() => setPage(2)}
            >
              Anterior
            </button>

            <Button
              variant="primary"
              onClick={() => saveMutation.mutate()}
              style={{ marginLeft: 'auto' }}
            >
              <Check weight="bold" />
              Concluir
            </Button>
          </div>
        </>
      ) : null}
    </Modal>
  );
}
```

- [ ] **Step 2: CSS (copiado do canvas linhas 393-419, 413-416)**

```css
.edit-lbl{display:flex;flex-direction:column;gap:3px;font-size:10.5px;letter-spacing:.04em;text-transform:uppercase;color:var(--text-faint)}
.edit-lbl .field{margin-top:1px}
.attr-edit-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.attr-lbl .field{padding:5px 6px}
.edit-page-dots{display:flex;gap:6px;justify-content:center;margin:2px 0 4px}
.edit-page-dot{width:7px;height:7px;border-radius:50%;background:var(--border)}
.edit-page-dot.active{background:var(--gold);box-shadow:0 0 8px var(--gold-dim)}
.edit-section-label{font-size:10.5px;letter-spacing:.07em;text-transform:uppercase;color:var(--gold-dim);font-weight:600;margin:6px 0 -2px;padding-top:10px;border-top:1px solid var(--border)}
.wiz-back{background:none;border:none;color:var(--text-faint);font-size:12px;cursor:pointer;align-self:flex-start;text-decoration:underline;padding:0}
.wiz-resource-line{font-size:12.5px;color:var(--text-dim);margin:2px 0}
```

- [ ] **Step 3: Verificar e commitar**

Testar navegação pelas 3 páginas com um personagem mock que tenha `class_id`/`species_id`/`origin_id`; confirmar que "Concluir" chama `updateCharacterService` com os campos certos.

```bash
git add -A
git commit -m "feat: 3-page character edit modal matching canvas"
```

---

### Task 12: Wizard de criação de Personagem

**Files:**
- Create: `resources/character/components/CharacterWizard.tsx`

Reaproveitar quase todo o estado/handlers de `_reference-old-app/resources/character/components/CharacterWizard.tsx` (mesmas queries `GET_SPECIES_KEY`/`GET_CLASSES_KEY`/`GET_ORIGINS_KEY`, mesmo `classHasChoices`, mesma chamada de `calculateAttributes`, mesma `createCharacterService` no `onSuccess`) — só a JSX de cada etapa é reescrita para bater com o canvas (linhas 617-739).

**Interfaces:**
- Consumes: `getClassesService`/`getSpeciesService`/`getOriginsService`, `calculateAttributes`, `createCharacterService`, `ImageUploadInput` (Task 13).
- Produces: `<CharacterWizard code opened onCancel onCreated={(character: ICharacterMaster) => void} />` (assinatura de `onCreated` muda de objeto parcial para `ICharacterMaster` completo — mais simples, e é o que a Tela do Mestre da Task 16 precisa pra oferecer "salvar como template").

- [ ] **Step 1: Portar o estado/lógica do arquivo de referência tal como está** (copiar linhas 173-360 de `_reference-old-app/resources/character/components/CharacterWizard.tsx`: todos os `useState`, `useQuery`, `reset`/`cancel`/`pickSpecies`/`pickClass`/`toggleSkillChoice`/`toggleKnowledgeChoice`/`classChoicesValid`/`pickOrigin`/`originValid`/`finalAttributes`/`createMutation`), ajustando só:
  - `onCreated` agora recebe `res.data` inteiro (`ICharacterMaster`), não um objeto parcial.
  - Remover toda a lógica de `detailTarget`/`renderDetailContent`/"Ver detalhes" e de "Criar Origem customizada" (`creatingOrigin`/`useCreateOriginLogicData`) — não fazem parte do escopo desta spec (ficam fora, podem voltar numa iteração futura se o usuário pedir).

- [ ] **Step 2: JSX por etapa, seguindo a estrutura do canvas**

```tsx
'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CaretRight, ArrowRight, Check, Info } from '@phosphor-icons/react';
import { Modal } from '@/components/vilgard/Modal';
import { Button } from '@/components/vilgard/Button';
import { Field } from '@/components/vilgard/Field';
import { getClassesService, GET_CLASSES_KEY } from '../services/getClasses';
import { getSpeciesService, GET_SPECIES_KEY } from '../services/getSpecies';
import { getOriginsService, GET_ORIGINS_KEY } from '../services/getOrigins';
import { createCharacterService } from '../services/createCharacter';
import { calculateAttributes } from '../models/calculateAttributes';
import { ATTRIBUTE_ORDER, ATTRIBUTE_LABEL } from '../enums/Attribute';
import { ImageUploadInput } from './ImageUploadInput';
import type { IClass, IOrigin, ISpecies } from '../models/RulesContent';
import type { ICharacterMaster } from '../models/Character';

type WizardStep = 'species' | 'class' | 'classChoices' | 'origin' | 'review';

function classHasChoices(item: IClass): boolean {
  return !!item.skill_proficiency_choice?.count || !!item.knowledge_proficiency_choice?.count || !!item.equipment_choice;
}

export function CharacterWizard({
  code,
  opened,
  onCancel,
  onCreated,
}: {
  code: string;
  opened: boolean;
  onCancel: () => void;
  onCreated: (character: ICharacterMaster) => void;
}) {
  const [step, setStep] = useState<WizardStep>('species');
  const [speciesId, setSpeciesId] = useState<number | null>(null);
  const [classId, setClassId] = useState<number | null>(null);
  const [skillChoices, setSkillChoices] = useState<string[]>([]);
  const [knowledgeChoices, setKnowledgeChoices] = useState<string[]>([]);
  const [equipmentLabel, setEquipmentLabel] = useState<string | null>(null);
  const [originId, setOriginId] = useState<number | null>(null);
  const [originBonusIndex, setOriginBonusIndex] = useState<number | null>(null);
  const [originProficiency, setOriginProficiency] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const { data: speciesData, isLoading: speciesLoading } = useQuery({ queryKey: GET_SPECIES_KEY, queryFn: getSpeciesService, enabled: opened });
  const { data: classesData, isLoading: classesLoading } = useQuery({ queryKey: GET_CLASSES_KEY, queryFn: getClassesService, enabled: opened });
  const { data: originsData, isLoading: originsLoading } = useQuery({ queryKey: GET_ORIGINS_KEY, queryFn: getOriginsService, enabled: opened });

  const speciesList = speciesData?.data ?? [];
  const classesList = classesData?.data ?? [];
  const originsList = originsData?.data ?? [];

  const selectedSpecies = speciesList.find((item) => item.id === speciesId) ?? null;
  const selectedClass = classesList.find((item) => item.id === classId) ?? null;
  const selectedOrigin = originsList.find((item) => item.id === originId) ?? null;

  function reset() {
    setStep('species');
    setSpeciesId(null);
    setClassId(null);
    setSkillChoices([]);
    setKnowledgeChoices([]);
    setEquipmentLabel(null);
    setOriginId(null);
    setOriginBonusIndex(null);
    setOriginProficiency(null);
    setName('');
    setImageUrl('');
  }

  function cancel() {
    reset();
    onCancel();
  }

  function pickSpecies(item: ISpecies) {
    setSpeciesId(item.id);
    setStep('class');
  }

  function pickClass(item: IClass) {
    setClassId(item.id);
    setSkillChoices([]);
    setKnowledgeChoices([]);
    setEquipmentLabel(item.equipment_choice?.options[0]?.label ?? null);
    setStep(classHasChoices(item) ? 'classChoices' : 'origin');
  }

  function toggleSkillChoice(value: string) {
    if (!selectedClass?.skill_proficiency_choice) return;

    const max = selectedClass.skill_proficiency_choice.count;

    setSkillChoices((prev) => {
      if (prev.includes(value)) return prev.filter((v) => v !== value);
      if (prev.length >= max) return prev;

      return [...prev, value];
    });
  }

  function classChoicesValid(): boolean {
    if (!selectedClass) return false;

    const skillOk = !selectedClass.skill_proficiency_choice || skillChoices.length === selectedClass.skill_proficiency_choice.count;
    const equipmentOk = !selectedClass.equipment_choice || !!equipmentLabel;

    return skillOk && equipmentOk;
  }

  function pickOrigin(item: IOrigin) {
    setOriginId(item.id);
    setOriginBonusIndex(0);
    setOriginProficiency(item.proficiency_choice?.options[0] ?? null);
  }

  function originValid(): boolean {
    if (!selectedOrigin) return false;
    if (originBonusIndex === null) return false;
    if (selectedOrigin.proficiency_choice && !originProficiency) return false;

    return true;
  }

  const finalAttributes = selectedClass && selectedSpecies && selectedOrigin && originBonusIndex !== null
    ? calculateAttributes([
      selectedClass.attribute_bonuses,
      selectedSpecies.attribute_bonuses,
      selectedOrigin.attribute_bonus_options[originBonusIndex],
    ])
    : null;

  const createMutation = useMutation({
    mutationFn: () => {
      if (!selectedClass || !selectedSpecies || !selectedOrigin || !finalAttributes) return Promise.reject(new Error('Wizard incompleto.'));

      return createCharacterService({
        code,
        body: {
          name: name.trim(),
          image_url: imageUrl || null,
          type: 'PC',
          hp_current: selectedClass.hp_base,
          hp_max: selectedClass.hp_base,
          has_mana: selectedClass.mana_base > 0,
          mana_current: selectedClass.mana_base,
          mana_max: selectedClass.mana_base,
          class_id: selectedClass.id,
          species_id: selectedSpecies.id,
          origin_id: selectedOrigin.id,
          level: 1,
          attributes: finalAttributes,
        },
      });
    },
    onSuccess: (res) => {
      const created = res.data;

      reset();
      onCreated(created);
    },
  });

  const anyLoading = speciesLoading || classesLoading || originsLoading;

  return (
    <Modal
      open={opened}
      onClose={cancel}
      fullscreen
    >
      <div className="wiz-head">
        <div>
          <p className="wiz-eyebrow">Cantos e Contos</p>
          <p className="wiz-title">Criar Personagem</p>
        </div>

        <button
          className="icon-btn"
          onClick={cancel}
        >
          ✕
        </button>
      </div>

      <div className="wiz-divider" />

      {anyLoading ? <p className="wiz-empty">Carregando...</p> : null}

      {!anyLoading && step === 'species' ? (
        <>
          <p className="wiz-sub">Escolha a Espécie do personagem.</p>

          <div className="wiz-grid">
            {speciesList.map((item) => (
              <button
                key={item.id}
                className="wiz-opt"
                onClick={() => pickSpecies(item)}
              >
                <span className="wiz-opt-badge">
                  <Info />
                </span>

                <span className="wiz-opt-txt">
                  <span>{item.name}</span>
                </span>
              </button>
            ))}
          </div>
        </>
      ) : null}

      {!anyLoading && step === 'class' ? (
        <>
          <p className="wiz-sub">Escolha a Classe do personagem.</p>

          <div className="wiz-grid">
            {classesList.map((item) => (
              <button
                key={item.id}
                className="wiz-opt"
                onClick={() => pickClass(item)}
              >
                <span className="wiz-opt-txt">
                  <span>{item.name}</span>
                  <span className="wiz-opt-sub">{`Vida: ${item.hp_base}${item.mana_base > 0 ? ` · Mana: ${item.mana_base}` : ''}`}</span>
                </span>
              </button>
            ))}
          </div>
        </>
      ) : null}

      {!anyLoading && step === 'classChoices' && selectedClass ? (
        <>
          <p className="wiz-sub2">{`Escolhas de ${selectedClass.name}`}</p>

          {selectedClass.skill_proficiency_choice ? (
            <>
              <p className="wiz-label">{`Perícias — escolha ${selectedClass.skill_proficiency_choice.count}`}</p>

              <div className="wiz-pill-list">
                {selectedClass.skill_proficiency_choice.options.map((option) => (
                  <button
                    key={option}
                    className={`wiz-pill ${skillChoices.includes(option) ? 'checked' : ''}`}
                    onClick={() => toggleSkillChoice(option)}
                  >
                    <Check weight="bold" />
                    {option}
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {selectedClass.equipment_choice ? (
            <>
              <p className="wiz-label">Equipamento inicial</p>

              <div className="wiz-radio-cards">
                {selectedClass.equipment_choice.options.map((option) => (
                  <button
                    key={option.label}
                    className={`wiz-radio-card ${equipmentLabel === option.label ? 'checked' : ''}`}
                    onClick={() => setEquipmentLabel(option.label)}
                  >
                    <span className="wiz-radio-dot" />
                    {option.label}
                  </button>
                ))}
              </div>
            </>
          ) : null}

          <Button
            variant="primary"
            className="wiz-continue"
            disabled={!classChoicesValid()}
            onClick={() => setStep('origin')}
          >
            Continuar
            <ArrowRight weight="bold" />
          </Button>
        </>
      ) : null}

      {!anyLoading && step === 'origin' && !selectedOrigin ? (
        <>
          <p className="wiz-sub">Escolha a Origem do personagem.</p>

          <div className="wiz-grid">
            {originsList.map((item) => (
              <button
                key={item.id}
                className="wiz-opt"
                onClick={() => pickOrigin(item)}
              >
                <span className="wiz-opt-txt">
                  <span>{item.name}</span>
                </span>
              </button>
            ))}
          </div>
        </>
      ) : null}

      {!anyLoading && step === 'origin' && selectedOrigin ? (
        <>
          <p className="wiz-sub2">{selectedOrigin.name}</p>

          <p className="wiz-label">Bônus de atributo</p>

          <div className="wiz-radio-cards">
            {selectedOrigin.attribute_bonus_options.map((option, index) => (
              <button
                key={index}
                className={`wiz-radio-card ${originBonusIndex === index ? 'checked' : ''}`}
                onClick={() => setOriginBonusIndex(index)}
              >
                <span className="wiz-radio-dot" />
                {option.map((bonus) => `+${bonus.amount} ${ATTRIBUTE_LABEL[bonus.attribute as keyof typeof ATTRIBUTE_LABEL]}`).join(', ')}
              </button>
            ))}
          </div>

          {selectedOrigin.proficiency_choice ? (
            <>
              <p className="wiz-label">Perícia</p>

              <div className="wiz-radio-cards">
                {selectedOrigin.proficiency_choice.options.map((option) => (
                  <button
                    key={option}
                    className={`wiz-radio-card ${originProficiency === option ? 'checked' : ''}`}
                    onClick={() => setOriginProficiency(option)}
                  >
                    <span className="wiz-radio-dot" />
                    {option}
                  </button>
                ))}
              </div>
            </>
          ) : null}

          <Button
            variant="primary"
            className="wiz-continue"
            disabled={!originValid()}
            onClick={() => setStep('review')}
          >
            Continuar
            <ArrowRight weight="bold" />
          </Button>
        </>
      ) : null}

      {!anyLoading && step === 'review' && selectedClass && selectedSpecies && selectedOrigin && finalAttributes ? (
        <>
          <p className="wiz-breadcrumb">{`${selectedSpecies.name} · ${selectedClass.name} · ${selectedOrigin.name}`}</p>

          <Field
            placeholder="Nome do personagem *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />

          <ImageUploadInput
            value={imageUrl}
            onChange={setImageUrl}
          />

          <div className="wiz-attr-summary">
            {ATTRIBUTE_ORDER.map((attribute) => (
              <div
                key={attribute}
                className="wiz-attr-cell"
              >
                <span className="wiz-attr-lbl">{ATTRIBUTE_LABEL[attribute]}</span>
                <span className="wiz-attr-val">{finalAttributes[attribute] >= 0 ? `+${finalAttributes[attribute]}` : finalAttributes[attribute]}</span>
              </div>
            ))}
          </div>

          <p className="wiz-label">Recursos da Classe</p>

          <div className="wiz-resource-grid">
            {selectedClass.extra_resources.map((resource) => (
              <div
                key={resource.label}
                className="wiz-resource-card"
              >
                <span className="wiz-resource-val">{resource.value}</span>
                <span className="wiz-resource-lbl">{resource.label}</span>
              </div>
            ))}
          </div>

          <Button
            variant="primary"
            className="wiz-continue"
            disabled={!name.trim() || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            <Check weight="bold" />
            Criar Personagem
          </Button>
        </>
      ) : null}
    </Modal>
  );
}
```

- [ ] **Step 3: CSS (copiado do canvas linhas 149-237)**

Copiar literalmente todo o bloco `.wiz-box` até `.wiz-resource-lbl` (linhas 149-237) para `app/globals.css`, trocando `.wiz-box{cursor:default;width:min(92vw,680px);...}` como container do `Modal` `fullscreen` (aplicar essas propriedades na classe `.card-modal-box.fullscreen` quando dentro do wizard, ou adicionar `.wiz-box` como classe extra no `Modal` — mais simples: adicionar `className="wiz-box"` no wrapper interno do `Modal` quando usado pelo wizard, então basta que `Modal` aceite um `contentClassName?` opcional).

- [ ] **Step 4: Ajustar `Modal` (Task 5) pra aceitar `contentClassName`**

Em `components/vilgard/Modal.tsx`, adicionar prop `contentClassName?: string` e aplicar no `<div className={...} ${contentClassName}>`.

- [ ] **Step 5: Verificar**

Rodar o wizard completo numa mesa de teste real (API já funcional desde a Fase 1): Espécie → Classe (com escolhas) → Origem → Revisão → Criar. Confirmar `POST /api/tables/[code]/characters` disparado com `class_id`/`species_id`/`origin_id`/`attributes` corretos.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: character creation wizard ported to canvas visual"
```

---

### Task 13: `ImageUploadInput` (upload de retrato)

**Files:**
- Create: `resources/character/components/ImageUploadInput.tsx`

**Interfaces:**
- Consumes: `uploadCharacterImageService` (reaproveitado sem alteração).
- Produces: `<ImageUploadInput value={string} onChange={(url: string) => void} />`.

- [ ] **Step 1: Implementar**

```tsx
'use client';

import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { uploadCharacterImageService } from '../services/uploadCharacterImage';

export function ImageUploadInput({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadCharacterImageService({ file }),
    onSuccess: (res) => onChange(res.data.url),
  });

  function handleFile(file: File | undefined) {
    if (file) uploadMutation.mutate(file);
  }

  return (
    <div className="wiz-photo-center">
      <div
        className="wiz-photo-slot"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFile(e.dataTransfer.files[0]);
        }}
        style={{ cursor: 'pointer', opacity: isDragging ? 0.7 : 1 }}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt="Retrato"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ color: 'var(--text-faint)', fontSize: 12 }}>Foto</span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
```

- [ ] **Step 2: CSS (copiado do canvas linhas 198-199)**

```css
.wiz-photo-slot{width:180px;height:180px;border-radius:50%;overflow:hidden;border:2px solid var(--gold-dim);flex-shrink:0;box-shadow:0 0 16px rgba(201,162,39,.2);display:flex;align-items:center;justify-content:center}
.wiz-photo-center{display:flex;justify-content:center;margin:6px 0}
```

- [ ] **Step 3: Verificar e commitar**

Testar upload de uma imagem PNG local; confirmar preview aparecendo no círculo.

```bash
git add -A
git commit -m "feat: ImageUploadInput matching canvas photo slot"
```

---

### Task 14: Montagem da página `app/mesa/[code]/mestre/page.tsx`

**Files:**
- Create: `app/mesa/[code]/mestre/page.tsx`

Consultar `_reference-old-app/app/mesa/[code]/mestre/page.tsx` só pra confirmar o padrão de acesso (`useTableStream`, tratamento de `you.is_master === false` → mensagem de acesso negado) — a UI é toda nova.

**Interfaces:**
- Consumes: `useTableStream` (Task da Fase 1, sem alteração), `TableBoard` (Task 9), `CharacterCard` (Task 8), `ActionModals` (Task 10), `CharacterEditModal` (Task 11), `CharacterWizard` (Task 12), `applyCharacterActionService`, `updateCharacterService`, `deleteCharacterService`.

- [ ] **Step 1: Implementar**

```tsx
'use client';

import { use, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MagnifyingGlassMinus, MagnifyingGlassPlus, Monitor, Plus } from '@phosphor-icons/react';
import Link from 'next/link';
import { useTableStream, UseTableStreamCharacterAction } from '@/resources/table/hooks/useTableStream';
import { TableBoard } from '@/resources/character/components/TableBoard';
import { CharacterCard, CharacterCardFx } from '@/resources/character/components/CharacterCard';
import { ActionModals, ActionModalKind } from '@/resources/character/components/ActionModals';
import { CharacterEditModal } from '@/resources/character/components/CharacterEditModal';
import { CharacterWizard } from '@/resources/character/components/CharacterWizard';
import { updateCharacterService } from '@/resources/character/services/updateCharacter';
import { deleteCharacterService } from '@/resources/character/services/deleteCharacter';
import { applyCharacterActionService } from '@/resources/character/services/applyCharacterAction';
import { GET_TABLE_KEY } from '@/resources/table/services/getTable';
import type { ICharacterMaster } from '@/resources/character/models/Character';

export default function MestrePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const queryClient = useQueryClient();

  const [cardScale, setCardScale] = useState(1);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [actionState, setActionState] = useState<{ kind: ActionModalKind; characterId: number | null }>({ kind: null, characterId: null });
  const [editCharacterId, setEditCharacterId] = useState<number | null>(null);
  const [fxByCharacter, setFxByCharacter] = useState<Record<number, CharacterCardFx>>({});

  const { data, refetch } = useTableStream(code, {
    onCharacterAction: (action: UseTableStreamCharacterAction) => {
      setFxByCharacter((prev) => ({
        ...prev,
        [action.character_id]: {
          type: action.action === 'damage' ? 'damage' : action.action === 'heal' ? 'heal' : action.action === 'mana-spend' ? 'mana-loss' : 'mana-gain',
          token: Math.random(),
        },
      }));
    },
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, x, y }: { id: number; x: number; y: number }) => updateCharacterService({ code, characterId: id, body: { position_x: x, position_y: y } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: GET_TABLE_KEY(code) }),
  });

  const manaMutation = useMutation({
    mutationFn: ({ id, value, currentMana }: { id: number; value: number; currentMana: number }) => {
      const delta = value - currentMana;

      return applyCharacterActionService({ code, characterId: id, body: { type: delta > 0 ? 'mana-restore' : 'mana-spend', amount: Math.abs(delta) } });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: GET_TABLE_KEY(code) }),
  });

  const visibleMutation = useMutation({
    mutationFn: ({ id, visible }: { id: number; visible: boolean }) => updateCharacterService({ code, characterId: id, body: { visible } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: GET_TABLE_KEY(code) }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCharacterService({ code, characterId: id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: GET_TABLE_KEY(code) }),
  });

  if (!data) return null;

  if (!data.you.is_master) {
    return (
      <div className="table-bg">
        <p style={{ padding: 40, textAlign: 'center' }}>Apenas o Mestre pode acessar esta tela.</p>
      </div>
    );
  }

  const characters = data.characters as ICharacterMaster[];
  const activeCharacter = characters.find((c) => c.id === actionState.characterId) ?? null;
  const editCharacter = characters.find((c) => c.id === editCharacterId) ?? null;

  return (
    <div className="table-bg">
      <header className="topbar">
        <Link
          href="/mesas"
          className="icon-btn"
        >
          <ArrowLeft weight="bold" />
        </Link>

        <span
          className="table-title-input"
          style={{ flex: 1 }}
        >
          {data.table.name ?? 'Mesa sem nome'}
        </span>

        <div style={{ display: 'flex', gap: 10 }}>
          <div className="card-zoom">
            <MagnifyingGlassMinus size={14} />

            <input
              className="zoom-slider"
              type="range"
              min={55}
              max={115}
              step={5}
              value={Math.round(cardScale * 100)}
              onChange={(e) => setCardScale(Number(e.target.value) / 100)}
            />

            <MagnifyingGlassPlus size={14} />

            <span className="card-zoom-pct">{Math.round(cardScale * 100)}%</span>
          </div>

          <a
            className="btn btn-ghost"
            href={`/mesa/${code}/exibicao`}
            target="_blank"
            rel="noreferrer"
          >
            <Monitor weight="bold" />
            Abrir telão
          </a>

          <button
            className="btn btn-primary"
            onClick={() => setWizardOpen(true)}
          >
            <Plus weight="bold" />
            Nova carta
          </button>
        </div>
      </header>

      <TableBoard
        characters={characters}
        cardScale={cardScale}
        onMove={(id, x, y) => moveMutation.mutate({ id, x, y })}
        renderCard={(character) => (
          <CharacterCard
            character={character}
            fx={fxByCharacter[character.id] ?? null}
            onManaClick={(value) => manaMutation.mutate({ id: character.id, value, currentMana: character.mana_current })}
            onOpenDano={() => setActionState({ kind: 'dano', characterId: character.id })}
            onOpenCura={() => setActionState({ kind: 'cura', characterId: character.id })}
            onOpenVidaExtra={() => setActionState({ kind: 'vida-extra', characterId: character.id })}
            onOpenEstado={() => setActionState({ kind: 'estado', characterId: character.id })}
            onOpenEdit={() => setEditCharacterId(character.id)}
            onToggleVisible={() => visibleMutation.mutate({ id: character.id, visible: !character.visible })}
            onRemove={() => deleteMutation.mutate(character.id)}
          />
        )}
      />

      <ActionModals
        code={code}
        character={activeCharacter}
        open={actionState.kind}
        onClose={() => setActionState({ kind: null, characterId: null })}
        onApplied={() => refetch()}
      />

      <CharacterEditModal
        code={code}
        open={!!editCharacter}
        character={editCharacter}
        onClose={() => setEditCharacterId(null)}
      />

      <CharacterWizard
        code={code}
        opened={wizardOpen}
        onCancel={() => setWizardOpen(false)}
        onCreated={() => setWizardOpen(false)}
      />
    </div>
  );
}
```

- [ ] **Step 2: CSS (copiado do canvas linhas 61, 520-529)**

```css
.topbar{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 28px;border-bottom:1px solid var(--border);background:linear-gradient(to bottom, rgba(0,0,0,.3), transparent);position:sticky;top:0;z-index:5;backdrop-filter:blur(6px)}
.table-bg{min-height:100vh;position:relative}
.table-bg::before{content:"";position:fixed;inset:0;z-index:-1;background:
  linear-gradient(rgba(10,7,4,.78), rgba(10,7,4,.85)),
  url('/assets/table-bg.jpg');
  background-size:cover;background-position:center;filter:blur(6px);transform:scale(1.05)}
.table-title-input{background:transparent;border:none;font-family:var(--heading);font-size:26px;color:var(--gold-light);padding:4px 2px;text-shadow:0 2px 10px rgba(0,0,0,.5)}
.card-zoom{display:flex;align-items:center;gap:6px;padding:0 4px;border-right:1px solid var(--border);margin-right:4px}
.card-zoom-pct{font-size:12px;color:var(--text-dim);min-width:34px;text-align:center;font-variant-numeric:tabular-nums}
.zoom-slider{width:90px;accent-color:var(--gold-dim);cursor:pointer}
```

- [ ] **Step 3: Verificar**

Abrir `/mesa/[code]/mestre` de uma mesa de teste real; confirmar tabuleiro com fundo de madeira desfocado, topbar sticky, zoom funcionando, clique em "Nova carta" abrindo o wizard, criação de personagem aparecendo no tabuleiro.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: assemble Tela do Mestre page with new UI"
```

---

## Fase 4 — Home + Mesas

### Task 15: `app/page.tsx` (Home)

**Files:**
- Create: `app/page.tsx`

- [ ] **Step 1: Implementar** (canvas linhas 430-440)

```tsx
import Link from 'next/link';
import { ShieldChevron, Play } from '@phosphor-icons/react/dist/ssr';

export default function HomePage() {
  return (
    <div className="home-screen">
      <div className="home-glow" />

      <div className="home-content fade">
        <ShieldChevron
          weight="fill"
          size={46}
          color="var(--gold)"
        />

        <h1>Contos e Cantos de Vilgard</h1>

        <p style={{ fontSize: 15, color: 'var(--text-faint)', fontStyle: 'italic', margin: '-6px 0 0' }}>
          Onde a Esperança e o Medo decidem o destino dos aventureiros.
        </p>

        <Link
          href="/mesas"
          className="btn btn-primary"
          style={{ padding: '14px 30px', fontSize: 14 }}
        >
          <Play weight="bold" />
          Iniciar
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: CSS (copiado do canvas linhas 117-122)**

```css
.home-screen{min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:40px}
.home-glow{position:fixed;inset:0;pointer-events:none;background:radial-gradient(1000px 600px at 50% 30%, rgba(201,162,39,.12), transparent 65%)}
.home-content{max-width:560px;display:flex;flex-direction:column;align-items:center;gap:18px;position:relative;z-index:1}
.home-content h1{font-size:clamp(36px,5vw,54px);color:var(--gold-light);letter-spacing:.04em;text-shadow:0 2px 30px rgba(0,0,0,.6)}
```

- [ ] **Step 3: Verificar e commitar**

```bash
git add -A
git commit -m "feat: Home page matching canvas"
```

---

### Task 16: `app/mesas/page.tsx`

**Files:**
- Create: `app/mesas/page.tsx`

Reaproveitar `getTablesService`/`createTableService`/`renameTableService`/`deleteTableService` (voltaram intactos na Fase 0).

- [ ] **Step 1: Implementar** (canvas linhas 442-475)

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Scroll, Trash, UsersThree, CrownSimple, Monitor, X, Check } from '@phosphor-icons/react';
import { getTablesService, GET_TABLES_KEY } from '@/resources/table/services/getTables';
import { createTableService } from '@/resources/table/services/createTable';
import { deleteTableService } from '@/resources/table/services/deleteTable';

export default function MesasPage() {
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const queryClient = useQueryClient();

  const { data } = useQuery({ queryKey: GET_TABLES_KEY, queryFn: getTablesService });

  const createMutation = useMutation({
    mutationFn: () => createTableService({ body: { name: newName.trim() || undefined } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GET_TABLES_KEY });
      setNewName('');
      setShowNewForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (code: string) => deleteTableService({ code }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: GET_TABLES_KEY }),
  });

  const tables = data?.data ?? [];

  return (
    <div className="table-bg">
      <header className="topbar">
        <Link
          href="/"
          className="icon-btn"
        >
          <ArrowLeft weight="bold" />
        </Link>

        <span className="brand">
          <Scroll
            weight="fill"
            color="var(--gold)"
          />
          Suas Mesas
        </span>

        <button
          className="btn btn-primary"
          onClick={() => setShowNewForm((v) => !v)}
        >
          <Plus weight="bold" />
          Nova mesa
        </button>
      </header>

      <main className="board tables-board">
        {showNewForm ? (
          <div className="add-form fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontFamily: 'var(--heading)', fontSize: 13, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--gold-light)', margin: 0 }}>
                Nova mesa
              </p>

              <button
                className="icon-btn"
                onClick={() => setShowNewForm(false)}
              >
                <X weight="bold" />
              </button>
            </div>

            <input
              className="field"
              placeholder="Nome da mesa"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />

            <button
              className="btn btn-primary"
              onClick={() => createMutation.mutate()}
            >
              <Check weight="bold" />
              Criar mesa
            </button>
          </div>
        ) : null}

        {tables.map((table) => (
          <div
            key={table.code}
            className="card table-card fade"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h3>{table.name ?? 'Mesa sem nome'}</h3>

              <button
                className="icon-btn"
                onClick={() => deleteMutation.mutate(table.code)}
                title="Excluir mesa"
              >
                <Trash weight="bold" />
              </button>
            </div>

            <span className="meta">
              <UsersThree weight="fill" />
              {table.code}
            </span>

            <div className="table-actions">
              <Link
                href={`/mesa/${table.code}/mestre`}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                <CrownSimple weight="bold" />
                Mestrar
              </Link>

              <a
                href={`/mesa/${table.code}/exibicao`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost"
                style={{ flex: 1 }}
              >
                <Monitor weight="bold" />
                Exibir
              </a>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: CSS (copiado do canvas linhas 72, 112-116, 123-127)**

```css
.board.tables-board{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));align-content:start;gap:18px}
.card{background:linear-gradient(160deg, var(--bg3), var(--bg2));border:1px solid var(--border);border-radius:6px;box-shadow:var(--shadow-deep);padding:16px;display:flex;flex-direction:column;gap:12px}
.card:hover{border-color:var(--gold-dim)}
.add-form{background:linear-gradient(160deg, var(--bg3), var(--bg2));border:1px dashed var(--gold-dim);border-radius:6px;padding:18px;display:flex;flex-direction:column;gap:10px}
.brand{display:flex;align-items:center;gap:10px;font-family:var(--heading);font-size:18px;color:var(--gold-light)}
.table-card h3{font-size:18px;color:var(--gold-light);flex:1;min-width:0}
.table-card .meta{font-size:12.5px;color:var(--text-faint);display:flex;align-items:center;gap:6px}
.table-actions{display:flex;gap:8px;margin-top:auto}
```

- [ ] **Step 3: Verificar**

Criar mesa pela UI, confirmar aparecendo na lista, clicar em "Mestrar" navega pra Tela do Mestre, "Excluir mesa" remove da lista.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: Mesas list page matching canvas"
```

---

## Fase 5 — Tela de Exibição

### Task 17: `DisplayCard` (frente travada) + `app/mesa/[code]/exibicao/page.tsx`

**Files:**
- Create: `resources/character/components/DisplayCard.tsx`
- Create: `app/mesa/[code]/exibicao/page.tsx`

**Interfaces:**
- Consumes: `ICharacterDisplay`, `useTableStream(code, { forceDisplay: true })`.
- Produces: `<DisplayCard character={ICharacterDisplay} />` — sem `onClick`/flip/hover, só a frente.

- [ ] **Step 1: `DisplayCard`** (subconjunto da frente do `CharacterCard`, sem os ícones de ação nem flip — `hp_color`/`is_defeated` em vez de calcular localmente)

```tsx
'use client';

import { EStatusEffect } from '../enums/StatusEffect';
import { STATUS_EFFECT_VISUAL } from '../models/StatusEffectVisual';
import { ManaCrystals } from './ManaCrystals';
import { StatusEffectBadge } from './StatusEffectBadge';
import type { ICharacterDisplay } from '../models/Character';

export function DisplayCard({ character: c }: { character: ICharacterDisplay }) {
  const conditionClass = (condition: EStatusEffect) => c.status_effects.includes(condition);

  return (
    <div
      className="rpg-face rpg-front"
      style={{ position: 'relative', width: 220, height: 315, borderColor: c.hp_color, boxShadow: `0 0 0 1px rgba(0,0,0,.4), 0 12px 26px rgba(0,0,0,.5), 0 0 18px ${c.hp_color}55` }}
    >
      <div className={`rpg-portrait-fill ${c.is_defeated ? 'dead' : ''} ${conditionClass(EStatusEffect.ATORDOADO) ? 'dizzy' : ''} ${conditionClass(EStatusEffect.PRESO) ? 'trapped' : ''} ${conditionClass(EStatusEffect.ENFEITICADO) ? 'enchanted' : ''} ${conditionClass(EStatusEffect.DORMINDO) ? 'asleep' : ''}`}>
        {c.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={c.image_url}
            alt={c.name}
          />
        ) : null}
      </div>

      {conditionClass(EStatusEffect.PRESO) ? <div className="chain-border" /> : null}
      {conditionClass(EStatusEffect.SANGRANDO) ? (
        <div className="blood-fx">
          <span className="blood-drip bd1" />
          <span className="blood-drip bd3" />
          <span className="blood-drip bd5" />
        </div>
      ) : null}

      <span className={`type-tag rpg-type-badge type-${c.type}`}>
        {c.type}
      </span>

      <ManaCrystals
        current={c.mana_current}
        max={c.mana_max}
      />

      {c.status_effects.length > 0 ? (
        <div className="cond-badge-row">
          {c.status_effects.map((effect) => (
            <StatusEffectBadge
              key={effect}
              effect={effect}
              size={23}
            />
          ))}
        </div>
      ) : null}

      <div className="rpg-name-bar">
        <span className="nm">
          {c.name}
        </span>
      </div>
    </div>
  );
}
```

Nota: `STATUS_EFFECT_VISUAL` importado mas não usado diretamente aqui além de dentro de `StatusEffectBadge` — remover o import se o linter reclamar de import não usado.

- [ ] **Step 2: `app/mesa/[code]/exibicao/page.tsx`** (canvas linhas 477-513)

```tsx
'use client';

import { use } from 'react';
import { ArrowLeft } from '@phosphor-icons/react';
import Link from 'next/link';
import { useTableStream } from '@/resources/table/hooks/useTableStream';
import { DisplayCard } from '@/resources/character/components/DisplayCard';
import type { ICharacterDisplay } from '@/resources/character/models/Character';

export default function ExibicaoPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);

  const { data } = useTableStream(code, { forceDisplay: true });

  if (!data) return null;

  const characters = data.characters as ICharacterDisplay[];

  return (
    <div className="display-body">
      <div className="display-glow" />

      <Link
        href="/mesas"
        className="icon-btn"
        style={{ position: 'absolute', top: 20, left: 24, zIndex: 2, fontSize: 20 }}
      >
        <ArrowLeft weight="bold" />
      </Link>

      <h1 className="display-title">
        {data.table.name ?? 'Mesa sem nome'}
      </h1>

      {characters.length > 0 ? (
        <div className="display-front-grid">
          {characters.map((character) => (
            <div key={character.id}>
              <DisplayCard character={character} />

              {character.status_effects.length > 0 ? (
                <div
                  className="display-chips"
                  style={{ marginTop: 10, justifyContent: 'center' }}
                >
                  {character.status_effects.map((effect) => (
                    <span
                      key={effect}
                      className="display-chip"
                    >
                      {effect}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-display">Aguardando a Esperança se erguer sobre Vilgard…</p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: CSS (copiado do canvas linhas 129-142, 426)**

```css
.display-body{min-height:100vh;padding:40px 5vw;position:relative}
.display-glow{position:fixed;inset:0;pointer-events:none;background:radial-gradient(1400px 800px at 50% -10%, rgba(201,162,39,.08), transparent 60%)}
.display-title{font-size:clamp(30px,4vw,52px);color:var(--gold-light);text-align:center;letter-spacing:.04em;text-shadow:0 2px 30px rgba(0,0,0,.6)}
.display-front-grid{max-width:1500px;margin:36px auto 0;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:24px}
.display-chips{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
.display-chip{font-size:13px;padding:5px 11px;border-radius:14px;border:1px solid var(--gold-dim);color:var(--gold-light);background:rgba(0,0,0,.2);display:inline-flex;align-items:center;gap:5px}
.empty-display{text-align:center;color:var(--text-faint);font-size:16px;margin-top:80px;font-style:italic}
```

- [ ] **Step 4: Verificar — checagem de privacidade (crítica)**

```bash
curl "http://localhost:3000/api/tables/$CODE?view=display" | grep -E "hp_current|hp_max|extra_hp|attributes"
```
Expected: NENHUMA ocorrência.

Abrir `/mesa/[code]/exibicao` no browser numa mesa com personagens de HP variado; confirmar que a borda/glow da carta muda de cor conforme a fórmula (vermelho→amarelo→verde) e que nenhum número de vida aparece em lugar nenhum (inclusive inspecionando o DOM/HTML servido).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: Tela de Exibição with locked front-only cards"
```

---

## Fase 6 — Verificação end-to-end

### Task 18: Verificação completa

**Files:** nenhum arquivo novo — só validação.

- [ ] **Step 1: Type-check e lint limpos**

```bash
npx tsc --noEmit
npm run lint
```

Expected: zero erros. Ajustar qualquer import quebrado remanescente da reestruturação da Fase 0.

- [ ] **Step 2: Fluxo completo via Playwright (ou manual no browser)**

1. `/` → "Iniciar" → `/mesas`.
2. "Nova mesa" → criar → aparece na lista.
3. "Mestrar" → Tela do Mestre carrega com tabuleiro vazio.
4. "Nova carta" → wizard completo (Espécie → Classe com escolhas → Origem com bônus → Revisão com upload de foto) → "Criar Personagem" → carta aparece no tabuleiro.
5. Arrastar a carta pelo `move-handle` → solta → posição some do estado de drag e fica fixa num múltiplo de 60px (recarregar a página confirma persistência).
6. Clicar na carta → vira, mostrando HP/Mana/atributos no verso.
7. Ícone de Dano → aplicar 5 de dano → carta pulsa vermelho, HP cai (visível no verso).
8. Ícone de Estado → marcar "Sangrando" → voltar pra frente → gotas de sangue animando.
9. Abrir "Abrir telão" em nova aba → confirmar a mesma mesa em `/mesa/[code]/exibicao`, carta travada na frente, mesma cor de anel, MESMA condição de Sangrando visível, SEM nenhum número de HP em lugar nenhum.
10. De volta na Tela do Mestre, aplicar mais dano → confirmar que a Tela de Exibição (aba já aberta) atualiza sozinha via SSE (sem recarregar) e anima o flash de dano.

- [ ] **Step 3: Checagem final de privacidade via grep**

```bash
curl "http://localhost:3000/api/tables/$CODE?view=display" > /tmp/display.json
grep -E "hp_current|hp_max|extra_hp|\"attributes\"|class_id|species_id|origin_id" /tmp/display.json
```

Expected: nenhuma ocorrência.

- [ ] **Step 4: Limpeza**

Perguntar ao usuário se quer apagar `Site RPG com painéis interativos/` e `_reference-old-app/` agora que a UI nova está completa e verificada, ou manter por mais um tempo como histórico. Não apagar sem confirmação explícita.

- [ ] **Step 5: Commit final**

```bash
git add -A
git commit -m "chore: end-to-end verification of visual reset complete"
```
