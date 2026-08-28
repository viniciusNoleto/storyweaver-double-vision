# Organização de arquivos

## Resources — nomenclatura de módulos

O nome do módulo é sempre **singular**. As subpastas de características são sempre **plural**.

```
src/resources/
├── course/           ← singular
│   ├── enums/        ← plural
│   ├── fragments/    ← plural
│   ├── logics/       ← plural
│   ├── mocks/        ← plural
│   ├── models/       ← plural
│   ├── schemas/      ← plural
│   └── services/     ← plural
├── discipline/       ← singular
├── student/          ← singular
└── source-activity/  ← singular (kebab-case para nomes compostos)
```

Subpastas permitidas dentro de um módulo:

| Pasta | Conteúdo |
|---|---|
| `enums/` | String enums de slugs da API |
| `fragments/` | Seções/abas de páginas relacionadas ao recurso |
| `logics/` | Hooks + componentes de UI de ações (create, update, disable…) |
| `mocks/` | Handlers MSW para o recurso |
| `models/` | Interface `I{Resource}` e classe opcional `{Resource}` |
| `schemas/` | Schemas Yup compartilhados entre logics |
| `services/` | Funções de chamada HTTP, uma por endpoint |

---

## Fragments — seções de página dentro de resources

Quando uma página de detalhe possui seções/abas que envolvem um recurso específico, esses fragmentos ficam em `src/resources/{module}/fragments/{PageName}/`.

O nome da pasta do fragmento corresponde ao nome da variável lazy da página (ex: `CoursesCourseId`).

```
src/resources/course/fragments/
└── CoursesCourseId/
    ├── classes.tsx       ← aba de turmas na página /courses/:course_id
    └── disciplines.tsx   ← aba de disciplinas na página /courses/:course_id
```

Um fragmento é um componente React normal — exportado como default ou named — que recebe os dados necessários via props.
