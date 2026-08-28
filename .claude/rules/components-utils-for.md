# Componente UtilsFor

`import { UtilsFor } from '@/src/components/utils/For';`

## Interface

```ts
type UtilsForProps<T> = {
  each: T[];                                                 // array a iterar
  children: (ctx: { item: T; index: number }) => ReactNode; // render function
  eachKey?: (ctx: { item: T; index: number }) => React.Key; // chave única (padrão: index)
  empty?: ReactNode;                                         // fallback quando array vazio
};
```

## Quando usar

Substitui `.map()` inline para listas de elementos JSX. Use sempre que iterar um array dentro de JSX para obter keys automáticas, suporte a `empty` e consistência visual com o restante da codebase.

## Padrões corretos

```tsx
{/* Lista simples com chave por id */}
<UtilsFor
  each={items}
  eachKey={({ item }) => item.id}
>
  {({ item }) => (
    <div>{item.name}</div>
  )}
</UtilsFor>

{/* Com fallback para lista vazia */}
<UtilsFor
  each={courses}
  eachKey={({ item }) => item.id}
  empty={<p className="text-gray-400">Nenhum item encontrado.</p>}
>
  {({ item: course }) => (
    <div className="p-4 border rounded-sm">
      <p>{course.name}</p>
    </div>
  )}
</UtilsFor>

{/* Usando index como chave (arrays de valores primitivos) */}
<UtilsFor
  each={STEPS}
  eachKey={({ index }) => index}
>
  {({ item: step, index }) => (
    <span>{index + 1}. {step}</span>
  )}
</UtilsFor>
```
