# Componente UtilsCard

`import { UtilsCard } from '@/src/components/utils/Card';`

## Interface

```ts
type UtilsCardProps = React.ComponentPropsWithoutRef<'section'> & {
  noPadding?: boolean;
};
// Aceita todos os atributos HTML de <section>, incluindo className e children
```

## Estilo padrão (já aplicado internamente)

```
bg-white  p-6  rounded  border border-gray-100  shadow-sm
```

Use `noPadding` para remover o `p-6` padrão (ex: cards com imagem de borda a borda).
Não repita essas classes em `className` — use-o apenas para adicionar ou sobrescrever.

## Quando usar

Use `UtilsCard` para qualquer painel branco com borda e sombra que agrupe conteúdo relacionado.
Substitui o padrão manual `<div className="bg-white p-6 rounded-sm border border-gray-100 shadow-sm">`.

## Padrões corretos

```tsx
{/* Card simples */}
<UtilsCard>
  <h3>Título</h3>
</UtilsCard>

{/* Card com layout flex */}
<UtilsCard className="flex flex-col gap-4">
  <h3>Título</h3>

  <p>Conteúdo</p>
</UtilsCard>

{/* Card sem padding (ex: imagem de capa) */}
<UtilsCard
  noPadding
  className="overflow-hidden"
>
  <img src="/capa.jpg" alt="Capa" />
</UtilsCard>
```
