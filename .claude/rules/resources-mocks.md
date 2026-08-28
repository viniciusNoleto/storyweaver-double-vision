# Resources — Mocks MSW

Mocks ficam em `src/resources/{recurso}/mocks/`. Um arquivo por endpoint, espelhando os serviços.

```
src/resources/course/mocks/
├── _data.ts           # dados mock em memória (array mutável)
├── getCourses.ts
├── getCourse.ts
├── createCourse.ts
├── updateCourse.ts
├── activateCourse.ts
├── disableCourse.ts
└── index.ts           # exporta array com todos os handlers
```

---

## `_data.ts` — dados em memória

Array mutável tipado com a interface do recurso. Mutations (POST, PUT, PATCH) alteram o array diretamente, simulando persistência na sessão de dev.

```ts
import { ICourse } from '../models/Course';

export const mockCourses: ICourse[] = [
  {
    id: 'uuid-1',
    name: 'Técnico em Enfermagem',
    description: 'Curso técnico.',
    workload_hours: 1200,
    activated_at: '2026-04-23T00:00:00.000Z',
    disabled_at: null,
    created_at: '2026-04-22T20:53:35.482Z',
    updated_at: '2026-04-23T00:00:00.000Z',
  },
];
```

---

## GET — lista paginada

```ts
import { http, HttpResponse } from 'msw';
import { mockCourses } from './_data';

export const getCoursesMock = http.get('/api/courses', ({ request }) => {
  const url = new URL(request.url);
  const search = url.searchParams.get('search')?.toLowerCase();
  const page = Number(url.searchParams.get('page') ?? 1);
  const perPage = Number(url.searchParams.get('per_page') ?? 15);

  let items = [...mockCourses];

  if (search) items = items.filter(c => c.name.toLowerCase().includes(search));

  const total = items.length;
  const paged = items.slice((page - 1) * perPage, page * perPage);

  return HttpResponse.json({
    success: true,
    message: 'Operação realizada com sucesso.',
    data: {
      items: paged,
      meta: { page, per_page: perPage, total, last_page: Math.max(1, Math.ceil(total / perPage)) },
    },
  });
});
```

---

## GET — item único

```ts
import { http, HttpResponse } from 'msw';
import { mockCourses } from './_data';

export const getCourseMock = http.get('/api/courses/:course_id', ({ params }) => {
  const course = mockCourses.find(c => c.id === params.course_id);

  if (!course) {
    return HttpResponse.json(
      { success: false, message: 'Curso não encontrado.', data: null },
      { status: 404 },
    );
  }

  return HttpResponse.json({
    success: true,
    message: 'Operação realizada com sucesso.',
    data: course,
  });
});
```

---

## POST — criação

```ts
import { http, HttpResponse } from 'msw';
import { mockCourses } from './_data';
import { ICourse } from '../models/Course';

export const createCourseMock = http.post('/api/courses', async ({ request }) => {
  const body = await request.json() as Partial<ICourse>;
  const now = new Date().toISOString();

  const course: ICourse = {
    id: crypto.randomUUID(),
    name: body.name ?? '',
    description: body.description ?? null,
    workload_hours: body.workload_hours ?? null,
    activated_at: null,
    disabled_at: null,
    created_at: now,
    updated_at: now,
  };

  mockCourses.push(course);

  return HttpResponse.json(
    { success: true, message: 'Curso cadastrado com sucesso.', data: course },
    { status: 201 },
  );
});
```

---

## PUT — atualização

```ts
import { http, HttpResponse } from 'msw';
import { mockCourses } from './_data';
import { ICourse } from '../models/Course';

export const updateCourseMock = http.put('/api/courses/:course_id', async ({ params, request }) => {
  const index = mockCourses.findIndex(c => c.id === params.course_id);

  if (index === -1) {
    return HttpResponse.json(
      { success: false, message: 'Curso não encontrado.', data: null },
      { status: 404 },
    );
  }

  const body = await request.json() as Partial<ICourse>;
  const updated = { ...mockCourses[index], ...body, updated_at: new Date().toISOString() };

  mockCourses[index] = updated;

  return HttpResponse.json({ success: true, message: 'Curso atualizado com sucesso.', data: updated });
});
```

---

## PATCH — ação de estado

```ts
import { http, HttpResponse } from 'msw';
import { mockCourses } from './_data';

export const activateCourseMock = http.patch('/api/courses/:course_id/activate', ({ params }) => {
  const index = mockCourses.findIndex(c => c.id === params.course_id);

  if (index === -1) {
    return HttpResponse.json(
      { success: false, message: 'Curso não encontrado.', data: null },
      { status: 404 },
    );
  }

  if (mockCourses[index].activated_at !== null) {
    return HttpResponse.json(
      { success: false, message: 'Curso já está ativado.', data: null },
      { status: 409 },
    );
  }

  const updated = {
    ...mockCourses[index],
    activated_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  mockCourses[index] = updated;

  return HttpResponse.json({ success: true, message: 'Curso ativado com sucesso.', data: updated });
});
```

---

## `index.ts` — registro dos handlers

```ts
import { getCoursesMock } from './getCourses';
import { getCourseMock } from './getCourse';
import { createCourseMock } from './createCourse';
import { updateCourseMock } from './updateCourse';
import { activateCourseMock } from './activateCourse';
import { disableCourseMock } from './disableCourse';

export const courseMock = [
  getCoursesMock,
  getCourseMock,
  createCourseMock,
  updateCourseMock,
  activateCourseMock,
  disableCourseMock,
];
```

O array exportado já está registrado em `src/mocks/browser.ts` via spread. Ao criar um novo módulo, adicionar o import e o spread lá.

---

## Regras

- Nomes dos handlers: nome do arquivo + sufixo `Mock` (ex: `getCoursesMock`).
- Sempre tipar o body do `request.json()` com a interface do recurso.
- Responses seguem o envelope `{ success, message, data }` da API.
- Status 201 para criação, 200 para demais, 404/409 para erros específicos da spec.
- Não simular delays — o MSW é síncrono em dev.
