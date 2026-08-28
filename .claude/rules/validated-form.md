# Formulário Validado — useValidatedFormState + useMutation

Use este padrão em todo formulário com validação e envio para a API.

## Regras

- Schema Yup declarado fora do componente, nome `{ação}Schema` em camelCase.
- Todos os retornos de `useValidatedFormState` prefixados com o nome da ação — nunca use `state`, `field`, `validate` genéricos.
- Validação ocorre na função de submit do componente, **antes** de `mutate()` — nunca dentro do `mutationFn`.
- `setValue(path, '')` para limpar campos de texto — nunca `undefined` (quebra o input controlado).

## Desestruturação de `useValidatedFormState`

```ts
const {
  state: loginState,       // objeto do formulário — passa para o service
  field: loginField,       // spread direto no input: value, onChange, error, onValidate
  setValue: loginSetValue, // setar campo imperativamente
  validate: loginValidate, // dispara validação; retorna Promise<boolean>
} = useValidatedFormState(loginSchema);
```

## Estrutura completa

```tsx
const loginSchema = yup.object().shape({
  email: yup.string().required().email(),
  password: yup.string().required().min(8),
});

export default function LoginPage() {
  const {
    state: loginState,
    field: loginField,
    setValue: loginSetValue,
    validate: loginValidate,
  } = useValidatedFormState(loginSchema);

  const {
    isPending: loginIsPending,
    mutate: loginMutate,
  } = useMutation({
    mutationFn: () => loginService({ body: loginState }),
    onSuccess: (data) => {
      // navegação ou efeito pós-sucesso
    },
    onError: (err: any) => {
      if (err?.message) {
        notifications.show({ title: 'Erro', message: err.message, color: 'red' });
      }
    },
  });

  async function login() {
    if (!await loginValidate()) return;
    loginMutate();
  }

  return (
    <Form
      onSubmit={login}
      className="flex flex-col gap-6"
    >
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

      <Button
        type="submit"
        loading={loginIsPending}
        disabled={loginIsPending}
      >
        Entrar
      </Button>
    </Form>
  );
}
```

## Notas

- `field(path)` retorna `{ value, onChange, error, onValidate }`. O `required` é separado — é atributo visual do Mantine, não vem do Yup.
- `onValidate` é chamado automaticamente pelos inputs no `onBlur`.
- Para limpar campo após erro: `loginSetValue('password', '')` — nunca `undefined`.
