# Componente UtilsIf

`import { UtilsIf } from '@/src/components/utils/If';`

## Interface — dois modos exclusivos

### Modo 1 — condição simples (`condition`)

```ts
{
  condition: any;          // valor truthy/falsy
  children: () => ReactNode;
}
```

### Modo 2 — múltiplos casos (`cases`)

```ts
{
  cases: Array<{
    condition?: boolean;   // se omitido, age como "else" (sempre renderiza)
    content: () => ReactNode;
  }>;
}
```

Os dois modos são mutuamente exclusivos — nunca misture `condition` com `cases` no mesmo componente.

## Quando usar

Substitui `{condition && <Comp />}` e ternários de renderização condicional. `children` e `content` são sempre **render functions** `() => ReactNode`, nunca JSX direto.

## Padrões corretos

```tsx
{/* Modo condition — exibe algo ou nada */}
<UtilsIf condition={isLoading}>
  {() => <Loader2 className="animate-spin" />}
</UtilsIf>

{/* Modo condition — com dado nullable */}
<UtilsIf condition={!!user}>
  {() => <p>Olá, {user!.name}</p>}
</UtilsIf>

{/* Modo cases — equivale a if / else if / else */}
<UtilsIf
  cases={[
    {
      condition: isLoading,
      content: () => <Loader2 className="animate-spin" />,
    },
    {
      condition: !!data,
      content: () => <DataTable rows={data!} />,
    },
    {
      // sem condition = else
      content: () => <p className="text-gray-400">Nenhum dado.</p>,
    },
  ]}
/>
```

## Erros comuns

```tsx
{/* ❌ Errado — children não é render function */}
<UtilsIf condition={isLoading}>
  <Loader2 />
</UtilsIf>

{/* ✅ Correto */}
<UtilsIf condition={isLoading}>
  {() => <Loader2 />}
</UtilsIf>

{/* ❌ Errado — misturando os dois modos */}
<UtilsIf condition={x} cases={[...]}>
  {() => <p />}
</UtilsIf>
```
