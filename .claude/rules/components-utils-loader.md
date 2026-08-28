# Componente UtilsLoader

`import { UtilsLoader } from '@/src/components/utils/Loader';`

## Interface

```ts
type UtilsLoaderProps = {
  show: boolean;          // controla visibilidade
  children: () => ReactNode; // render function — montada apenas uma vez
  fallback?: ReactNode;   // exibido enquanto o Suspense resolve (padrão: null)
};
```

## Comportamento

- **Monta uma única vez:** quando `show` passa de `false` para `true`, o conteúdo é montado e nunca mais desmontado — apenas ocultado via `display: none`.
- **Suspense embutido:** `children` é envolvido em `<Suspense fallback={fallback}>` automaticamente.
- Enquanto `show` for `false` e o componente nunca tiver sido exibido, retorna `null` (não renderiza nada).

## Quando usar

Use `UtilsLoader` para painéis, abas ou seções que devem ser montadas apenas quando o usuário acessa pela primeira vez e mantidas no DOM depois disso (ex: abas de detalhe com queries próprias). Evita remontagens e re-fetches ao alternar entre seções.

**Não use** para conteúdo que deve ser desmontado ao sair — use `UtilsIf` nesse caso.

## Padrões corretos

```tsx
{/* Aba que carrega ao ser acessada pela primeira vez e permanece montada */}
<UtilsLoader show={activeTab === 'disciplines'}>
  {() => <DisciplinesFragment courseId={courseId} />}
</UtilsLoader>

<UtilsLoader show={activeTab === 'classes'}>
  {() => <ClassesFragment courseId={courseId} />}
</UtilsLoader>

{/* Com fallback de loading enquanto o chunk JS carrega */}
<UtilsLoader
  show={activeTab === 'grades'}
  fallback={<p className="text-gray-400 text-sm">Carregando...</p>}
>
  {() => <GradesFragment courseId={courseId} />}
</UtilsLoader>
```

## Diferença em relação ao `UtilsIf`

| | `UtilsIf` | `UtilsLoader` |
|---|---|---|
| Desmonta ao esconder | ✅ | ❌ (oculta via CSS) |
| Monta antes do primeiro `show` | ❌ | ❌ |
| Ideal para | conteúdo descartável | abas com queries próprias |

## Notas

- `children` é sempre uma render function `() => ReactNode` — nunca JSX direto.
- O conteúdo oculto usa `display: none` via `style` inline — não interfere com classes Tailwind externas.
- O componente usa `useStoppableEffect` para garantir que a montagem ocorre apenas uma vez.
