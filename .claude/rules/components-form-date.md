# Componente FormDatePicker

`import { FormDatePicker } from '@/src/components/form/Date';`

## Interface — três modos exclusivos via `type`

```ts
// Modo single (padrão)
type FormDatePickerProps = {
  type?: 'single' | never | undefined | null;
  value: DateValue;
  onChange?: (value: DateValue) => void;
  onValidate?: () => void;
  // + todos os props do DatePickerInput do Mantine (exceto onChange, value, type)
}

// Modo multiple
type FormDatePickerProps = {
  type: 'multiple';
  value: DateValue[];
  onChange?: (value: DateValue[]) => void;
  onValidate?: () => void;
}

// Modo range
type FormDatePickerProps = {
  type: 'range';
  value: [DateValue, DateValue];
  onChange?: (value: [DateValue, DateValue]) => void;
  onValidate?: () => void;
}
```

## Comportamento padrão (já aplicado internamente)

- Formato de exibição: `DD/MM/YYYY`
- Placeholder: `dd/mm/yyyy`
- `clearable` sempre ativo
- `onValidate` chamado no `onChange`, `onDropdownClose` e `onBlur`

## Quando usar

Use `FormDatePicker` para todos os campos de data do projeto. Substitui o `DatePickerInput` do Mantine diretamente.

## Padrões corretos

```tsx
{/* Data única (padrão) */}
<FormDatePicker
  label="Data de nascimento"
  {...studentField('birth_date')}
  required
/>

{/* Intervalo de datas */}
<FormDatePicker
  type="range"
  label="Período do relatório"
  {...reportField('period')}
/>

{/* Múltiplas datas */}
<FormDatePicker
  type="multiple"
  label="Datas de aula"
  {...scheduleField('dates')}
/>
```

## Uso com `useValidatedFormState`

Spread direto do `field(path)`. O tipo do campo no schema Yup deve ser compatível com `DateValue` (string ISO ou `Date`).

```tsx
const {
  field: contractField,
} = useValidatedFormState(contractSchema);

<FormDatePicker
  label="Data de início"
  {...contractField('start_date')}
  required
/>
```

## Notas

- `onChange` recebe o valor já extraído (`DateValue`, `DateValue[]` ou `[DateValue, DateValue]`), não o evento.
- Para `type="range"`, `value` deve ser sempre uma tupla de dois elementos (pode conter `null`).
- O componente já formata a exibição — não passe `valueFormat` ou `placeholder` manualmente.
