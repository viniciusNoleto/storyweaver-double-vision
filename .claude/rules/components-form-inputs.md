# Inputs de formulário

```ts
import { FormTextInput } from '@/src/components/form/TextInput';
import { FormPassword } from '@/src/components/form/Password';
import { FormTextarea } from '@/src/components/form/Textarea';
import { FormNumberInput } from '@/src/components/form/Number';
```

## O que fazem

Todos são wrappers finos sobre os componentes equivalentes do Mantine. Diferenças em relação ao Mantine puro:

- `onChange` recebe o **valor já extraído** (string ou number), não o evento.
- Chamam `onValidate()` automaticamente no `onChange` e no `onBlur` — dispara a validação individual no `useValidatedFormState`.

## Interfaces

```ts
// FormTextInput — valor string
type FormTextInputProps = TextInputProps & {
  onChange?: (value: string) => void;
  onValidate?: () => void;
};

// FormPassword — valor string
type FormPasswordProps = PasswordInputProps & {
  onChange?: (value: string) => void;
  onValidate?: () => void;
};

// FormTextarea — valor string
type FormTextareaProps = TextareaProps & {
  onChange?: (value: string) => void;
  onValidate?: () => void;
};

// FormNumberInput — valor number
type FormNumberInputProps = NumberInputProps & {
  onChange?: (value: number) => void;
  onValidate?: () => void;
};
```

## Uso com `useValidatedFormState`

Spread direto do `field(path)` — ele já fornece `value`, `onChange`, `error` e `onValidate`.
Passe `required` separado (atributo visual do Mantine, não vem do yup).

```tsx
<FormTextInput
  label="E-mail"
  placeholder="seu@email.com"
  {...loginField('email')}
  required
/>

<FormPassword
  label="Senha"
  placeholder="••••••••"
  {...loginField('password')}
  required
/>

<FormTextarea
  label="Observações"
  placeholder="Descreva o problema..."
  {...requestField('description')}
  rows={4}
/>

<FormNumberInput
  label="Carga horária"
  placeholder="0"
  {...subjectField('hours')}
  min={0}
  required
/>
```
