# Resources — Logics

## O que é um Logic

Um Logic encapsula **uma ação sobre um resource**: hook com estado + mutação + componente de UI. Fica em `src/resources/{module}/logics/{ActionName}.tsx` — um arquivo por ação.

```
src/resources/discipline/logics/
├── CreateDiscipline.tsx
├── UpdateDiscipline.tsx
└── DisableDiscipline.tsx
```

Cada arquivo exporta **duas coisas**:
1. `use{ActionName}LogicData(...)` — hook com estado, mutação e helpers
2. `{ActionName}LogicComponent(...)` — componente de UI que recebe o retorno do hook

---

## Padrão 1 — Ação de confirmação (sem formulário)

Usado em: disable, delete, activate, e qualquer ação que só precise de confirmação.

```tsx
import { FormButton } from '@/src/components/form/Button';
import { disableDisciplineService } from '../services/disableDiscipline';
import { useMutation } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';

export function useDisableDisciplineLogicData({ editingDisciplineId, onSuccess }: { editingDisciplineId: string; onSuccess: () => void }) {
  const disableDisciplineMutation = useMutation({
    mutationFn: () => disableDisciplineService({ disciplineId: editingDisciplineId }),
    onSuccess: (res) => {
      notifications.show({ message: res.message, color: 'green' });

      onSuccess();
    },
    onError: (err: any) => {
      notifications.show({
        title: 'Erro',
        message: err?.message ?? 'Não foi possível completar a operação. Tente novamente.',
        color: 'red',
      });
    },
  });

  return {
    disableDisciplineMutation,
  };
}

export function DisableDisciplineLogicComponent({ logicData, disciplineName, onCancel }: { logicData: ReturnType<typeof useDisableDisciplineLogicData>; disciplineName: string; onCancel: () => void }) {
  const {
    disableDisciplineMutation: {
      mutate: disableDiscipline,
      isPending: disableDisciplineIsPending,
    },
  } = logicData;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-gray-600 text-sm">
        {`Tem certeza que deseja desativar a disciplina "${disciplineName}"? Esta ação é irreversível via interface.`}
      </p>

      <div className="flex justify-end gap-2">
        <FormButton
          variant="subtle"
          color="gray"
          onClick={onCancel}
          disabled={disableDisciplineIsPending}
        >
          Cancelar
        </FormButton>

        <FormButton
          color="red"
          loading={disableDisciplineIsPending}
          onClick={() => disableDiscipline()}
        >
          Desativar
        </FormButton>
      </div>
    </div>
  );
}
```

**Botão de confirmação:** `color="red"` para disable/delete, `color="green"` para activate.

---

## Padrão 2 — Ação com formulário (create / update)

```tsx
import { Form } from '@/src/components/form/Form';
import { FormButton } from '@/src/components/form/Button';
import { FormTextInput } from '@/src/components/form/TextInput';
import { useValidatedFormState } from '@/src/utils/state';
import { disciplineSchema } from '../schemas/discipline';
import { createDisciplineService } from '../services/createDiscipline';
import { useMutation } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';

export function useCreateDisciplineLogicData({ courseId, onSuccess }: { courseId: string; onSuccess: () => void }) {
  const createDisciplineValidatedFormState = useValidatedFormState(disciplineSchema);

  const createDisciplineMutation = useMutation({
    mutationFn: () => {
      const { name, description } = createDisciplineValidatedFormState.state;
      return createDisciplineService({
        courseId,
        body: { name, description: description || undefined },
      });
    },
    onSuccess: (res) => {
      notifications.show({ message: res.message, color: 'green' });

      onSuccess();
    },
    onError: (err: any) => {
      notifications.show({
        title: 'Erro',
        message: err?.message ?? 'Não foi possível completar a operação. Tente novamente.',
        color: 'red',
      });
    },
  });

  function createDisciplineReset() {
    createDisciplineValidatedFormState.setState(disciplineSchema.getDefault());
    createDisciplineValidatedFormState.setErrors({});
  }

  return {
    createDisciplineValidatedFormState,
    createDisciplineMutation,
    createDisciplineReset,
  };
}

export function CreateDisciplineLogicComponent({ logicData, onCancel }: { logicData: ReturnType<typeof useCreateDisciplineLogicData>; onCancel: () => void }) {
  const {
    createDisciplineValidatedFormState: {
      field: disciplineField,
      validate: validateDiscipline,
    },
    createDisciplineMutation: {
      mutate: createDisciplineMutate,
      isPending: createDisciplineIsPending,
    },
  } = logicData;

  async function createDiscipline() {
    if (!await validateDiscipline()) return;

    createDisciplineMutate();
  }

  return (
    <Form
      onSubmit={createDiscipline}
      className="flex flex-col gap-4"
    >
      <FormTextInput
        label="Nome"
        placeholder="Ex: Anatomia e Fisiologia Humana"
        required
        {...disciplineField('name')}
      />

      <div className="flex justify-end gap-2 pt-2 border-t border-gray-50">
        <FormButton
          variant="subtle"
          color="gray"
          onClick={onCancel}
          disabled={createDisciplineIsPending}
        >
          Cancelar
        </FormButton>

        <FormButton
          type="submit"
          color="primary"
          loading={createDisciplineIsPending}
        >
          Salvar
        </FormButton>
      </div>
    </Form>
  );
}
```

