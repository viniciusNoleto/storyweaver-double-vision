# Formato das respostas da API

## Regra: todas as chaves JSON em snake_case

Toda resposta da API (Next.js Route Handlers) deve usar **snake_case** para os nomes das chaves — sem exceção.

Isso inclui:
- Campos retornados diretamente do banco de dados
- Campos montados manualmente em objetos de resposta
- Campos de objetos aninhados (ex: `unit`, `categories`, `components` dentro de um inventory item)

## Drizzle ORM — como evitar camelCase acidental

O Drizzle ORM usa o nome da **propriedade JavaScript** (não o nome da coluna no banco) ao serializar registros. Se o schema definir `colorHex`, o JSON retornará `colorHex` — não `color_hex`.

**Regra:** os nomes das propriedades JS no schema Drizzle devem ser idênticos aos nomes das colunas no banco de dados (ambos snake_case).

```ts
// ✅ Correto — propriedade JS = coluna do banco
export const itemCategories = pgTable('item_categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  color_hex: varchar('color_hex', { length: 7 }).notNull(),
  created_at: timestamp('created_at'),
  updated_at: timestamp('updated_at'),
});

// ❌ Errado — propriedade JS em camelCase, coluna em snake_case
export const itemCategories = pgTable('item_categories', {
  colorHex: varchar('color_hex', { length: 7 }).notNull(),  // retorna colorHex no JSON
  createdAt: timestamp('created_at'),                        // retorna createdAt no JSON
});
```

## Interfaces de model (`I{Recurso}`)

As interfaces TypeScript em `resources/{recurso}/models/{Recurso}.ts` devem espelhar exatamente as chaves que a API retorna — ou seja, todas em snake_case.

```ts
// ✅ Correto
export interface IItemCategory {
  id: string;
  name: string;
  color_hex: string;
  created_at: string | null;
  updated_at: string | null;
}

// ❌ Errado
export interface IItemCategory {
  colorHex: string;    // não bate com o JSON real
  createdAt: string;
}
```

## Resposta envelope

Toda resposta segue o envelope:

```json
{
  "success": true,
  "message": { "pt-br": "...", "es-mx": "...", "en-us": "..." },
  "data": { ... }
}
```

O campo `message` é sempre um objeto i18n com as três localidades — nunca uma string simples.
