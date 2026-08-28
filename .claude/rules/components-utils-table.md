# Componente UtilsTable

`import { UtilsTable } from '@/src/components/utils/Table';`

## Interface

```ts
type TableProps<T extends object, U extends Record<string, string>> = {
  rows: T[];           // dados da tabela
  columns: U;          // mapeamento campo → label da coluna
  title?: string;      // título acima da tabela (opcional)
  alias?: ReactNode;   // slot direito do título (botões de ação)
  loading?: boolean;   // exibe LoadingOverlay com blur sobre a tabela
  emptyText?: string;  // texto quando rows está vazio (padrão: 'Nenhum dado encontrado')
  rowKey?: (ctx: { item: T; index: number }) => React.Key;
  actions?: TableAction<T>[] | ((ctx: { item: T; index: number }) => TableAction<T>[]);
  renderCells?: Partial<Record<keyof U, (ctx: { item: T; index: number }) => ReactNode>>;
} & (
  { lastPage: number; page: number; setPage: (page: number) => void }  // com paginação
  | { lastPage?: never; page?: never; setPage?: never }                 // sem paginação
);

type TableAction<T> = FormButtonProps & {
  label?: string;
  icon?: string;       // ícone Iconify (ex: 'lucide:trash-2')
  onClick?: (ctx: { item: T; index: number }) => void;
};
```

## Quando usar

Para listas de dados tabulares com loading automático, estado vazio e ações por linha com tooltip. Substitui tabelas HTML manuais.

## Padrões corretos

```tsx
{/* Tabela básica sem paginação */}
<UtilsTable
  rows={students}
  rowKey={({ item }) => item.id}
  columns={{
    name: 'Nome',
    registration: 'Matrícula',
    status: 'Status',
  }}
  emptyText="Nenhum aluno cadastrado."
/>

{/* Com paginação */}
<UtilsTable
  rows={charges}
  rowKey={({ item }) => item.id}
  loading={chargesIsFetching}
  lastPage={chargesMeta.last_page!}
  page={page}
  setPage={(newPage) => {
    setPage(newPage);
    chargesRefetch();
  }}
  columns={{ description: 'Descrição', amount: 'Valor', status: 'Status' }}
  emptyText="Nenhum item encontrado."
/>

{/* Com renderCells customizados */}
<UtilsTable
  rows={subjects}
  rowKey={({ item }) => item.id}
  columns={{
    name: 'Disciplina',
    courseName: 'Curso',
    hours: 'C/H',
  }}
  loading={isLoading}
  emptyText="Nenhuma disciplina encontrada."
  renderCells={{
    courseName: ({ item }) => (
      <span className="font-semibold uppercase">{item.courseName}</span>
    ),
    hours: ({ item }) => (
      <span className="font-bold text-gray-500">{item.hours}h</span>
    ),
  }}
/>

{/* Com ações dinâmicas por linha */}
<UtilsTable
  rows={payments}
  rowKey={({ item }) => item.id}
  columns={{ description: 'Descrição', amount: 'Valor', status: 'Status' }}
  actions={({ item }) => [
    {
      icon: item.status === 'pago' ? 'lucide:eye' : 'lucide:check-circle-2',
      label: item.status === 'pago' ? 'Ver comprovante' : 'Marcar como pago',
      onClick: ({ item }) => handleAction(item),
    },
  ]}
/>
```

## Notas

- `columns` define a ordem das colunas. Campos não listados não aparecem.
- `renderCells` sobrescreve apenas as células listadas; as demais exibem o valor bruto.
- `loading={true}` exibe `LoadingOverlay` com blur — não precisa de `UtilsIf` externo.
- Ações usam `label` como tooltip automático e como texto do botão quando não há `icon`.
- `lastPage`, `page` e `setPage` são todos obrigatórios ou todos ausentes (union discriminada).
- `setPage` deve sempre chamar `refetch()` em seguida — veja `paginated-list.md`.
