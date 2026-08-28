# Estilização — Tailwind em vez de `style`

## Regra geral

**Nunca use a prop `style={{ ... }}` quando o mesmo resultado é alcançável com classes Tailwind.** Isso vale para JSX puro (`<div>`, `<span>`, `<button>`) e para componentes Mantine (que aceitam `className` normalmente).

Combine classes condicionais/estáticas com `cn()` (`@/src/libs/utils`) em vez de montar um objeto `style` com ternários.

```tsx
// ❌ Errado
<div style={{ opacity: draggingId === character.id ? 0.35 : 1, cursor: onDropCharacter ? 'grab' : 'default' }}>

// ✅ Correto
<div className={cn(onDropCharacter ? 'cursor-grab' : 'cursor-default', draggingId === character.id ? 'opacity-[0.35]' : 'opacity-100')}>
```

## Valores numéricos vindos de constantes JS

Quando um tamanho/posição vem de uma constante do módulo (ex: `const IMAGE_SIZE = 84`) e **não muda em runtime** (não depende de props/state, só é calculado uma vez a partir de outras constantes), ainda assim prefira a classe Tailwind com o **valor literal** (`w-[84px]`), em vez de `style={{ width: IMAGE_SIZE }}`. Documente a relação em comentário logo acima, já que não há checagem automática ligando o número da classe à constante:

```tsx
// 96px = IMAGE_SIZE (84) + OUTER_SPREAD (6) * 2 — atualize a classe abaixo
// se qualquer uma dessas constantes mudar.
<div className="flex h-[96px] w-[96px] items-center justify-center">
```

## Quando `style` (ou a prop `animate` da `motion`) é aceitável

`style` continua sendo a ferramenta certa apenas quando o valor é **genuinamente dinâmico a cada render/frame** e não pode ser expresso por um conjunto finito de classes:

- Posição de um elemento seguindo o ponteiro durante um drag (`left`/`top` recalculados a cada `pointermove`) — ver `TableBoard.tsx`.
- Cor/`boxShadow`/`filter` interpolados continuamente pela `motion` (`animate={{ boxShadow: [...] }}`) para uma transição suave (ex: anel de vida mudando de cor) — ver `DisplayToken.tsx`. Isso não é a prop `style`, mas o mesmo princípio se aplica: só use valores computados inline quando a Tailwind não tem como gerar a classe adiantado.

Nesses casos, mantenha em `style`/`animate` **apenas as propriedades realmente dinâmicas** — tudo que for estático (posição relativa, `pointerEvents`, `zIndex`, etc.) deve sair para `className`.

```tsx
// ✅ Só o que realmente muda a cada frame fica em style
<div
  className="pointer-events-none fixed z-[1000] -translate-x-1/2 -translate-y-1/2"
  style={{ left: pointer.x, top: pointer.y }}
>
```

## Cores

Nunca escreva um hex "solto" em `style`/classe arbitrária se ele já existe como token em `shared/constants/colors.ts` / `tailwind.config.mjs` (`primary`, `secondary`, `tertiary`, `accent`, `gold`, `gold-light`, `vilgard`, `board`, `panel`, `parchment`). Use a classe do token (`text-secondary-500`, `border-primary-500/40`, etc.). Só use hex arbitrário (`bg-[#...]`) para cores que não têm token — ex: o anel de vida (`RED`/`YELLOW`/`GREEN` de `HealthColor.ts`), que é deliberadamente isolado da paleta de UI (ver `table-concept.md` seção 2).

## Checklist antes de usar `style`

1. Existe uma classe Tailwind (padrão ou arbitrária `[...]`) que expressa o mesmo valor? → use-a.
2. O valor é condicional (dois ou três estados)? → `cn()` com classes por estado, nunca ternário dentro de `style`.
3. O valor só é dinâmico "uma vez por render" (constante calculada)? → classe Tailwind com o número literal + comentário.
4. O valor muda continuamente (drag, animação interpolada)? → `style`/`animate` é aceitável, mas só para essa propriedade específica.