### Diferença create vs. update

**Create:** hook recebe os params de contexto (ex: `courseId`), `{action}Reset` restaura o schema default.

**Update:** hook recebe `editing{Resource}Id`. O componente pai chama `{action}ValidatedFormState.setState(item as any)` antes de abrir o modal para pré-popular o formulário.

---

## Regras de nomenclatura

| Elemento | Padrão | Exemplo |
|---|---|---|
| Arquivo | `{ActionName}.tsx` | `CreateDiscipline.tsx` |
| Hook | `use{ActionName}LogicData` | `useCreateDisciplineLogicData` |
| Componente | `{ActionName}LogicComponent` | `CreateDisciplineLogicComponent` |
| Campos internos | `{camelCaseAction}{Tipo}` | `createDisciplineMutation`, `createDisciplineReset` |
| Tipo de props | inline no componente | `{ logicData: ReturnType<typeof use...>; onCancel: () => void }` |

Use `type Props = {...}` separado apenas quando as props forem complexas demais para inline.

---

## Como consumir no fragment/page

```tsx
const createDisciplineLogicData = useCreateDisciplineLogicData({
  courseId,
  onSuccess: () => {
    disciplinesRefetch();
    setModals('createDiscipline', false);
  },
});

function openCreateDisciplineModal() {
  createDisciplineLogicData.createDisciplineReset();
  setModals('createDiscipline', true);
}

function openUpdateDisciplineModal(discipline: IDiscipline) {
  setEditingDiscipline(discipline);
  updateDisciplineLogicData.updateDisciplineValidatedFormState.setState(discipline as any);
  setModals('updateDiscipline', true);
}

<Modal
  opened={modals.createDiscipline!}
  onClose={closeCreateDisciplineModal}
  title="Nova Disciplina"
  size="md"
  centered
>
  <CreateDisciplineLogicComponent
    logicData={createDisciplineLogicData}
    onCancel={closeCreateDisciplineModal}
  />
</Modal>
```

---

## Schema inline vs. arquivo separado

- **Schema simples ou exclusivo da ação:** pode ser declarado inline no Logic
- **Schema compartilhado entre create/update:** extrair para `src/resources/{module}/schemas/{resource}.ts`

```ts
// schemas/discipline.ts
import * as yup from 'yup';

export const disciplineSchema = yup.object({
  name: yup.string().default('').required().max(80),
  description: yup.string().default('').optional(),
  workload_hours: yup.number().default(null).nullable().optional(),
  position: yup.number().default(null).nullable().optional(),
});
```

---

## Regras gerais

- Um arquivo por ação — nunca agrupar múltiplas ações num mesmo arquivo.
- Props do componente sempre via `ReturnType<typeof use{ActionName}LogicData>` — nunca retipar manualmente.
- O hook não conhece o componente; o componente não tem lógica de mutação própria.
- `onSuccess` e `onError` do `useMutation` são sempre definidos no hook, nunca no componente.
- Mensagens de sucesso: sempre usar `res.message` do retorno do serviço.
- `onError` sempre com `err?.message` como `message`; adicionar `?? 'Não foi possível...'` como fallback quando fizer sentido.
- O `isPending` vem desestruturado com prefixo para evitar colisão quando o pai instancia múltiplos Logics.
