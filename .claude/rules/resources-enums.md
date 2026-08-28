# Resources — Enums

Ficam em `src/resources/{recurso}/enums/{Recurso}.ts`.

## Enums de resource

Todo `type` que representa um slug da API deve ser declarado como um **string enum TypeScript** em arquivo próprio dentro do módulo de resource.

**Regra de nomenclatura:** `E` + nome do tipo original. Exemplo: `ProcessStatus` → `EProcessStatus`.

**Quando criar um Enum:**
- O type é uma union de string literals que representa valores fixos vindos/enviados para a API (`status`, `kind`, `type`, `method`, `source`, `slug`, etc.)
- Os valores são usados em comparações, switches, ou exibidos na UI

**Quando NÃO criar um Enum:**
- Unions de tipos complexos (objetos, arrays)
- Unions que misturam strings com outros primitivos (`string | null`, `string | number`)
- Tipos inline em interfaces que não têm nome próprio

**Estrutura do arquivo:**

```ts
// src/resources/{modulo}/enums/E{Nome}.ts
export enum EProcessStatus {
  ABERTO = 'aberto',
  EMANALISE = 'em_analise',
  RETORNADO = 'retornado',
  ENCERRADO = 'encerrado',
}
```

Sempre use **string enums** (valor = slug da API) para garantir compatibilidade com comparações e serialização. O nome da chave é UpperSnakeCase, o valor é o slug exato da API.

---

## Regras

- Um arquivo por enum.
- Todo slug de API deve se tornar um enum.
