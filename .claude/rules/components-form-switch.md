# Componente FormSwitch

`import { FormSwitch } from '@/src/components/form/Switch';`

## Interface

```ts
type FormSwitchProps = SwitchProps & {
  value?: boolean;                     // estado do switch (controlado)
  onChange?: (value: boolean) => void; // recebe o valor booleano extraído
  onValidate?: () => void;
};
```

## Comportamento

- `onChange` recebe o **boolean** extraído do evento (`event.currentTarget.checked`), não o evento.
- `onValidate` é chamado no `onChange` e no `onBlur`.
- Internamente usa `checked={props.value}` — o campo se chama `value` para compatibilidade com `useValidatedFormState`.

## Quando usar

Use `FormSwitch` para campos booleanos de formulário. Substitui o `Switch` do Mantine quando integrado com `useValidatedFormState`.

## Padrões corretos

```tsx
{/* Toggle simples */}
<FormSwitch
  label="Ativo"
  {...courseField('is_active')}
/>

{/* Com label e descrição */}
<FormSwitch
  label="Notificações por e-mail"
  description="Receba avisos sobre cobranças e comunicados."
  {...settingsField('email_notifications')}
/>
```

## Uso com `useValidatedFormState`

Spread direto do `field(path)`. O schema Yup deve declarar o campo como `yup.boolean()`.

```tsx
const activateSchema = yup.object({
  notify_student: yup.boolean().default(false).required(),
});

const {
  field: activateField,
} = useValidatedFormState(activateSchema);

<FormSwitch
  label="Notificar aluno por e-mail"
  {...activateField('notify_student')}
/>
```

## Notas

- `onChange` recebe `boolean`, não o evento DOM.
- Aceita todos os props do `Switch` do Mantine (ex: `label`, `description`, `size`, `color`).
