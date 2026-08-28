# Rework visual "AAA HUD" — Home + /mesas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a new "AAA HUD" design-system layer (`components/rpg/*`) and apply it to Home + `/mesas`, establishing the visual language the rest of the app will reuse later.

**Architecture:** New design tokens in `shared/constants/colors.ts` + `tailwind.config.mjs` + two new CSS texture classes in `app/globals.css`. Four new cross-cutting components in a new `components/rpg/` folder (thin wrappers over existing Mantine primitives where logic is needed — `RpgButton` wraps `Button` — pure custom markup where it's purely visual — `RpgPanel`, `RibbonHeading`, `RpgCard`). Home and `/mesas` are then rewired to use these, with no change to any data-fetching/mutation logic.

**Tech Stack:** Next.js 16, React 19, Mantine 9, Tailwind 4, `@iconify/react`, `motion` (`motion/react`).

**Spec:** `docs/superpowers/specs/2026-08-28-aaa-hud-redesign-design.md`

## Global Constraints

- Every `.tsx` file follows `.claude/rules/tsx-patterns.md`: 2+ attributes on a tag → one per line; text content of a tag on its own line; blank line between JSX siblings.
- Follow `.claude/rules/styling-tailwind.md`: prefer Tailwind classes over inline `style`; `style`/CSS custom classes are only acceptable for values that genuinely can't be expressed as a utility class (e.g. the SVG data-URI textures below, which already exist as a precedent in `app/globals.css`).
- No new npm dependencies — `motion` and `@iconify/react` are already installed and are the only animation/icon libraries this project uses.
- No data-fetching, mutation, or business logic changes anywhere in this plan — `CreateTableLogicComponent`/`RenameTableLogicComponent`/`DeleteTableLogicComponent`/`useQuery` calls keep their exact current behavior; only what wraps them visually changes.
- Verification at the end of every task: `npx tsc --noEmit` and `npm run lint` must be clean — zero new errors, and exactly the same 4 pre-existing warnings (`locales/pt-br.ts`, `tailwind.config.mjs`, 2× `no-img-element` in `DisplayToken.tsx`/`MasterToken.tsx`).
- The dev server runs on the host via `next dev -p 3002` (or reuse an already-running instance on port 3000 if one exists — check with `docker ps` / `netstat` before starting a new one, this repo's Turbopack setup does not tolerate two instances against the same project dir).

---

### Task 1: Design tokens — colors, Tailwind, texture CSS

**Files:**
- Modify: `shared/constants/colors.ts`
- Modify: `tailwind.config.mjs`
- Modify: `app/globals.css`

**Interfaces:**
- Produces: `PARCHMENT_BG`, `INK_TEXT` exports from `colors.ts`; Tailwind classes `bg-parchment-panel`, `text-ink`, `border-ink`; CSS classes `.rpg-panel-glass`, `.rpg-panel-parchment`, `.rpg-label` in `globals.css` — all consumed by Task 2 (`RpgPanel`) and Task 3 (`RibbonHeading`).

- [ ] **Step 1: Add the two new color tokens**

In `shared/constants/colors.ts`, add right after the existing `export const PARCHMENT = '#E8D5A3';` line:

```ts
// Painel "de papel" — alterna com o painel "de vidro" (glass, via
// PANEL_BG/BOARD_BG acima), mesmo padrão da referência do rework AAA HUD
// (ver docs/superpowers/specs/2026-08-28-aaa-hud-redesign-design.md):
// Collaboration Offer é pergaminho, Character Creator é vidro escuro.
export const PARCHMENT_BG = '#E8D9B8';
// Texto sobre PARCHMENT_BG — nunca PARCHMENT (claro) sobre PARCHMENT_BG
// (claro sobre claro), precisa de um tom escuro próprio.
export const INK_TEXT = '#2A1D12';
```

- [ ] **Step 2: Expose the tokens in Tailwind**

In `tailwind.config.mjs`, add `PARCHMENT_BG, INK_TEXT` to the existing import from `./shared/constants/colors`, and add two lines to the `colors` object inside `theme.extend`, right after `parchment: PARCHMENT,`:

```js
        'parchment-panel': PARCHMENT_BG,
        ink: INK_TEXT,
```

- [ ] **Step 3: Add the two panel-texture CSS classes**

In `app/globals.css`, add this block after the existing `.merge-children > *` rule at the end of the file:

```css
/*
 * Duas "texturas de material" reutilizadas por RpgPanel (components/rpg/) —
 * mesma técnica de ruído SVG já usada no fundo do <body> acima, só que
 * aplicada a um elemento específico em vez da página inteira, e com uma
 * segunda variante (grão claro sobre fundo claro, para o material
 * "pergaminho"). Ver docs/superpowers/specs/2026-08-28-aaa-hud-redesign-design.md.
 */
.rpg-panel-glass {
  background-color: rgba(28, 20, 13, 0.72);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.rpg-panel-parchment {
  background-color: #e8d9b8;
  background-image:
    radial-gradient(ellipse 100% 60% at 50% 0%, rgba(0, 0, 0, 0.08), transparent 60%),
    url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'180'%20height%3D'180'%3E%3Cfilter%20id%3D'n'%3E%3CfeTurbulence%20type%3D'fractalNoise'%20baseFrequency%3D'0.9'%20numOctaves%3D'2'%20stitchTiles%3D'stitch'%2F%3E%3CfeColorMatrix%20type%3D'matrix'%20values%3D'0%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200.08%200'%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20filter%3D'url(%23n)'%2F%3E%3C%2Fsvg%3E");
  background-repeat: no-repeat, repeat;
  background-size: cover, 180px 180px;
  box-shadow: inset 0 0 24px rgba(0, 0, 0, 0.18);
}

/*
 * Tratamento "label ornamental" — título de seção pequeno em versalete
 * rastreado (mesmo tratamento de "USER INTERFACE"/"CHARACTER CREATOR" na
 * referência do rework), usado por RibbonHeading (components/rpg/) no lugar
 * de font-accent (MedievalSharp).
 */
.rpg-label {
  font-family: var(--font-display, Georgia, serif);
  text-transform: uppercase;
  letter-spacing: 0.2em;
}
```

- [ ] **Step 4: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS, zero new errors/warnings (nothing imports the new tokens yet, so this just confirms no syntax errors).

- [ ] **Step 5: Commit**

```bash
git add shared/constants/colors.ts tailwind.config.mjs app/globals.css
git commit -m "feat: tokens de design do rework AAA HUD (parchment-panel/ink, texturas CSS, label ornamental)"
```

---

### Task 2: `components/rpg/RpgPanel.tsx`

**Files:**
- Create: `components/rpg/RpgPanel.tsx`

**Interfaces:**
- Consumes: Task 1's `.rpg-panel-glass`/`.rpg-panel-parchment` CSS classes, `cn` from `libs/utils`.
- Produces: `RpgPanel` component, `RpgPanelVariant` type — consumed by Task 6 (Home) and Task 7 (`/mesas`).

- [ ] **Step 1: Write the component**

```tsx
import { cn } from '@/libs/utils';

export type RpgPanelVariant = 'glass' | 'parchment';

export interface RpgPanelProps extends React.ComponentPropsWithoutRef<'div'> {
  variant?: RpgPanelVariant;
  glow?: boolean;
}

// Painel base do rework AAA HUD — duas variantes de "material" (vidro escuro
// translúcido vs. pergaminho claro), com cantoneiras douradas decorativas nos
// 4 cantos. Ver docs/superpowers/specs/2026-08-28-aaa-hud-redesign-design.md.
export function RpgPanel({
  variant = 'glass',
  glow = false,
  className,
  children,
  ...rest
}: RpgPanelProps) {
  return (
    <div
      className={cn(
        'relative rounded-lg border p-6',
        variant === 'glass' ? 'rpg-panel-glass border-gold/35 text-parchment' : 'rpg-panel-parchment border-ink/40 text-ink',
        glow ? 'animate-pulse-glow' : '',
        className,
      )}
      {...rest}
    >
      <RpgPanelCorners variant={variant} />

      {children}
    </div>
  );
}

function RpgPanelCorners({ variant }: { variant: RpgPanelVariant }) {
  const cornerColor = variant === 'glass' ? 'border-gold/50' : 'border-ink/40';

  return (
    <>
      <span className={cn('pointer-events-none absolute left-1 top-1 h-3 w-3 border-l border-t', cornerColor)} />

      <span className={cn('pointer-events-none absolute right-1 top-1 h-3 w-3 border-r border-t', cornerColor)} />

      <span className={cn('pointer-events-none absolute bottom-1 left-1 h-3 w-3 border-b border-l', cornerColor)} />

      <span className={cn('pointer-events-none absolute bottom-1 right-1 h-3 w-3 border-b border-r', cornerColor)} />
    </>
  );
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS, zero new errors/warnings.

- [ ] **Step 3: Commit**

```bash
git add components/rpg/RpgPanel.tsx
git commit -m "feat: componente RpgPanel (variantes glass/parchment) do rework AAA HUD"
```

---

### Task 3: `components/rpg/RibbonHeading.tsx`

**Files:**
- Create: `components/rpg/RibbonHeading.tsx`

**Interfaces:**
- Consumes: Task 1's `.rpg-label` CSS class.
- Produces: `RibbonHeading` component — consumed by Task 6 (Home) and Task 7 (`/mesas`).

- [ ] **Step 1: Write the component**

```tsx
export interface RibbonHeadingProps {
  children: React.ReactNode;
  size?: 'lg' | 'md';
}

// Título de página/seção com divisor ornamental (◇ entre duas linhas em
// gradiente) — mesmo padrão dos títulos "USER INTERFACE"/"CHARACTER CREATOR"
// da referência do rework AAA HUD. `size="lg"` para título de página (Home),
// `size="md"` para cabeçalho de seção (/mesas). Ver
// docs/superpowers/specs/2026-08-28-aaa-hud-redesign-design.md.
export function RibbonHeading({
  children,
  size = 'md',
}: RibbonHeadingProps) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <h1
        className={cn(
          'rpg-label text-gold [text-shadow:0_0_24px_rgba(201,168,76,0.45)]',
          size === 'lg' ? 'text-[2.1rem]' : 'text-[1.3rem]',
        )}
      >
        {children}
      </h1>

      <div className="flex w-full max-w-xs items-center justify-center gap-3">
        <span className="h-px max-w-20 flex-1 bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

        <span className="text-lg text-gold">
          ◇
        </span>

        <span className="h-px max-w-20 flex-1 bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
      </div>
    </div>
  );
}
```

Add `import { cn } from '@/libs/utils';` at the top of the file (used by the `className` conditional).

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS, zero new errors/warnings.

- [ ] **Step 3: Commit**

```bash
git add components/rpg/RibbonHeading.tsx
git commit -m "feat: componente RibbonHeading do rework AAA HUD"
```

---

### Task 4: `components/rpg/RpgButton.tsx`

**Files:**
- Create: `components/rpg/RpgButton.tsx`

**Interfaces:**
- Consumes: Mantine's `Button`/`ButtonProps` (unchanged behavior — `onClick`, `loading`, `disabled`, `component`, `href`, `leftSection`, etc. all still work via prop spread).
- Produces: `RpgButton` component — consumed by Task 6 (Home) and Task 7 (`/mesas`).

- [ ] **Step 1: Write the component**

```tsx
import { Button, ButtonProps } from '@mantine/core';
import { cn } from '@/libs/utils';

