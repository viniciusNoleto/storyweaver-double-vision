<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Regras do projeto (`.claude/rules/`)

Cada arquivo em `.claude/rules/` documenta a interface exata, o comportamento interno e os padrões corretos de um componente ou convenção do projeto. **Não infira a API pelo nome do componente** — os wrappers divergem do Mantine/React puro (ex: `onChange` recebe o valor já extraído, não o evento). Consulte a regra correspondente antes de escrever ou revisar código que toque nesses pontos.

## Conceito da Mesa

Qualquer tarefa relacionada à lógica da Mesa (criação de mesa, personagens, fichas, vida/HP, atributos, condições, tempo real, tela do Mestre, tela de Exibição, tabuleiro) **deve** começar pela leitura de `table-concept.md` — ele define o vocabulário oficial (conceitos em português, mapeados para nomes em inglês no código), as regras de produto, a fórmula da cor do anel de vida, e as decisões de arquitetura (modelo de dados, autenticação do Mestre via cookie, tempo real via SSE, redação de privacidade da Exibição).

## Formatação JSX/TSX

- Qualquer arquivo `.tsx` → `tsx-patterns.md` (atributos em linha própria, texto em linha própria, linha em branco entre elementos irmãos).
- Qualquer estilização (`style={{...}}`, cor/tamanho/posição em JSX) → `styling-tailwind.md` — usar classe Tailwind sempre que possível; `style` só é aceitável para valores genuinamente dinâmicos por frame/render.

## Componentes de formulário

| Ao usar... | Leia |
|---|---|
| `<form>` / submit | `components-form.md` |
| `FormTextInput`, `FormPassword`, `FormTextarea`, `FormNumberInput` | `components-form-inputs.md` |
| `FormSelect` | `components-form-select.md` |
| `FormSwitch` (campo booleano) | `components-form-switch.md` |
| `FormDatePicker` (single / multiple / range) | `components-form-date.md` |
| `FormButton` (com tooltip/ícone) | `components-form-button.md` |
| `FormAutocomplete` (busca remota com debounce) | `components-form-autocomplete.md` |
| Qualquer formulário com validação Yup + `useMutation` | `validated-form.md` |

## Componentes utilitários

| Ao usar... | Leia |
|---|---|
| Renderização condicional (substitui `&&` / ternário) | `components-utils-if.md` |
| Iteração de array em JSX (substitui `.map()`) | `components-utils-for.md` |
| Painel branco com borda/sombra | `components-utils-card.md` |
| Aba/seção que deve ser montada uma única vez | `components-utils-loader.md` |
| Tabela de dados (com ou sem paginação) | `components-utils-table.md` |

## Páginas e listas

- Lista paginada com filtros e refetch manual → `paginated-list.md`.

## Resources (módulos de API em `resources/{recurso}/`)

| Ao criar/editar... | Leia |
|---|---|
| Estrutura de pastas de um módulo novo ou existente | `file-organization.md` |
| `models/{Recurso}.ts` (interface `I{Recurso}` / classe opcional) | `resources-models.md` |
| `enums/{Recurso}.ts` (slugs vindos/enviados para a API) | `resources-enums.md` |
| `services/{verbo}{Recurso}.ts` (chamada HTTP) | `resources-services.md` |
| `logics/{Acao}.tsx` (hook + UI de create/update/disable/etc.) | `resources-logic.md` |
| `mocks/` (handlers MSW) | `resources-mocks.md` |

## API (Route Handlers e models)

| Ao criar/editar... | Leia |
|---|---|
| Route Handlers (`app/api/**`) ou schemas Drizzle (`db/schema/`) | `api-response-format.md` |
| Interfaces de model (`resources/*/models/*.ts`) | `api-response-format.md` |

## Regra geral

Se a tarefa envolve qualquer componente ou padrão listado acima, leia a regra **antes** de escrever código — ela define nomes de função obrigatórios, convenções de nomenclatura e erros comuns que não são óbvios a partir do código já existente.
