# Componente Form

`import { Form } from '@/src/components/form/Form';`

## Interface

```ts
type FormProps = React.ComponentPropsWithoutRef<'form'> & {
  children: React.ReactNode;
  onSubmit?: () => void;   // sem evento — o preventDefault já está aplicado internamente
};
```

## Quando usar

Use `Form` em **todo formulário** do projeto. Ele previne o `submit` nativo do browser e chama `onSubmit` sem precisar passar o evento ou chamar `e.preventDefault()` manualmente.

## Padrão correto

```tsx
<Form
  onSubmit={login}
  className="flex flex-col gap-6"
>
  <FormTextInput
    label="E-mail"
    {...loginField('email')}
    required
  />

  <FormPassword
    label="Senha"
    {...loginField('password')}
    required
  />

  <Button type="submit">
    Entrar
  </Button>
</Form>
```

## Notas

- `onSubmit` é uma função sem parâmetros — não recebe o `FormEvent`.
- Aceita todos os atributos HTML de `<form>` via spread (ex: `className`, `id`, `noValidate`).
- O botão de submit deve ter `type="submit"` para acionar o `onSubmit` ao pressionar Enter.
