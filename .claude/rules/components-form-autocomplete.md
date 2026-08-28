# Componente FormAutocomplete

`import { FormAutocomplete } from '@/src/components/form/Autocomplete';`

## Interface

```ts
type FormAutocompleteProps<T> = {
  data?: T[];
  valueField?: Hook<T>;   // campo que vira value (modo objeto)
  labelField?: Hook<T>;   // campo que vira label (modo objeto)
  onComplete?: (value: string) => void; // chamado com debounce de 500ms ao digitar
  loading?: boolean;
  limit?: number;         // máximo de opções exibidas (padrão: 10)
  disabled?: boolean;
  required?: boolean;
  error?: string;
  label?: string;
  placeholder?: string;
  description?: string;
  onChange?: (value: string) => void;  // chamado ao selecionar uma opção
  onValidate?: () => void;
};
```

## Comportamento

- O campo de texto é controlado internamente (`term`) — exibe o **label** da opção selecionada.
- `onChange` recebe o **value** da opção selecionada (não o texto digitado).
- `onComplete` é chamado com **debounce de 500ms** a cada vez que o usuário digita, para disparar busca na API.
- `onValidate` é chamado no `onBlur` do input — integra com `useValidatedFormState`.
- O dropdown some automaticamente quando `data` está vazio.

## Dois modos de uso

### Modo objeto — busca remota com entidades

Use `valueField` + `labelField` quando `data` é array de objetos do domínio. O componente faz a transformação internamente.

```tsx
const [studentSearch, setStudentSearch] = useState('');
const { data: studentsData } = useQuery({
  queryKey: ['students-search', studentSearch],
  queryFn: ({ signal }) => getStudentsService({ signal, query: { search: studentSearch } }),
  enabled: studentSearch.length >= 2,
});

<FormAutocomplete
  label="Aluno"
  placeholder="Digite o nome..."
  data={studentsData?.data.items ?? []}
  valueField="id"
  labelField="name"
  onComplete={setStudentSearch}
  loading={studentsIsFetching}
  {...enrollField('studentId')}
  required
/>
```

### Modo direto — array de strings

Omita `valueField`/`labelField` e passe `data` como `string[]`.

```tsx
<FormAutocomplete
  label="Cidade"
  placeholder="Digite a cidade..."
  data={['São Paulo', 'Rio de Janeiro', 'Belo Horizonte']}
  onComplete={setCitySearch}
  {...addressField('city')}
/>
```

## Uso com `useValidatedFormState`

Spread direto do `field(path)`. O `onValidate` também é chamado no `onBlur`.

```tsx
const {
  field: enrollField,
} = useValidatedFormState(enrollSchema);

<FormAutocomplete
  label="Aluno"
  placeholder="Buscar aluno..."
  data={students}
  valueField="id"
  labelField="name"
  onComplete={setStudentSearch}
  {...enrollField('studentId')}
  required
/>
```

## Notas

- `onChange` recebe o `value` (id ou string), não o texto visível no input.
- O estado visual do input é gerenciado internamente — não tente controlar `value` externamente.
- Para resultados remotos, sempre use `onComplete` para disparar a query; não passe `data` diretamente do estado de digitação.
