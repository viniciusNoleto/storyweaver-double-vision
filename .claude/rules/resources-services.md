# Resources — Services

## Estrutura de pastas

Cada recurso da API fica em `src/resources/{recurso}/`:

```
src/resources/course/
├── models/
│   └── Course.ts          # interface TypeScript do recurso
└── services/
    ├── getCourses.ts       # GET /courses (lista paginada)
    ├── getCourse.ts        # GET /courses/:id
    ├── createCourse.ts     # POST /courses
    ├── updateCourse.ts     # PUT /courses/:id
    ├── activateCourse.ts   # PATCH /courses/:id/activate
    └── disableCourse.ts    # PATCH /courses/:id/disable
```

Um arquivo por endpoint. Nome do arquivo = verbo + recurso em camelCase.

---

## Tipos de suporte (já existem em `src/shared/types/`)

```ts
// api.ts
PayloadBody<T>       // { body: T } — para POST, PUT, PATCH com corpo
PayloadQuery<T>      // { query?: T } — para GET com query params
PaginatedResponse<T> // { items: T[]; meta: { page, per_page, total, last_page } }

// tanstack.ts
QueryFnCtx           // contexto do queryFn do TanStack Query (contém signal, queryKey, etc.)
```

---

## Padrões por método HTTP

### GET — lista paginada

- Tipo de retorno: `PaginatedResponse<T>`
- Exporta a query key como constante array: `GET_{RESOURCE}S_KEY`
- Query params opcionais via `PayloadQuery<T>` — serialize com `URLSearchParams`

```ts
import { cursusClient } from '@/src/utils/client';
import { ICourse } from '../models/Course';
import { PaginatedResponse, PayloadQuery } from '@/src/shared/types/api';
import { QueryFnCtx } from '@/src/shared/types/tanstack';

export type GetCoursesServiceQuery = {
  search?: string;
  include_disabled?: boolean;
  order_by?: 'name' | 'created_at';
  page?: number;
  per_page?: number;
};

export const GET_COURSES_KEY = ['get-courses'];

export function getCoursesService({ signal, query }: QueryFnCtx & PayloadQuery<GetCoursesServiceQuery>) {
  const params = new URLSearchParams();

  if (query?.search) params.set('search', query.search);
  if (query?.include_disabled) params.set('include_disabled', String(query.include_disabled));
  if (query?.order_by) params.set('order_by', query.order_by);
  if (query?.page) params.set('page', String(query.page));
  if (query?.per_page) params.set('per_page', String(query.per_page));

  const qs = params.toString();

  return cursusClient.get<PaginatedResponse<ICourse>>(`/api/courses${qs ? `?${qs}` : ''}`, { signal });
}
```

### GET — item único

- Tipo de retorno: `T`
- Query key como função que recebe o id: `GET_{RESOURCE}_KEY = (id) => [...]`

```ts
import { cursusClient } from '@/src/utils/client';
import { ICourse } from '../models/Course';
import { QueryFnCtx } from '@/src/shared/types/tanstack';

export const GET_COURSE_KEY = (courseId: string) => ['get-course', courseId];

export function getCourseService({ signal, courseId }: QueryFnCtx & { courseId: string }) {
  return cursusClient.get<ICourse>(`/api/courses/${courseId}`, { signal });
}
```

### POST — criação

- Exporta o tipo do payload com sufixo `Payload`
- Não usa `QueryFnCtx` nem query key — é mutação

```ts
import { cursusClient } from '@/src/utils/client';
import { ICourse } from '../models/Course';
import { PayloadBody } from '@/src/shared/types/api';

export type CreateCourseServicePayload = {
  name: string;
  description?: string;
  workload_hours?: number;
};

export function createCourseService({ body }: PayloadBody<CreateCourseServicePayload>) {
  return cursusClient.post<ICourse>('/api/courses', { body });
}
```

### PUT — atualização completa

- Mesmo padrão do POST, com `courseId` no parâmetro e na URL
- Campos do payload são opcionais (`?`)

```ts
import { cursusClient } from '@/src/utils/client';
import { ICourse } from '../models/Course';
import { PayloadBody } from '@/src/shared/types/api';

export type UpdateCourseServicePayload = {
  name?: string;
  description?: string;
  workload_hours?: number;
};

export function updateCourseService({ courseId, body }: PayloadBody<UpdateCourseServicePayload> & { courseId: string }) {
  return cursusClient.put<ICourse>(`/api/courses/${courseId}`, { body });
}
```

### PATCH — ação de estado (sem campos no corpo)

- Sem tipo de payload exportado
- Passa `body: {}` obrigatório (o `cursusClient.patch` exige `PayloadBody`)

```ts
import { cursusClient } from '@/src/utils/client';
import { ICourse } from '../models/Course';

export function activateCourseService({ courseId }: { courseId: string }) {
  return cursusClient.patch<ICourse>(`/api/courses/${courseId}/activate`, { body: {} });
}
```

### DELETE

```ts
import { cursusClient } from '@/src/utils/client';

export function deleteCourseService({ courseId }: { courseId: string }) {
  return cursusClient.delete<null>(`/api/courses/${courseId}`, { body: {} });
}
```

---

## Regras

- Um arquivo por endpoint.
- **Toda função exportada deve terminar com o sufixo `Service`** — ex: `getCourseService`, `createCourseService`, `activateCourseService`. Nunca `getCourse` ou `createCourse`.
- Sem lógica de negócio nos serviços — apenas a chamada HTTP.
- O tipo de retorno genérico do `cursusClient` é sempre a interface do recurso (`ICourse`, `ISubject`, etc.), nunca `any`.
- Serviços GET exportam query key; serviços de mutação não.
- `signal` só aparece em serviços GET (passado pelo TanStack Query para cancelamento).

### Nomenclatura completa de um módulo

| Elemento | Padrão | Exemplo |
|---|---|---|
| Função | `{verbo}{Recurso}Service` | `getCoursesService`, `createCourseService` |
| Tipo de query | `Get{Recurso}ServiceQuery` | `GetCoursesServiceQuery` |
| Tipo de payload | `{Verbo}{Recurso}ServicePayload` | `CreateCourseServicePayload` |
| Query key (lista) | `GET_{RECURSO}S_KEY` | `GET_COURSES_KEY` |
| Query key (item) | `GET_{RECURSO}_KEY` | `GET_COURSE_KEY` |
