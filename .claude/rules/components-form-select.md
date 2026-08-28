# Componente FormSelect

`import { FormSelect } from '@/src/components/form/Select';`

## Interface

```ts
type FormSelectProps<T> = Omit<SelectProps, 'data'> & {
  onChange?: (value: string | null) => void;
  onValidate?: () => void;

  // Modo objeto — transforma array de objetos em options do Mantine
  data?: T[];
  valueField?: keyof T | string;   // campo que vira value
  labelField?: keyof T | string;   // campo que vira label

  // Modo direto — passa data no formato Mantine (string[] ou { value, label }[])
  // data?: SelectProps['data']
};
```

## Dois modos de uso

### Modo objeto — array de entidades

Use `valueField` + `labelField` quando `data` é um array de objetos do domínio. O componente faz a transformação internamente.

```tsx
<FormSelect
  label="Curso"
  placeholder="Selecione o curso"
  data={courses}
  valueField="id"
  labelField="name"
  {...subjectField('courseId')}
  required
/>
```

### Modo direto — dados já no formato Mantine

Omita `valueField`/`labelField` e passe `data` no formato nativo do Mantine.

```tsx
<FormSelect
  label="Status"
  placeholder="Selecione"
  data={['Ativo', 'Inativo', 'Trancado']}
  {...studentField('status')}
/>

<FormSelect
  label="Modalidade"
  data={[
    { value: 'EAD', label: 'EAD' },
    { value: 'Presencial', label: 'Presencial' },
    { value: 'Semipresencial', label: 'Semipresencial' },
  ]}
  {...courseField('modality')}
  required
/>
```

## Uso com `useValidatedFormState`

Spread direto do `field(path)`. O `onValidate` também é chamado no `onDropdownClose`.

```tsx
const {
  field: subjectField,
} = useValidatedFormState(subjectSchema);

<FormSelect
  label="Curso"
  placeholder="Selecione o curso"
  data={courses}
  valueField="id"
  labelField="name"
  {...subjectField('courseId')}
  required
/>
```
