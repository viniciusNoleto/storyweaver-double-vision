# Resources — Models

Ficam em `src/resources/{recurso}/models/{Recurso}.ts`.

---

## Interface — sempre necessária

A interface espelha exatamente o schema da API. Nome com prefixo `I`.
Use-a para tipar parâmetros, retornos de serviços e estado de componentes.

```ts
// src/resources/course/models/Course.ts
export interface ICourse {
  id: string;
  name: string;
  description: string | null;
  workload_hours: number | null;
  activated_at: string | null;
  disabled_at: string | null;
  created_at: string;
  updated_at: string;
}
```

**Regra:** na maioria dos casos, a interface é suficiente. Não crie a classe por padrão.

---

## Classe model — apenas quando necessário

Crie a classe `{Name}` (sem `I`) quando precisar **trabalhar os dados** após recebê-los da API.

O caso mais comum: o recurso possui campos que deveriam ser arrays mas podem vir `null` ou ausentes da API. A classe garante que esses campos sejam sempre arrays.

**O parâmetro do construtor é sempre a interface.**

```ts
// src/resources/course/models/Course.ts
export interface ICourse {
  id: string;
  name: string;
  subjects?: ISubject[]; // pode vir null da API
}

export class Course {
  id: string;
  name: string;
  subjects: ISubject[]; // sempre array

  constructor(data: ICourse) {
    this.id = data.id;
    this.name = data.name;
    this.subjects = data.subjects || [];
  }
}
```

---

## Quando criar a classe

| Situação | Interface | Classe |
|---|---|---|
| Exibir dados sem transformação | ✅ | ❌ |
| Campo array que pode vir `null` da API | ✅ | ✅ |
| Calcular propriedades derivadas dos dados | ✅ | ✅ |
| Normalizar formatos (ex: data, moeda) | ✅ | ✅ |

---

## Usando a classe com `chain` e `mapper`

`chain` e `mapper` ficam em `src/utils/chain.ts`.

- `chain(promise, fn1, fn2, ...)` — encadeia transformações sobre uma Promise
- `mapper(fn)` — adapta `ApiReponse<T>` → `ApiReponse<U>` para uso no `chain`

```ts
import { chain, mapper } from '@/src/utils/chain';
import { getCourses } from '../services/getCourses';
import { Course } from '../models/Course';

// Instancia cada item retornado como Course, garantindo arrays
const result = await chain(
  getCourses({ signal }),
  mapper(res => res.data.items.map(item => new Course(item)))
);
// result.data agora é Course[]
```

Para item único:

```ts
const result = await chain(
  getCourse({ signal, courseId }),
  mapper(res => new Course(res.data))
);
// result.data agora é Course
```

---

## Resumo

```
ICourse   → sempre presente, espelha a API
Course    → criado só quando precisa garantir arrays ou transformar dados
```

---

## Proibido: reexportar enums nos models

Não crie `export type X = EEnum` nem `export type XSlug = \`${EEnum}\`` dentro de arquivos de model.

Se precisar do tipo do enum, importe-o diretamente do arquivo de enum correspondente:

```ts
// ❌ Errado — reexportar o enum como alias no model
export type ProcessStatus = `${EProcessStatus}`;

// ✅ Correto — importar o enum diretamente onde for necessário
import type { EProcessStatus } from '../enums/ProcessStatus';
```

Interfaces dentro do model devem usar o enum ou o template literal inline:

```ts
// ✅ Correto — tipo inline na interface
export interface IProcessStatusLookup {
  id: string;
  slug: `${EProcessStatus}`;
  name: string;
}

// ✅ Correto — enum diretamente (quando o campo aceita comparação)
export interface IProcess {
  status: EProcessStatus;
}
```