export interface RpgButtonProps extends Omit<ButtonProps, 'variant' | 'color'> {
  tone?: 'cta' | 'ghost';
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
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS, zero new errors/warnings.

- [ ] **Step 3: Commit**

```bash
git add components/rpg/RpgButton.tsx
git commit -m "feat: componente RpgButton (tone cta/ghost) do rework AAA HUD"
```

---

### Task 5: `components/rpg/RpgCard.tsx`

**Files:**
- Create: `components/rpg/RpgCard.tsx`

**Interfaces:**
- Consumes: `motion` (`motion/react`), `cn` from `libs/utils`.
- Produces: `RpgCard` component — consumed by Task 7 (`/mesas`). `featured` prop exists but has no caller yet in this plan (reserved for the future Wizard carousel per the spec's "fora de escopo").

- [ ] **Step 1: Write the component**

```tsx
import { motion } from 'motion/react';
import { cn } from '@/libs/utils';

export interface RpgCardProps extends React.ComponentPropsWithoutRef<'div'> {
  featured?: boolean;
}

// Card com cantoneiras douradas e hover elevado — base do padrão "card em
// destaque" da referência do rework AAA HUD (carrossel de Espécie/Classe/
// Origem do Wizard, numa etapa futura). Nesta etapa (Home + /mesas), usado
// sem `featured` (nenhum card desta tela tem estado "selecionado"). Ver
// docs/superpowers/specs/2026-08-28-aaa-hud-redesign-design.md.
export function RpgCard({
  featured = false,
  className,
  children,
  ...rest
}: RpgCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 10px 30px rgba(0,0,0,0.45), 0 0 0 1px rgba(201,168,76,0.45)' }}
      transition={{ duration: 0.2 }}
      className={cn(
        'relative rounded-lg border bg-panel/80 p-4',
        featured ? 'border-gold/70 shadow-[0_0_0_1px_rgba(201,168,76,0.5)]' : 'border-gold/25',
        className,
      )}
      {...rest}
    >
      <span className="pointer-events-none absolute left-1 top-1 h-3 w-3 border-l border-t border-gold/50" />

      <span className="pointer-events-none absolute right-1 top-1 h-3 w-3 border-r border-t border-gold/50" />

      <span className="pointer-events-none absolute bottom-1 left-1 h-3 w-3 border-b border-l border-gold/50" />

      <span className="pointer-events-none absolute bottom-1 right-1 h-3 w-3 border-b border-r border-gold/50" />

      {children}
    </motion.div>
  );
}
```

Note: `motion.div`'s `className`/`children` props are typed compatibly with `React.ComponentPropsWithoutRef<'div'>` via `...rest` spread — if `tsc` flags any prop mismatch from spreading `rest` (which includes `onClick`/etc. from `React.ComponentPropsWithoutRef<'div'>`) onto `motion.div`, narrow the spread to the specific DOM props actually needed (`id`, `onClick`) rather than a blanket `...rest` — check this during Step 2.

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS, zero new errors/warnings. If `tsc` reports a type conflict on the `motion.div` spread (see note above), fix by narrowing the spread as described, re-run, confirm clean.

- [ ] **Step 3: Commit**

```bash
git add components/rpg/RpgCard.tsx
git commit -m "feat: componente RpgCard (estado featured) do rework AAA HUD"
```

---

### Task 6: Home (`app/page.tsx`) rework

**Files:**
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: Task 2's `RpgPanel`, Task 3's `RibbonHeading`, Task 4's `RpgButton`.
- Produces: no new exports — page-level change only.

- [ ] **Step 1: Rewrite the page**

Replace the entire contents of `app/page.tsx` with:

```tsx
'use client';

import Link from 'next/link';
import { Text } from '@mantine/core';
import { Icon } from '@iconify/react';
import { motion } from 'motion/react';
import { RpgPanel } from '@/components/rpg/RpgPanel';
import { RibbonHeading } from '@/components/rpg/RibbonHeading';
import { RpgButton } from '@/components/rpg/RpgButton';

// Home: só um portal de entrada (uso pessoal, um único dono, sem contas de
// usuário — ver `.claude/rules/table-concept.md`). Um único botão leva pra
// `/mesas`, a lista de todas as mesas já criadas. Visual do rework AAA HUD —
// ver docs/superpowers/specs/2026-08-28-aaa-hud-redesign-design.md.
export default function Home() {
  const runeBand = (
    <div className="rpg-label border-y border-gold/20 px-4 py-[0.4rem] text-center text-[0.6rem] text-gold/30 overflow-hidden whitespace-nowrap">
      ✦ STORYWEAVER ✦ MESTRE E JOGADORES ✦ STORYWEAVER ✦ MESTRE E JOGADORES ✦
    </div>
  );

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-[560px]"
      >
        <RpgPanel
          variant="glass"
          className="overflow-hidden !p-0"
        >
          {runeBand}

          <div className="px-8 py-10 text-center">
            <div className="mb-6 flex justify-center">
              <RpgPanel
                variant="glass"
                glow
                className="flex h-20 w-20 items-center justify-center !rounded-full !border-[rgba(201,168,76,0.4)] !p-0 text-gold"
              >
                <Icon
                  icon="lucide:scroll-text"
                  width={36}
                  height={36}
                />
              </RpgPanel>
            </div>

            <RibbonHeading size="lg">
              Storyweaver
            </RibbonHeading>

            <Text className="mt-4 text-[0.95rem] italic leading-relaxed text-parchment/70">
              Gerencie suas mesas de RPG.
            </Text>

            <RpgButton
              component={Link}
              href="/mesas"
              tone="cta"
              leftSection={(
                <Icon icon="lucide:scroll" />
              )}
              fullWidth
              className="mt-6"
            >
              Iniciar
            </RpgButton>

            <Text className="rpg-label mt-6 text-[0.65rem] text-gold/40">
              Sua mesa, suas fichas, sua lenda
            </Text>
          </div>

          {runeBand}
        </RpgPanel>
      </motion.div>
    </main>
  );
}
```

Note: `RpgPanel`'s corner decorations (from Task 2) would visually clash on the small circular seal — the `!rounded-full` override combined with the square corner `<span>`s from `RpgPanelCorners` will look wrong on a circle. Before finalizing, either (a) confirm visually that the corners are subtle enough to be acceptable, or (b) if they look wrong, replace the seal `RpgPanel` with a plain `<div>` using the `animate-pulse-glow` Tailwind class directly (no `RpgPanel` wrapper) instead of nesting a full `RpgPanel` for a small circular badge — use judgment here, this is a visual call to make while looking at the actual render, not by reading code.

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS, zero new errors/warnings.

- [ ] **Step 3: Manual visual verification**

Start the dev server if not already running (check for an existing instance on port 3000 first per Global Constraints). Open `/` in a browser (or via `claude-in-chrome`/Playwright if available) and confirm: the panel renders with the glass texture, the seal glows, the title shows with the ornamental divider, the "Iniciar" button is styled red/gold and navigates to `/mesas` on click. Fix the corner-decoration issue noted in Step 1 if it looks wrong.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: reconstroi a Home com o design system AAA HUD"
```

---

### Task 7: `/mesas` (`app/mesas/page.tsx`) rework

**Files:**
- Modify: `app/mesas/page.tsx`

**Interfaces:**
- Consumes: Task 2's `RpgPanel`, Task 3's `RibbonHeading`, Task 4's `RpgButton`, Task 5's `RpgCard`. All existing hooks/logic (`useCreateTableLogicData`, `useRenameTableLogicData`, `useDeleteTableLogicData`, `useQuery`) are unchanged — this task only touches the JSX returned by the component and the `Modal`'s `styles` prop.
- Produces: no new exports — page-level change only.

- [ ] **Step 1: Update imports**

Add to the top of `app/mesas/page.tsx`:

```tsx
import { motion } from 'motion/react';
import { RpgPanel } from '@/components/rpg/RpgPanel';
import { RibbonHeading } from '@/components/rpg/RibbonHeading';
import { RpgButton } from '@/components/rpg/RpgButton';
import { RpgCard } from '@/components/rpg/RpgCard';
```

Remove `Title` from the existing `import { Button, Card, Group, Loader, Menu, Modal, Stack, Text, Title } from '@mantine/core';` line (no longer used once Step 2 replaces it) — keep `Button, Group, Loader, Menu, Modal, Stack, Text` (note: `Button` is still used inside `Menu.Target`'s 3-dot trigger and inside `Menu.Item`; `Card` becomes unused once Step 3 replaces every `<Card>` with `<RpgCard>` — remove `Card` from the import too).

- [ ] **Step 2: Replace the header**

Replace:
```tsx
        <Group
          justify="space-between"
          align="center"
          className="mb-6"
        >
          <Title
            order={1}
            c="primary.5"
            className="uppercase tracking-[0.08em]"
          >
            Mesas
          </Title>

          <Button
            component={Link}
            href="/"
            variant="subtle"
            color="gray"
            leftSection={(
              <Icon icon="lucide:arrow-left" />
            )}
          >
            Voltar
          </Button>
        </Group>

        <Button
          fullWidth
          onClick={openCreate}
          leftSection={(
            <Icon icon="lucide:dices" />
          )}
          className="mb-8 uppercase tracking-[0.08em]"
        >
          Nova mesa
        </Button>
```

with:
```tsx
        <div className="mb-6 flex items-center justify-between">
          <RibbonHeading size="md">
            Mesas
          </RibbonHeading>

          <RpgButton
            component={Link}
            href="/"
            tone="ghost"
            size="xs"
            leftSection={(
              <Icon icon="lucide:arrow-left" />
            )}
          >
            Voltar
          </RpgButton>
        </div>

        <RpgButton
          tone="cta"
          fullWidth
          onClick={openCreate}
          leftSection={(
            <Icon icon="lucide:dices" />
          )}
          className="mb-8"
        >
          Nova mesa
        </RpgButton>
```

- [ ] **Step 3: Replace the table list cards**

Replace:
```tsx
            {tables.map((table) => (
              <Card
                key={table.id}
                padding="md"
              >
                <Group
                  justify="space-between"
                  wrap="nowrap"
                >
```

with:
```tsx
            {tables.map((table, index) => (
              <motion.div
                key={table.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
              <RpgCard className="!bg-panel/60 p-4">
                <Group
                  justify="space-between"
                  wrap="nowrap"
                >
```

And its closing tags — find:
```tsx
                  </Group>
                </Group>
              </Card>
            ))}
```

replace with:
```tsx
                  </Group>
                </Group>
              </RpgCard>
              </motion.div>
            ))}
```

Inside that same card block, replace the table code line:
```tsx
                    <Text
                      size="xs"
                      className="font-accent text-parchment/50"
                    >
                      {`Código: ${table.code}`}
                    </Text>
```
with a small badge treatment:
```tsx
                    <Text
                      size="xs"
                      className="rpg-label text-gold/50"
                    >
                      {`Código: ${table.code}`}
                    </Text>
```

And re-style the "Mestrar"/"Visualizar" buttons — replace:
```tsx
                    <Button
                      component={Link}
                      href={`/mesa/${table.code}/mestre`}
                      size="xs"
                      leftSection={(
                        <Icon icon="lucide:crown" />
                      )}
                    >
                      Mestrar
                    </Button>

                    <Button
                      component={Link}
                      href={`/mesa/${table.code}/exibicao`}
                      target="_blank"
                      size="xs"
                      variant="light"
                      leftSection={(
                        <Icon icon="lucide:cast" />
                      )}
                    >
                      Visualizar
                    </Button>
```
with:
```tsx
                    <RpgButton
                      component={Link}
                      href={`/mesa/${table.code}/mestre`}
                      tone="cta"
                      size="xs"
                      leftSection={(
                        <Icon icon="lucide:crown" />
                      )}
                    >
                      Mestrar
                    </RpgButton>

                    <RpgButton
                      component={Link}
                      href={`/mesa/${table.code}/exibicao`}
                      target="_blank"
                      tone="ghost"
                      size="xs"
                      leftSection={(
                        <Icon icon="lucide:cast" />
                      )}
                    >
                      Visualizar
                    </RpgButton>
```

Leave the `Menu`/`Menu.Target`/`Menu.Dropdown`/`Menu.Item` block exactly as-is for this step (styled in Step 4).

- [ ] **Step 4: Style the Menu dropdown as glass**

Add a `styles` prop to the existing `<Menu position="bottom-end" withinPortal>` — change it to:
```tsx
                    <Menu
                      position="bottom-end"
                      withinPortal
                      styles={{
                        dropdown: { backgroundColor: 'rgba(28,20,13,0.92)', backdropFilter: 'blur(8px)', border: '1px solid rgba(201,168,76,0.3)' },
                      }}
                    >
```

- [ ] **Step 5: Update the empty state**

Replace:
```tsx
            {tables.length === 0 ? (
              <Text className="text-center text-parchment/50">
                Nenhuma mesa criada ainda.
              </Text>
            ) : null}
```
with:
```tsx
            {tables.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <Icon
                  icon="lucide:scroll"
                  width={40}
                  height={40}
                  className="text-gold/25"
                />

                <Text className="text-parchment/50">
                  Nenhuma mesa criada ainda.
                </Text>
              </div>
            ) : null}
```

- [ ] **Step 6: Style the modals as glass**

The `Modal` used inline for "Excluir mesa" (wrapping `DeleteTableLogicComponent`) gets a `styles` prop matching the Menu dropdown treatment from Step 4:
```tsx
      <Modal
        opened={!!deletingTable}
        onClose={() => setDeletingTable(null)}
        title="Excluir mesa"
        centered
        styles={{
          content: { backgroundColor: 'rgba(28,20,13,0.92)', backdropFilter: 'blur(8px)' },
        }}
      >
```

`CreateTableLogicComponent`/`RenameTableLogicComponent` render their own internal `<Modal>` (inside `resources/table/logics/CreateTable.tsx`/`RenameTable.tsx`, not this file) — leave those untouched in this task; the global `Modal` styles already set in `libs/mantine/mantine-theme.ts` (border + title color) already give them a baseline consistent look, and reworking those two files is out of scope for this plan (only `app/page.tsx` and `app/mesas/page.tsx` are in scope per the spec).

- [ ] **Step 7: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS, zero new errors/warnings. If `Card`/`Title` are still imported but now unused, remove them (ESLint should catch this as an error given this project's lint config treats unused imports as errors — confirm by reading the lint output).

- [ ] **Step 8: Manual visual verification**

With the dev server running, open `/mesas`: confirm the header shows the new `RibbonHeading` + ghost "Voltar" button, "Nova mesa" is styled as the red CTA, existing table cards render with gold corner decorations and a staggered fade-in, "Mestrar"/"Visualizar" buttons are styled, the 3-dot menu dropdown has the glass look, and the empty state (if you temporarily have zero tables, or by reasoning about the JSX) shows the icon. Test the full loop: create a throwaway table via "Nova mesa" (confirm it still creates and redirects to the Tela do Mestre), rename it, delete it — confirm none of the underlying behavior broke, only the visuals changed.

- [ ] **Step 9: Commit**

```bash
git add app/mesas/page.tsx
git commit -m "feat: reconstroi /mesas com o design system AAA HUD"
```

---

### Task 8: Verificação final + table-concept.md

**Files:**
- Modify: `.claude/rules/table-concept.md`

**Interfaces:** none — documentation and end-to-end verification only.

- [ ] **Step 1: Full type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS, zero errors, exactly the same 4 pre-existing warnings.

- [ ] **Step 2: Full manual pass**

Via `claude-in-chrome`/Playwright if available, otherwise via `curl`/manual browser check: load `/`, click "Iniciar", land on `/mesas`, create a table, confirm redirect to `/mesa/[code]/mestre` still works and that page still renders normally (this plan didn't touch it, but confirm nothing broke transitively — e.g. a shared import wasn't accidentally changed). Delete the test table afterward, no residue.

- [ ] **Step 3: Update `table-concept.md`**

Add a new dated section at the end of the file documenting: the new `components/rpg/` design system (`RpgPanel`, `RibbonHeading`, `RpgButton`, `RpgCard`), the two new color tokens (`PARCHMENT_BG`/`INK_TEXT`), the two new CSS texture classes, and that Home + `/mesas` were rebuilt with them — explicitly note this is the pilot for a design language that will be extended to the Wizard/Tela do Mestre/Tela de Exibição in future specs (not done yet, out of scope here). Follow the file's existing prose style (dense paragraphs, concrete verification steps, no headers deeper than `###`).

- [ ] **Step 4: Commit**

```bash
git add .claude/rules/table-concept.md
git commit -m "docs: registra o rework visual AAA HUD (piloto Home + /mesas) em table-concept.md"
```
