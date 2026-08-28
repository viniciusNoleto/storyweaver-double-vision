# Componente FormButton

`import { FormButton } from '@/src/components/form/Button';`

## Interface

```ts
type FormButtonProps = ButtonProps & {
  label?: string;       // texto do botão (alternativa a children)
  tooltip?: string;     // texto do Tooltip que envolve o botão
  icon?: string;        // ícone central (iconify string) — usado quando não há label/children
  leftIcon?: string;    // ícone à esquerda (iconify string)
  rightIcon?: string;   // ícone à direita (iconify string)
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};
```

Ícones usam a biblioteca `@iconify/react` — o valor é uma string no formato `"prefixo:nome"` (ex: `"lucide:plus"`, `"lucide:trash-2"`).

## Quando usar

Use `FormButton` quando precisar de tooltip, ícone via string iconify, ou label como prop. Para botões simples sem essas necessidades, use o `Button` do Mantine diretamente.

## Padrões corretos

```tsx
{/* Botão com label e ícone à direita */}
<FormButton
  color="primary"
  label="Novo Curso"
  rightIcon="lucide:plus"
  onClick={handleCreate}
/>

{/* Botão só com ícone e tooltip (ex: ação em linha de tabela) */}
<FormButton
  variant="subtle"
  icon="lucide:trash-2"
  tooltip="Excluir disciplina"
  color="red"
  onClick={() => handleDelete(item.id)}
/>

{/* Botão com tooltip e children */}
<FormButton
  tooltip="Exportar para o MEC"
  leftIcon="lucide:download"
  onClick={handleExport}
>
  Exportar SISTEC
</FormButton>
```

## Notas

- `children` tem prioridade sobre `label`. Se nenhum dos dois for passado e `icon` for fornecido, renderiza apenas o ícone.
- O `Tooltip` é sempre renderizado, mas fica invisível quando `tooltip` é `undefined`.
- Ícones `leftIcon`/`rightIcon` são renderizados com `w-4 h-4` fixo.
