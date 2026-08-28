# Wizard de Criação de Personagem Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o formulário simples de criação de "Personagem" (não NPC) na Tela do Mestre por um wizard multi-etapa, dirigido por dados do banco (Classes/Espécies/Origens), que calcula automaticamente atributos/vida/mana a partir das regras de *Contos e Cantos de Vilgard*.

**Architecture:** Três tabelas novas de "conteúdo de regras" (`classes`, `species`, `origins`) guardam cada Classe/Espécie/Origem como uma "ficha" com campos fixos (nome, vida base, evasão) + campos `jsonb` genéricos para as partes que variam de classe pra classe (bônus de atributo, escolhas de perícia, escolhas de equipamento). Um wizard genérico lê essas fichas e monta as perguntas dinamicamente — nenhum código sabe o nome de nenhuma classe específica. `characters` ganha colunas novas (nullable) para guardar o resultado: `class_id`/`species_id`/`origin_id`/`level`/`attributes`.

**Tech Stack:** Next.js 16 Route Handlers, Drizzle ORM + Postgres, React 19 + Mantine 9, TanStack Query.

**Spec:** `docs/superpowers/specs/2026-08-28-character-creation-wizard-design.md`

## Global Constraints

- Chaves de API sempre em `snake_case` (ver `.claude/rules/api-response-format.md`); envelope `{ success, message: {pt-br,es-mx,en-us}, data }` em toda resposta.
- Todo `.tsx` segue `.claude/rules/tsx-patterns.md` (atributo por linha, texto em linha própria, linha em branco entre irmãos).
- Nenhum destes dados novos (classe/espécie/origem/atributos) pode aparecer no payload da Tela de Exibição — são Mestre-only, mesma regra de `hp_current`/`hp_max` (ver `.claude/rules/table-concept.md` seção 2).
- `image_url`/upload já existe (`ImageUploadInput.tsx`) — reusar, não recriar.
- **Este projeto não tem framework de testes configurado** (sem jest/vitest). Verificação é feita via `npx tsc --noEmit`, `npm run lint`, e checagem manual via `curl`/scripts `tsx` descartáveis — mesmo padrão usado em toda a história deste projeto (ver `.claude/rules/table-concept.md`). Onde este plano diz "escreva o teste", leia "escreva o script de verificação manual".
- Migrations neste projeto às vezes não aplicam via `npm run db:migrate` (bug documentado em `.claude/rules/table-concept.md` — `drizzle-kit migrate` decide o que é novo comparando com o `MAX(created_at)` já registrado; se algo ficar fora de ordem, ele pula silenciosamente). Sempre **verifique via `psql \d <tabela>`** depois de rodar a migration — se a tabela não existir, aplique o SQL manualmente via `docker exec storyweaver-postgres psql ...` e registre o hash em `drizzle.__drizzle_migrations` (o Task 1 abaixo mostra o procedimento exato).
- Container Postgres local: `storyweaver-postgres` (via `docker-compose.local.yml`, já deve estar rodando). `next dev` roda no host (não em Docker — bug de Turbopack + bind mount do Windows já documentado), porta 3002.

---

## Task 1: Schema — tabelas de regras + extensão de `characters`

**Files:**
- Create: `db/schema/classes.ts`
- Create: `db/schema/species.ts`
- Create: `db/schema/origins.ts`
- Modify: `db/schema/characters.ts`
- Modify: `db/schema/index.ts`

**Interfaces:**
- Produces: tabelas Postgres `classes`, `species`, `origins`; colunas novas em `characters` (`class_id`, `species_id`, `origin_id`, `level`, `attributes`).

- [ ] **Step 1: Criar `db/schema/classes.ts`**

```ts
import { integer, jsonb, pgTable, serial, text, varchar } from 'drizzle-orm/pg-core';

// Uma "ficha de classe" por linha (Bárbaro, Caçador, etc. — ver seed em
// db/seed/seedRules.ts). O wizard (resources/character/components/CharacterWizard.tsx)
// lê essas colunas genericamente — nenhuma lógica específica de classe no
// código, só nos dados desta tabela. Ver spec:
// docs/superpowers/specs/2026-08-28-character-creation-wizard-design.md
export const classes = pgTable('classes', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description').notNull(),
  // string[] — 1 ou 2 atributos primários (ex: Caçador tem 2: mágico e físico)
  primary_attributes: jsonb('primary_attributes').notNull(),
  // { attribute: string, amount: number }[]
  attribute_bonuses: jsonb('attribute_bonuses').notNull(),
  // { count: number, options: string[], fixed?: string[] } | null
  skill_proficiency_choice: jsonb('skill_proficiency_choice'),
  knowledge_proficiency_choice: jsonb('knowledge_proficiency_choice'),
  // { options: { label: string, description: string }[] } | null
  equipment_choice: jsonb('equipment_choice'),
  // string[] | null — itens que a classe sempre concede, sem escolha
  fixed_equipment: jsonb('fixed_equipment'),
  hp_base: integer('hp_base').notNull(),
  mana_base: integer('mana_base').notNull().default(0),
  evasion: integer('evasion').notNull(),
  // { label: string, value: string }[] — só referência, nunca rastreado
  extra_resources: jsonb('extra_resources').notNull().default([]),
});
```

- [ ] **Step 2: Criar `db/schema/species.ts`**

```ts
import { jsonb, pgTable, serial, text, varchar } from 'drizzle-orm/pg-core';

export const species = pgTable('species', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description').notNull(),
  // { attribute: string, amount: number }[] — vazio ([]) para todas as 8
  // espécies do manual atual (nenhuma delas concede bônus numérico de
  // atributo, só habilidades textuais) — campo existe para espécies futuras.
  attribute_bonuses: jsonb('attribute_bonuses').notNull().default([]),
  // { name: string, description: string }[] — só referência
  racial_abilities: jsonb('racial_abilities').notNull().default([]),
});
```

- [ ] **Step 3: Criar `db/schema/origins.ts`**

```ts
import { boolean, jsonb, pgTable, serial, text, varchar } from 'drizzle-orm/pg-core';

export const origins = pgTable('origins', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description').notNull(),
  // { attribute: string, amount: number }[][] — lista de alternativas; o
  // jogador escolhe UMA linha inteira (ex: [[{Destreza,2}], [{Destreza,1},{Inteligência,1}]])
  attribute_bonus_options: jsonb('attribute_bonus_options').notNull(),
  // Perícia fixa concedida (sem escolha), ex: "Conhecimento religioso" — null
  // se a origem usa proficiency_choice no lugar.
  granted_proficiency: varchar('granted_proficiency', { length: 200 }),
  // { options: string[] } | null — perícia com escolha (ex: blefe ou furtividade)
  proficiency_choice: jsonb('proficiency_choice'),
  starting_items: text('starting_items').notNull(),
  starting_money: varchar('starting_money', { length: 50 }).notNull(),
  // Reservado para quando a criação de Origem customizada pela interface
  // existir (fora de escopo deste plano) — evita uma migration futura.
  is_custom: boolean('is_custom').notNull().default(false),
});
```

- [ ] **Step 4: Estender `db/schema/characters.ts`**

O arquivo atual tem, nesta ordem: `...has_mana, mana_current, mana_max, created_at, updated_at`. Insira as colunas novas **entre `mana_max` e `created_at`**:

```ts
  // Resultado do Wizard de criação (ver
  // docs/superpowers/specs/2026-08-28-character-creation-wizard-design.md) —
  // todos nullable: personagens antigos, criados pelo formulário simples, e
  // NPCs continuam sem esses campos preenchidos.
  class_id: integer('class_id'),
  species_id: integer('species_id'),
  origin_id: integer('origin_id'),
  level: integer('level').notNull().default(1),
  // Record<EAttribute, number> | null — ver resources/character/enums/Attribute.ts
  attributes: jsonb('attributes'),
```

Não adicione `.references()` nessas FKs — as tabelas `classes`/`species`/`origins` não têm `ON DELETE` definido e este projeto já lida com integridade referencial manualmente nas rotas (ver `table_zones`/`characters` como precedente), não via constraint do Postgres.

- [ ] **Step 5: Atualizar `db/schema/index.ts`**

```ts
export * from './tables';
export * from './table_zones';
export * from './characters';
export * from './character_templates';
export * from './classes';
export * from './species';
export * from './origins';
```

- [ ] **Step 6: Gerar e aplicar a migration**

```bash
npx drizzle-kit generate
npm run db:migrate
```

- [ ] **Step 7: Verificar se aplicou de verdade**

```bash
docker exec storyweaver-postgres psql -U postgres -d storyweaver -c "\d classes"
docker exec storyweaver-postgres psql -U postgres -d storyweaver -c "\d species"
docker exec storyweaver-postgres psql -U postgres -d storyweaver -c "\d origins"
docker exec storyweaver-postgres psql -U postgres -d storyweaver -c "\d characters" | grep -E "class_id|species_id|origin_id|level|attributes"
```

Expected: as 3 tabelas existem com as colunas do Step 1-3; `characters` mostra as 5 colunas novas.

**Se as tabelas NÃO existirem** (sintoma do bug documentado nas Global Constraints): aplique manualmente.

```bash
# 1. Pegue o SQL gerado (arquivo db/migrations/000X_<nome>.sql criado no Step 6) e rode-o direto:
docker exec -i storyweaver-postgres psql -U postgres -d storyweaver < db/migrations/000X_<nome>.sql

# 2. Calcule o hash do arquivo de migration e registre como aplicado:
node -e "
const fs = require('fs');
const crypto = require('crypto');
const content = fs.readFileSync('db/migrations/000X_<nome>.sql', 'utf8');
console.log(crypto.createHash('sha256').update(content).digest('hex'));
"
# 3. Pegue o "when" do novo entry em db/migrations/meta/_journal.json e insira:
docker exec storyweaver-postgres psql -U postgres -d storyweaver -c "INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ('<hash do passo 2>', <when do journal>);"

# 4. Repita a verificação do Step 7.
```

- [ ] **Step 8: Commit**

```bash
git add db/schema/classes.ts db/schema/species.ts db/schema/origins.ts db/schema/characters.ts db/schema/index.ts db/migrations/
git commit -m "feat: schema de Classes/Espécies/Origens + extensão de characters"
```

---

## Task 2: Modelos TypeScript e enum de atributos

**Files:**
- Create: `resources/character/enums/Attribute.ts`
- Create: `resources/character/models/RulesContent.ts`
- Modify: `resources/character/models/Character.ts`

**Interfaces:**
- Consumes: nada (só tipos)
- Produces: `EAttribute`, `IAttributeBonus`, `IProficiencyChoice`, `IEquipmentChoice`, `IExtraResource`, `IClass`, `ISpecies`, `IOrigin`, `ICharacterAttributes` — usados por todas as tasks seguintes.

- [ ] **Step 1: Criar `resources/character/enums/Attribute.ts`**

```ts
// Os 7 atributos do sistema (ver .claude/rules/table-concept.md /
// docs/superpowers/specs/2026-08-28-character-creation-wizard-design.md).
export enum EAttribute {
  FORCA = 'forca',
  DESTREZA = 'destreza',
  CONSTITUICAO = 'constituicao',
  CARISMA = 'carisma',
  INTELIGENCIA = 'inteligencia',
  SABEDORIA = 'sabedoria',
  SORTE = 'sorte',
}

// Ordem de exibição fixa, usada por todo componente que lista os 7 atributos.
export const ATTRIBUTE_ORDER: EAttribute[] = [
  EAttribute.FORCA,
  EAttribute.DESTREZA,
  EAttribute.CONSTITUICAO,
  EAttribute.CARISMA,
  EAttribute.INTELIGENCIA,
  EAttribute.SABEDORIA,
  EAttribute.SORTE,
];

export const ATTRIBUTE_LABEL: Record<EAttribute, string> = {
  [EAttribute.FORCA]: 'Força',
  [EAttribute.DESTREZA]: 'Destreza',
  [EAttribute.CONSTITUICAO]: 'Constituição',
  [EAttribute.CARISMA]: 'Carisma',
  [EAttribute.INTELIGENCIA]: 'Inteligência',
  [EAttribute.SABEDORIA]: 'Sabedoria',
  [EAttribute.SORTE]: 'Sorte',
};
```

- [ ] **Step 2: Criar `resources/character/models/RulesContent.ts`**

```ts
import type { EAttribute } from '../enums/Attribute';

export interface IAttributeBonus {
  attribute: `${EAttribute}`;
  amount: number;
}

export interface IProficiencyChoice {
  count: number;
  options: string[];
  fixed?: string[];
}

export interface IEquipmentChoiceOption {
  label: string;
  description: string;
}

export interface IEquipmentChoice {
  options: IEquipmentChoiceOption[];
}

export interface IExtraResource {
  label: string;
  value: string;
}

export interface IRacialAbility {
  name: string;
  description: string;
}

// Espelha db/schema/classes.ts.
export interface IClass {
  id: number;
  name: string;
  description: string;
  primary_attributes: string[];
  attribute_bonuses: IAttributeBonus[];
  skill_proficiency_choice: IProficiencyChoice | null;
  knowledge_proficiency_choice: IProficiencyChoice | null;
  equipment_choice: IEquipmentChoice | null;
  fixed_equipment: string[] | null;
  hp_base: number;
  mana_base: number;
  evasion: number;
  extra_resources: IExtraResource[];
}

// Espelha db/schema/species.ts.
export interface ISpecies {
  id: number;
  name: string;
  description: string;
  attribute_bonuses: IAttributeBonus[];
  racial_abilities: IRacialAbility[];
}

// Espelha db/schema/origins.ts.
export interface IOrigin {
  id: number;
  name: string;
  description: string;
  attribute_bonus_options: IAttributeBonus[][];
  granted_proficiency: string | null;
  proficiency_choice: { options: string[] } | null;
  starting_items: string;
  starting_money: string;
  is_custom: boolean;
}

// Record<EAttribute, number> — resultado final salvo no personagem.
export type ICharacterAttributes = Record<`${EAttribute}`, number>;
```

- [ ] **Step 3: Estender `resources/character/models/Character.ts`**

Leia o arquivo primeiro para ver o formato exato de `ICharacterMaster` antes de editar (ele tem comentários extensos sobre a exceção de mana — preserve-os). Adicione estes 5 campos, todos opcionais/nullable, ao final de `ICharacterMaster` (nunca em `ICharacterDisplay` — são Mestre-only, mesma regra do `hp_current`):

```ts
  class_id: number | null;
  species_id: number | null;
  origin_id: number | null;
  level: number;
  attributes: ICharacterAttributes | null;
```

Adicione o import no topo do arquivo:

```ts
import type { ICharacterAttributes } from './RulesContent';
```

- [ ] **Step 4: Verificar tipos**

```bash
npx tsc --noEmit
```

Expected: erros em todo arquivo que constrói `ICharacterMaster` sem os 5 campos novos (rotas de API — corrigidas na Task 5). Isso é esperado neste ponto do plano.

- [ ] **Step 5: Commit**

```bash
git add resources/character/enums/Attribute.ts resources/character/models/RulesContent.ts resources/character/models/Character.ts
git commit -m "feat: modelos TS de Classes/Espécies/Origens + atributos"
```

---

## Task 3: Seed com os dados reais do manual

**Files:**
- Create: `db/seed/seedRules.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `db` de `libs/db.ts`, tabelas `classes`/`species`/`origins` (Task 1).
- Produces: 9 linhas em `classes`, 8 em `species`, 8 em `origins`.

- [ ] **Step 1: Criar `db/seed/seedRules.ts`**

**Cuidado com um bug sutil de ordem de import:** `import` estáticos em TS/ESM são "hoisted" (sempre executam antes de qualquer código do módulo, na ordem em que aparecem, mas todos antes do corpo do arquivo) — então `import { db } from '../../libs/db'` executaria (e `libs/db.ts` já montaria a `Pool` lendo `process.env.POSTGRES_HOST` etc.) **antes** de `config({ path: '.env' })` rodar, mesmo escrevendo o `config()` "antes" no código-fonte. Por isso este script monta sua **própria** conexão local (mesmo padrão de `libs/db.ts`, só que com `dotenv` garantido antes) em vez de importar `libs/db.ts`:

```ts
import { config } from 'dotenv';

config({ path: '.env' });

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { classes, species, origins } from '../schema';
import { EAttribute } from '../../resources/character/enums/Attribute';

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

const db = drizzle(pool);

const A = EAttribute;

async function seedClasses() {
  const rows = [
    {
      name: 'Bárbaro',
      description: 'Bárbaros são combatentes de poder avassalador, impulsionados por forças primitivas do multiverso que se manifestam através de sua Fúria.',
      primary_attributes: [A.FORCA],
      attribute_bonuses: [
        { attribute: A.FORCA, amount: 2 },
        { attribute: A.CONSTITUICAO, amount: 1 },
        { attribute: A.DESTREZA, amount: 1 },
        { attribute: A.SABEDORIA, amount: -1 },
        { attribute: A.INTELIGENCIA, amount: -1 },
      ],
      skill_proficiency_choice: { count: 3, options: ['Acrobacia', 'Adestramento', 'Intimidação', 'Intuição', 'Percepção'] },
      knowledge_proficiency_choice: null,
      equipment_choice: { options: [{ label: 'A', description: 'Uma arma de curto alcance de duas mãos' }, { label: 'B', description: 'Duas armas de curto alcance de uma mão' }] },
      fixed_equipment: null,
      hp_base: 8, mana_base: 0, evasion: 10,
      extra_resources: [{ label: 'Dano de curto alcance', value: '1d12' }, { label: 'Fúrias', value: '1' }, { label: 'Força Extra', value: '1d4' }],
    },
    {
      name: 'Caçador',
      description: 'Caçadores são os olhos e o instinto do ermo selvagem, aqueles que aprenderam a se mover sem deixar rastro e a golpear sem dar aviso.',
      primary_attributes: [A.SABEDORIA, A.DESTREZA],
      attribute_bonuses: [
        { attribute: A.DESTREZA, amount: 2 },
        { attribute: A.SABEDORIA, amount: 1 },
        { attribute: A.CONSTITUICAO, amount: 1 },
        { attribute: A.CARISMA, amount: -2 },
      ],
      skill_proficiency_choice: { count: 1, options: ['Acrobacia', 'Adestramento', 'Furtividade', 'Investigação', 'Intuição', 'Percepção'] },
      knowledge_proficiency_choice: { fixed: ['Animal'], count: 1, options: ['Botânico', 'Geológico', 'Navegação'] },
      equipment_choice: { options: [{ label: 'A', description: 'Uma arma de curto alcance' }, { label: 'B', description: 'Uma arma de médio alcance' }] },
      fixed_equipment: ['Uma arma de longo alcance', 'Um companheiro animal'],
      hp_base: 8, mana_base: 2, evasion: 9,
      extra_resources: [{ label: 'Magias conhecidas', value: '1' }, { label: 'Armadilhas', value: '1' }, { label: 'Dano curto/médio', value: '1d6' }, { label: 'Dano longo', value: '2d4' }, { label: 'Fera Mágica — Vida', value: '2' }, { label: 'Fera Mágica — Dano', value: '1d4' }],
    },
    {
      name: 'Cavaleiro',
      description: 'Cavaleiros são mais do que combatentes experientes: são a personificação de um código de honra que orienta cada escolha, dentro e fora do campo de batalha.',
      primary_attributes: [A.FORCA],
      attribute_bonuses: [
        { attribute: A.CONSTITUICAO, amount: 2 },
        { attribute: A.FORCA, amount: 1 },
        { attribute: A.DESTREZA, amount: 1 },
        { attribute: A.SORTE, amount: -2 },
      ],
      skill_proficiency_choice: { count: 3, options: ['Adestramento', 'Intimidação', 'Intuição', 'Investigação', 'Percepção', 'Pilotar', 'Simpatia'] },
      knowledge_proficiency_choice: null,
      equipment_choice: {
        options: [
          { label: 'A', description: 'Uma arma de curto alcance de duas mãos' },
          { label: 'B', description: 'Duas armas de curto alcance de uma mão' },
          { label: 'C', description: 'Uma arma de médio alcance de uma mão e escudo' },
          { label: 'D', description: 'Uma arma de longo alcance' },
        ],
      },
      fixed_equipment: null,
      hp_base: 10, mana_base: 0, evasion: 8,
      extra_resources: [{ label: 'Dano curto', value: '2d6' }, { label: 'Dano médio', value: '2d4' }, { label: 'Dano longo', value: '1d6' }, { label: 'Defesa de escudo', value: '+3:+3' }, { label: 'Recuperar Fôlego', value: '2 usos, d6' }],
    },
    {
      name: 'Clérigo',
      description: 'Clérigos são servos diretos do divino, indivíduos que canalizam a vontade de entidades superiores para o mundo mortal.',
      primary_attributes: [A.SABEDORIA],
      attribute_bonuses: [
        { attribute: A.SABEDORIA, amount: 2 },
        { attribute: A.CARISMA, amount: 1 },
        { attribute: A.INTELIGENCIA, amount: 1 },
        { attribute: A.CONSTITUICAO, amount: -2 },
      ],
      skill_proficiency_choice: { count: 1, options: ['Adestramento', 'Intimidação', 'Intuição', 'Investigação', 'Percepção', 'Simpatia'] },
      knowledge_proficiency_choice: { fixed: ['Religioso'], count: 1, options: ['Arcano', 'Médico', 'Político'] },
      equipment_choice: null,
      fixed_equipment: ['Um símbolo religioso'],
      hp_base: 6, mana_base: 4, evasion: 4,
      extra_resources: [{ label: 'Magias conhecidas', value: '4' }, { label: 'Dano de emissão', value: '1d4' }, { label: 'Marca Divina', value: '1 uso' }, { label: 'Toque da Compaixão', value: '1d12' }],
    },
    {
      name: 'Cozinheiro',
      description: 'O cozinheiro é a prova viva de que o poder não nasce apenas do aço, da fé ou da magia arcana — a preparação certa pode decidir o resultado de uma aventura.',
      primary_attributes: [A.SABEDORIA],
      attribute_bonuses: [
        { attribute: A.CARISMA, amount: 1 },
        { attribute: A.DESTREZA, amount: 1 },
        { attribute: A.FORCA, amount: 1 },
        { attribute: A.SABEDORIA, amount: 1 },
        { attribute: A.SORTE, amount: -1 },
        { attribute: A.INTELIGENCIA, amount: -1 },
      ],
      skill_proficiency_choice: { count: 2, options: ['Intimidação', 'Investigação', 'Persuasão', 'Prestidigitação', 'Simpatia'] },
      knowledge_proficiency_choice: { fixed: ['Culinária'], count: 0, options: [] },
      equipment_choice: null,
      fixed_equipment: ['Uma arma de curto alcance de uma mão', 'Uma bolsa de Cozinheiro', 'Utensílios de Cozinheiro'],
      hp_base: 6, mana_base: 4, evasion: 6,
      extra_resources: [{ label: 'Dano de curto alcance', value: '1d6' }, { label: 'Petiscos', value: '3' }],
    },
    {
      name: 'Druida',
      description: 'Druidas são guardiões do equilíbrio natural e reverentes da vida selvagem em todas as suas formas.',
      primary_attributes: [A.SABEDORIA],
      attribute_bonuses: [
        { attribute: A.SABEDORIA, amount: 2 },
        { attribute: A.CONSTITUICAO, amount: 1 },
        { attribute: A.DESTREZA, amount: 1 },
        { attribute: A.FORCA, amount: -2 },
      ],
      skill_proficiency_choice: null,
      knowledge_proficiency_choice: { fixed: ['Animal', 'Botânico'], count: 1, options: ['Arcano', 'Geológico', 'Médico'] },
      equipment_choice: null,
      fixed_equipment: ['Um condutor mágico', 'Uma bolsa para guardar ingredientes mágicos'],
      hp_base: 6, mana_base: 4, evasion: 4,
      extra_resources: [{ label: 'Magias conhecidas', value: '5' }, { label: 'Dano de magia (Leque)', value: '1d8' }, { label: 'Dano de magia (Granada)', value: '1d6' }],
    },
    {
      name: 'Feiticeiro',
      description: 'Feiticeiros manifestam magia de forma instintiva, mas raramente de maneira consciente logo no início de suas vidas.',
      primary_attributes: [A.SORTE],
      attribute_bonuses: [
        { attribute: A.SORTE, amount: 2 },
        { attribute: A.CARISMA, amount: 1 },
        { attribute: A.DESTREZA, amount: 1 },
        { attribute: A.CONSTITUICAO, amount: -1 },
        { attribute: A.FORCA, amount: -1 },
      ],
      skill_proficiency_choice: { count: 2, options: ['Intuição', 'Investigação', 'Percepção', 'Prestidigitação'] },
      knowledge_proficiency_choice: { fixed: ['Arcano'], count: 0, options: [] },
      equipment_choice: null,
      fixed_equipment: ['Um condutor mágico', 'Uma bolsa para guardar ingredientes mágicos'],
      hp_base: 4, mana_base: 3, evasion: 4,
      extra_resources: [{ label: 'Magias conhecidas', value: '3' }, { label: 'Tipagens', value: '1' }, { label: 'Dano de Toque', value: '1d10' }, { label: 'Dano de Emissão', value: '1d8' }, { label: 'Dano de Granada', value: '1d6' }, { label: 'Dado de Conjuração Forçada', value: '1d2' }],
    },
    {
      name: 'Ladino',
      description: 'Ladinos são mestres do movimento silencioso e da ação precisa — onde outros veem obstáculos, o Ladino enxerga rotas de fuga, esconderijos e oportunidades.',
      primary_attributes: [A.DESTREZA],
      attribute_bonuses: [
        { attribute: A.DESTREZA, amount: 3 },
        { attribute: A.SORTE, amount: 1 },
        { attribute: A.CONSTITUICAO, amount: -1 },
        { attribute: A.SABEDORIA, amount: -1 },
      ],
      skill_proficiency_choice: { count: 3, options: ['Arcano', 'Acrobacia', 'Blefe', 'Botânico', 'Furtividade', 'Investigação', 'Navegação', 'Pilotar', 'Percepção', 'Prestidigitação'] },
      knowledge_proficiency_choice: null,
      equipment_choice: { options: [{ label: 'A', description: 'Dez armas de curto alcance de uma mão' }, { label: 'B', description: 'Uma arma de longo alcance' }] },
      fixed_equipment: ['Um kit de ferramentas de ladrão'],
      hp_base: 4, mana_base: 0, evasion: 12,
      extra_resources: [{ label: 'Dano de curto alcance', value: '2d4' }, { label: 'Dano de lançamento', value: '1d6' }, { label: 'Dano de longo alcance', value: '1d8' }, { label: 'Dado Furtivo', value: '1d4' }],
    },
    {
      name: 'Paladino',
      description: 'Paladinos são soldados da fé, guerreiros moldados por um voto sagrado que se sobrepõe a qualquer desejo pessoal.',
      primary_attributes: [A.CARISMA, A.FORCA],
      attribute_bonuses: [
        { attribute: A.CARISMA, amount: 2 },
        { attribute: A.FORCA, amount: 2 },
        { attribute: A.DESTREZA, amount: -1 },
        { attribute: A.SABEDORIA, amount: -1 },
      ],
      skill_proficiency_choice: { count: 2, options: ['Adestramento', 'Intuição', 'Intimidação', 'Percepção', 'Pilotar', 'Simpatia'] },
      knowledge_proficiency_choice: { fixed: ['Religioso'], count: 0, options: [] },
      equipment_choice: null,
      fixed_equipment: ['Um símbolo religioso', 'Uma arma de curto alcance'],
      hp_base: 8, mana_base: 1, evasion: 8,
      extra_resources: [{ label: 'Magias conhecidas', value: '1' }, { label: 'Dano de curto alcance', value: '2d4' }, { label: 'Mãos Consagradas', value: '2 usos' }],
    },
  ];

  await db.insert(classes).values(rows);
  console.log(`${rows.length} classes inseridas.`);
}

async function seedSpecies() {
  const rows = [
    {
      name: 'Anão',
      description: 'Os Anões são amplamente reconhecidos por sua tenacidade inabalável e por sua extraordinária capacidade de resistir aos rigores das condições mais hostis.',
      attribute_bonuses: [],
      racial_abilities: [
        { name: 'Resistência Anã', description: 'Anões não possuem restrições para descansar, suportando longos períodos de esforço sem prejuízo à recuperação.' },
        { name: 'Visão Noturna', description: 'Anões possuem visão noturna nítida em até 6 metros, permitindo que enxerguem em ambientes de baixa luminosidade.' },
        { name: 'Sangue de pedra', description: 'Anões recebem +1d6 de Esperança em testes para resistir a venenos e toxinas.' },
      ],
    },
    {
      name: 'Draconato',
      description: 'Os draconatos são um povo profundamente marcado pelo valor da linhagem — a identidade de um indivíduo se estende por gerações.',
      attribute_bonuses: [],
      racial_abilities: [
        { name: 'Auxílio Ancestral', description: 'Draconatos podem repetir qualquer teste falho pelo custo de 4 pontos de Esperança e adicionar 2 pontos de Medo, uma vez por descanso curto.' },
        { name: 'Aviso do Além', description: 'Draconatos recebem +1d4 de Esperança contra efeitos negativos de surpresa, como armadilhas ou emboscadas.' },
      ],
    },
    {
      name: 'Elfo',
      description: 'Os elfos são seres profundamente ligados à natureza, mantendo com ela uma relação íntima que vai além da simples coexistência.',
      attribute_bonuses: [],
      racial_abilities: [
        { name: 'Passos Leves', description: 'Elfos podem se locomover livremente em qualquer terreno não mágico dificultado pelo peso (neve fofa, gelo fino, lama profunda, areia movediça), sem sofrer penalidades de movimento.' },
        { name: 'Equilíbrio Natural', description: 'Elfos raramente perdem o equilíbrio, recebendo +1d6 de Esperança contra quedas e escorregões.' },
        { name: 'Olhos das Copas', description: 'Elfos possuem visão diurna nítida em 60 metros.' },
      ],
    },
    {
      name: 'Firbolg',
      description: 'Os firbolgs vivem segundo o princípio da simplicidade consciente — o silêncio ocupa um papel central em sua cultura.',
      attribute_bonuses: [],
      racial_abilities: [
        { name: 'Pesados como a Rocha', description: 'Firbolgs recebem +1d6 de Esperança em testes para resistir a ser empurrado ou derrubado.' },
        { name: 'Silêncio Observador', description: 'Após passar um turno sem atacar, conjurar, falar ou mover-se, os firbolgs recebem +1d4 de Esperança em percepção.' },
        { name: 'Respiração Mineral', description: 'Firbolgs precisam de menos comida, água e ar, podendo sobreviver em ambientes hostis por mais tempo.' },
      ],
    },
    {
      name: 'Hobbit',
      description: 'Os Hobbits são amplamente conhecidos por seu espírito festeiro e por seu amor genuíno pelas boas celebrações.',
      attribute_bonuses: [],
      racial_abilities: [
        { name: 'Sorte Inesperada', description: 'Hobbits podem repetir um teste envolvendo Sorte cinco vezes por descanso curto.' },
        { name: 'Esperança Inabalável', description: 'Hobbits recebem +1d6 de Esperança em testes para resistir a efeitos de medo.' },
        { name: 'Ânimo Contagiante', description: 'Hobbits recebem +1d6 de Esperança em testes sociais voltados a aliviar tensões, acalmar conflitos ou restaurar a moral do grupo.' },
      ],
    },
    {
      name: 'Humano',
      description: 'Os humanos são movidos por uma ambição constante — para eles, o mundo não é um campo fixo, mas um campo de possibilidades a ser explorado.',
      attribute_bonuses: [],
      racial_abilities: [
        { name: 'Aprendendo com os erros', description: 'Fora de combate, ao falhar em um teste, humanos recebem +1d4 de Esperança no próximo teste que fizerem da mesma habilidade.' },
        { name: 'Improviso', description: 'Humanos podem gastar 4 horas para fazer uma versão improvisada de uma ferramenta que tenham conhecimento de como usar.' },
        { name: 'Ousadia', description: 'Humanos podem, 3 vezes por descanso curto, declarar uma ação como ousada, mudando o valor de pontos adquiridos na rolagem (sucesso crítico: 4 Esperança; sucesso com Esperança: 2 Esperança; falha com Esperança: 1 Esperança; sucesso com Medo: 2 Medo; falha crítica: 4 Medo).' },
      ],
    },
    {
      name: 'Orc',
      description: 'A sociedade orc é fortemente estruturada em torno do valor do trabalho — o coletivo sempre prevalece sobre o indivíduo.',
      attribute_bonuses: [],
      racial_abilities: [
        { name: 'Dedicação ao Ofício', description: 'Ao criar o personagem, o orc pode escolher uma ferramenta adicional em sua origem.' },
        { name: 'Visão Prática', description: 'Orcs possuem visão diurna apenas em tons de cinza e visão noturna de 20 metros em tons de cinza.' },
        { name: 'Força do Coletivo', description: 'Orcs recebem +1d4 de Esperança em testes para fazer ações colaborativas em que possuam perícia.' },
      ],
    },
    {
      name: 'Tiefling',
      description: 'Tieflings possuem uma aparência inconfundível, marcada por traços que destoam do comum entre os povos sencientes.',
      attribute_bonuses: [],
      racial_abilities: [
        { name: 'Cauda Preênsil', description: 'Tieflings possuem controle pleno de sua cauda, capazes de usá-la para segurar, sustentar ou operar objetos simples (tocha, alavancas, pequenos objetos) enquanto as mãos permanecem livres.' },
        { name: 'Resiliência ao Julgamento', description: 'Tieflings recebem +1d4 de Esperança em testes para resistir a efeitos de medo.' },
        { name: 'Olhar do Deslocado', description: 'Tieflings recebem +1d4 de Esperança em testes de percepção social (identificar mentiras, tensões ou intenções ocultas).' },
      ],
    },
  ];

  await db.insert(species).values(rows);
  console.log(`${rows.length} espécies inseridas.`);
}

async function seedOrigins() {
  const rows = [
    {
      name: 'Filho da Oficina',
      description: 'Criado entre bancadas, ferramentas e o som constante do trabalho manual, você aprendeu cedo o valor da paciência e da precisão.',
      attribute_bonus_options: [[{ attribute: A.DESTREZA, amount: 2 }], [{ attribute: A.DESTREZA, amount: 1 }, { attribute: A.INTELIGENCIA, amount: 1 }]],
      granted_proficiency: null,
      proficiency_choice: { options: ['Ferramentas (carpinteiro)', 'Ferramentas (ferreiro)', 'Ferramentas (couro)', 'Ferramentas (oleiro)'] },
      starting_items: 'Conjunto simples de ferramentas do ofício, avental resistente',
      starting_money: '12 cg',
    },
    {
      name: 'Criado nas Ruas',
      description: 'Você aprendeu a sobreviver onde a lei raramente alcança. Observação, esperteza e oportunismo foram suas maiores armas.',
      attribute_bonus_options: [[{ attribute: A.DESTREZA, amount: 2 }], [{ attribute: A.DESTREZA, amount: 1 }, { attribute: A.CARISMA, amount: 1 }]],
      granted_proficiency: null,
      proficiency_choice: { options: ['Blefe', 'Furtividade'] },
      starting_items: 'Manto surrado com bolsos ocultos, pequena faca ou ferramenta improvisada',
      starting_money: '15 cg',
    },
    {
      name: 'Devoto do Altar',
      description: 'Sua vida sempre girou em torno de templos, rituais e preces. Mesmo longe da fé formal, os ensinamentos ainda ecoam em suas ações.',
      attribute_bonus_options: [[{ attribute: A.SABEDORIA, amount: 2 }], [{ attribute: A.SABEDORIA, amount: 1 }, { attribute: A.CARISMA, amount: 1 }]],
      granted_proficiency: 'Conhecimento religioso',
      proficiency_choice: null,
      starting_items: 'Símbolo religioso simples, livro de orações ou hinos',
      starting_money: '10 cg',
    },
    {
      name: 'Aprendiz de Erudito',
      description: 'Passou anos cercado de livros, mapas e debates acadêmicos. Mesmo que o mundo real seja mais caótico, você sabe onde procurar respostas.',
      attribute_bonus_options: [[{ attribute: A.INTELIGENCIA, amount: 2 }], [{ attribute: A.INTELIGENCIA, amount: 1 }, { attribute: A.SABEDORIA, amount: 1 }]],
      granted_proficiency: null,
      proficiency_choice: { options: ['Conhecimento arcano', 'Conhecimento botânico', 'Conhecimento político'] },
      starting_items: 'Caderno de anotações, tinteiro e pena',
      starting_money: '8 cg',
    },
    {
      name: 'Filho do Campo',
      description: 'A terra foi sua professora. Plantar, colher e observar os ciclos da natureza moldaram sua visão de mundo.',
      attribute_bonus_options: [[{ attribute: A.CONSTITUICAO, amount: 2 }], [{ attribute: A.CONSTITUICAO, amount: 1 }, { attribute: A.SABEDORIA, amount: 1 }]],
      granted_proficiency: 'Conhecimento animal',
      proficiency_choice: null,
      starting_items: 'Ferramenta agrícola simples, saco de sementes variadas',
      starting_money: '10 cg',
    },
    {
      name: 'Artista Itinerante',
      description: 'Sua vida foi uma sucessão de estradas, palcos improvisados e histórias trocadas por abrigo e comida.',
      attribute_bonus_options: [[{ attribute: A.CARISMA, amount: 2 }], [{ attribute: A.CARISMA, amount: 1 }, { attribute: A.DESTREZA, amount: 1 }]],
      granted_proficiency: null,
      proficiency_choice: { options: ['Persuasão', 'Simpatia'] },
      starting_items: 'Instrumento musical simples ou material artístico',
      starting_money: '18 cg',
    },
    {
      name: 'Sobrevivente de Conflito',
      description: 'Você cresceu em meio a batalhas, ocupações ou rebeliões. A violência deixou marcas, mas também ensinou a resistir.',
      attribute_bonus_options: [[{ attribute: A.CONSTITUICAO, amount: 2 }], [{ attribute: A.CONSTITUICAO, amount: 1 }, { attribute: A.FORCA, amount: 1 }]],
      granted_proficiency: 'Intimidação',
      proficiency_choice: null,
      starting_items: 'Símbolo quebrado de uma facção ou exército, lembrança de um aliado',
      starting_money: '14 cg',
    },
    {
      name: 'Herdeiro de um Nome',
      description: 'Você nasceu carregando expectativas. Seja uma família respeitada ou infame, o peso do nome ainda o acompanha.',
      attribute_bonus_options: [[{ attribute: A.SORTE, amount: 2 }], [{ attribute: A.CARISMA, amount: 1 }, { attribute: A.SORTE, amount: 1 }]],
      granted_proficiency: null,
      proficiency_choice: { options: ['Blefe', 'Persuasão'] },
      starting_items: 'Anel, broche ou documento que prova sua linhagem',
      starting_money: '20 cg',
    },
  ];

  await db.insert(origins).values(rows);
  console.log(`${rows.length} origens inseridas.`);
}

// Idempotente: só popula se as tabelas estiverem vazias — seguro rodar mais
// de uma vez (ex: depois de recriar o banco local).
async function main() {
  const [existingClasses] = await db.select({ id: classes.id }).from(classes).limit(1);
  const [existingSpecies] = await db.select({ id: species.id }).from(species).limit(1);
  const [existingOrigins] = await db.select({ id: origins.id }).from(origins).limit(1);

  if (!existingClasses) await seedClasses(); else console.log('classes já populada, pulando.');
  if (!existingSpecies) await seedSpecies(); else console.log('species já populada, pulando.');
  if (!existingOrigins) await seedOrigins(); else console.log('origins já populada, pulando.');

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Adicionar script no `package.json`**

Adicione depois de `"db:push": "drizzle-kit push"`:

```json
    "db:seed:rules": "tsx db/seed/seedRules.ts"
```

- [ ] **Step 3: Rodar o seed**

```bash
npm run db:seed:rules
```

Expected: `9 classes inseridas.` / `8 espécies inseridas.` / `8 origens inseridas.`

- [ ] **Step 4: Verificar via SQL**

```bash
docker exec storyweaver-postgres psql -U postgres -d storyweaver -c "SELECT count(*) FROM classes;"
docker exec storyweaver-postgres psql -U postgres -d storyweaver -c "SELECT count(*) FROM species;"
docker exec storyweaver-postgres psql -U postgres -d storyweaver -c "SELECT count(*) FROM origins;"
docker exec storyweaver-postgres psql -U postgres -d storyweaver -c "SELECT name, hp_base, mana_base, evasion FROM classes ORDER BY name;"
```

Expected: contagens 9/8/8; a listagem de classes bate com os valores da tabela de progressão nível 1 do manual (ex: Bárbaro hp_base=8, mana_base=0, evasion=10).

- [ ] **Step 5: Rodar de novo pra confirmar idempotência**

```bash
npm run db:seed:rules
```

Expected: `classes já populada, pulando.` / `species já populada, pulando.` / `origins já populada, pulando.` — nenhuma duplicata.

- [ ] **Step 6: Commit**

```bash
git add db/seed/seedRules.ts package.json
git commit -m "feat: seed de Classes/Espécies/Origens com dados do manual"
```

---

## Task 4: API de leitura — GET /api/classes, /api/species, /api/origins

**Files:**
- Create: `app/api/classes/route.ts`
- Create: `app/api/species/route.ts`
- Create: `app/api/origins/route.ts`
- Create: `resources/character/services/getClasses.ts`
- Create: `resources/character/services/getSpecies.ts`
- Create: `resources/character/services/getOrigins.ts`

**Interfaces:**
- Consumes: `classes`/`species`/`origins` (Task 1), `IClass`/`ISpecies`/`IOrigin` (Task 2).
- Produces: `getClassesService`, `getSpeciesService`, `getOriginsService` + `GET_CLASSES_KEY`/`GET_SPECIES_KEY`/`GET_ORIGINS_KEY` — usados pelo wizard (Task 7).

- [ ] **Step 1: Criar `app/api/classes/route.ts`**

```ts
import { db } from '@/libs/db';
import { classes } from '@/db/schema';
import { NextResponse } from 'next/server';

// Lista todas as Classes — conteúdo de regras, sem checagem de Mestre (mesmo
// raciocínio de GET /api/tables: dado público de sistema, não de uma Mesa
// específica).
export async function GET() {
  try {
    const rows = await db.select().from(classes).orderBy(classes.name);

    return NextResponse.json({
      success: true,
      message: { 'pt-br': 'Operação realizada com sucesso.', 'es-mx': 'Operación realizada con éxito.', 'en-us': 'Operation completed successfully.' },
      data: rows,
    });
  } catch (e) {
    console.error(e);

    return NextResponse.json({ success: false, message: { 'pt-br': 'Erro ao listar as classes.', 'es-mx': 'Error al listar las clases.', 'en-us': 'Error listing classes.' }, data: null }, { status: 500 });
  }
}
```

- [ ] **Step 2: Criar `app/api/species/route.ts`** (mesmo padrão do Step 1, trocando `classes` por `species`)

```ts
import { db } from '@/libs/db';
import { species } from '@/db/schema';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const rows = await db.select().from(species).orderBy(species.name);

    return NextResponse.json({
      success: true,
      message: { 'pt-br': 'Operação realizada com sucesso.', 'es-mx': 'Operación realizada con éxito.', 'en-us': 'Operation completed successfully.' },
      data: rows,
    });
  } catch (e) {
    console.error(e);

    return NextResponse.json({ success: false, message: { 'pt-br': 'Erro ao listar as espécies.', 'es-mx': 'Error al listar las especies.', 'en-us': 'Error listing species.' }, data: null }, { status: 500 });
  }
}
```

- [ ] **Step 3: Criar `app/api/origins/route.ts`** (mesmo padrão, trocando por `origins`)

```ts
import { db } from '@/libs/db';
import { origins } from '@/db/schema';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const rows = await db.select().from(origins).orderBy(origins.name);

    return NextResponse.json({
      success: true,
      message: { 'pt-br': 'Operação realizada com sucesso.', 'es-mx': 'Operación realizada con éxito.', 'en-us': 'Operation completed successfully.' },
      data: rows,
    });
  } catch (e) {
    console.error(e);

    return NextResponse.json({ success: false, message: { 'pt-br': 'Erro ao listar as origens.', 'es-mx': 'Error al listar los orígenes.', 'en-us': 'Error listing origins.' }, data: null }, { status: 500 });
  }
}
```

- [ ] **Step 4: Criar os 3 services**, `resources/character/services/getClasses.ts`:

```ts
import { appClient } from '@/utils/app-client';
import { QueryFnCtx } from '@/shared/types/tanstack';
import type { IClass } from '../models/RulesContent';

export const GET_CLASSES_KEY = ['get-classes'];

export function getClassesService({ signal }: QueryFnCtx) {
  return appClient.get<IClass[]>('/api/classes', { signal });
}
```

`resources/character/services/getSpecies.ts`:

```ts
import { appClient } from '@/utils/app-client';
import { QueryFnCtx } from '@/shared/types/tanstack';
import type { ISpecies } from '../models/RulesContent';

export const GET_SPECIES_KEY = ['get-species'];

export function getSpeciesService({ signal }: QueryFnCtx) {
  return appClient.get<ISpecies[]>('/api/species', { signal });
}
```

`resources/character/services/getOrigins.ts`:

```ts
import { appClient } from '@/utils/app-client';
import { QueryFnCtx } from '@/shared/types/tanstack';
import type { IOrigin } from '../models/RulesContent';

export const GET_ORIGINS_KEY = ['get-origins'];

export function getOriginsService({ signal }: QueryFnCtx) {
  return appClient.get<IOrigin[]>('/api/origins', { signal });
}
```

- [ ] **Step 5: Verificar via `curl`** (com o servidor `next dev` já rodando em `localhost:3002`)

```bash
curl -s http://localhost:3002/api/classes | node -e "process.stdin.resume();process.stdin.on('data',d=>{const j=JSON.parse(d);console.log(j.data.length, j.data[0].name)})"
curl -s http://localhost:3002/api/species | node -e "process.stdin.resume();process.stdin.on('data',d=>{const j=JSON.parse(d);console.log(j.data.length, j.data[0].name)})"
curl -s http://localhost:3002/api/origins | node -e "process.stdin.resume();process.stdin.on('data',d=>{const j=JSON.parse(d);console.log(j.data.length, j.data[0].name)})"
```

Expected: `9 Bárbaro`, `8 Anão`, `8 Artista Itinerante` (ordem alfabética por nome).

- [ ] **Step 6: Commit**

```bash
git add app/api/classes app/api/species app/api/origins resources/character/services/getClasses.ts resources/character/services/getSpecies.ts resources/character/services/getOrigins.ts
git commit -m "feat: API de leitura de Classes/Espécies/Origens"
```

---

## Task 5: API de personagem — aceitar e devolver class_id/species_id/origin_id/level/attributes

**Files:**
- Modify: `app/api/tables/[code]/characters/route.ts`
- Modify: `app/api/tables/[code]/characters/[id]/route.ts`
- Modify: `app/api/tables/[code]/route.ts`
- Modify: `resources/character/services/createCharacter.ts`

**Interfaces:**
- Consumes: `ICharacterMaster` estendido (Task 2).
- Produces: `POST`/`GET`/`PATCH` de personagem devolvem/aceitam os 5 campos novos — usado pela Task 7 (Review step do wizard) pra criar o personagem.

- [ ] **Step 1: Atualizar `resources/character/services/createCharacter.ts`**

Adicione ao `CreateCharacterServicePayload` (depois de `mana_max?: number;`):

```ts
  class_id?: number | null;
  species_id?: number | null;
  origin_id?: number | null;
  level?: number;
  attributes?: import('./../models/RulesContent').ICharacterAttributes | null;
```

- [ ] **Step 2: Atualizar `app/api/tables/[code]/characters/route.ts`**

No `POST`, dentro do `db.insert(characters).values({ ... })`, adicione (antes de `created_at: now,`):

```ts
      class_id: typeof body.class_id === 'number' ? body.class_id : null,
      species_id: typeof body.species_id === 'number' ? body.species_id : null,
      origin_id: typeof body.origin_id === 'number' ? body.origin_id : null,
      level: typeof body.level === 'number' ? body.level : 1,
      attributes: body.attributes && typeof body.attributes === 'object' ? body.attributes : null,
```

Este arquivo já tem uma função `toCharacterMaster` (linha 10) usada pela resposta do `POST`. Adicione os 5 campos novos ao objeto retornado, na mesma posição relativa (entre `mana_max` e `created_at`, mesma ordem usada no schema):

```ts
function toCharacterMaster(c: typeof characters.$inferSelect): ICharacterMaster {
  return {
    id: c.id,
    table_id: c.table_id,
    name: c.name,
    image_url: c.image_url,
    zone_id: c.zone_id,
    hp_current: c.hp_current,
    hp_max: c.hp_max,
    extra_hp: c.extra_hp,
    status_effects: c.status_effects as EStatusEffect[],
    visible: c.visible,
    has_mana: c.has_mana,
    mana_current: c.mana_current,
    mana_max: c.mana_max,
    class_id: c.class_id,
    species_id: c.species_id,
    origin_id: c.origin_id,
    level: c.level,
    attributes: c.attributes as ICharacterAttributes | null,
    created_at: c.created_at ? c.created_at.toISOString() : null,
    updated_at: c.updated_at ? c.updated_at.toISOString() : null,
  };
}
```

Adicione o import no topo do arquivo: `import type { ICharacterAttributes } from '@/resources/character/models/RulesContent';`

- [ ] **Step 3: Atualizar `toCharacterMaster` em `app/api/tables/[code]/characters/[id]/route.ts`**

Essa função já existe neste arquivo (usada por `PATCH`/`DELETE`) — adicione os mesmos 5 campos ao objeto retornado, na mesma posição relativa (depois de `mana_max`, antes de `created_at`):

```ts
    class_id: c.class_id,
    species_id: c.species_id,
    origin_id: c.origin_id,
    level: c.level,
    attributes: c.attributes as ICharacterAttributes | null,
```

Adicione o import no topo: `import type { ICharacterAttributes } from '@/resources/character/models/RulesContent';`

- [ ] **Step 4: Atualizar o mapeamento de `ICharacterMaster` em `app/api/tables/[code]/route.ts`**

Este arquivo monta o snapshot da Mesa com dois `.map()` diferentes por papel — o de `ICharacterMaster` (Mestre) começa com `isMaster ? characterRows.map((c): ICharacterMaster => ({`. Dentro dele, adicione os 5 campos na mesma posição usada nos outros arquivos desta task (entre `mana_max` e `created_at`):

```ts
        mana_current: c.mana_current,
        mana_max: c.mana_max,
        class_id: c.class_id,
        species_id: c.species_id,
        origin_id: c.origin_id,
        level: c.level,
        attributes: c.attributes as ICharacterAttributes | null,
        created_at: c.created_at ? c.created_at.toISOString() : null,
```

Adicione o import: `import type { ICharacterAttributes } from '@/resources/character/models/RulesContent';`

**Não** adicione esses campos no `.map()` de `ICharacterDisplay` (o `else` logo abaixo, usado pela Exibição) — são Mestre-only (Global Constraints, ver Task 10 Step 3 para o teste que confirma isso).

- [ ] **Step 5: Verificar tipos**

```bash
npx tsc --noEmit
```

Expected: sem erros (os erros da Task 2 Step 4 devem ter sumido agora).

- [ ] **Step 6: Verificar via `curl`** — crie um personagem de teste numa mesa descartável, referenciando um `class_id`/`species_id`/`origin_id` reais (pegue os IDs do resultado da Task 4 Step 5, ex: Bárbaro/Anão/Filho da Oficina):

```bash
rm -f /tmp/cookies_wizard.txt
curl -s -c /tmp/cookies_wizard.txt -X POST http://localhost:3002/api/tables -H "Content-Type: application/json" -d '{"name":"Teste Wizard API"}'
# copie o "code" da resposta pro comando abaixo (substitua CODE_AQUI)
curl -s -b /tmp/cookies_wizard.txt -X POST http://localhost:3002/api/tables/CODE_AQUI/characters -H "Content-Type: application/json" -d '{"name":"Grunk","hp_current":8,"hp_max":8,"class_id":1,"species_id":1,"origin_id":1,"level":1,"attributes":{"forca":2,"destreza":2,"constituicao":1,"carisma":0,"inteligencia":-1,"sabedoria":-1,"sorte":0}}'
```

Expected: resposta `201` com `class_id`/`species_id`/`origin_id`/`level`/`attributes` ecoados de volta corretamente.

- [ ] **Step 7: Limpar dados de teste**

```bash
curl -s -b /tmp/cookies_wizard.txt -X DELETE http://localhost:3002/api/tables/CODE_AQUI
rm -f /tmp/cookies_wizard.txt
```

- [ ] **Step 8: Commit**

```bash
git add app/api/tables resources/character/services/createCharacter.ts
git commit -m "feat: API de personagem aceita e devolve class_id/species_id/origin_id/level/attributes"
```

---

## Task 6: Utilitário de cálculo de atributos

**Files:**
- Create: `resources/character/models/calculateAttributes.ts`

**Interfaces:**
- Consumes: `IAttributeBonus[]` (Task 2).
- Produces: `calculateAttributes(bonusLists: IAttributeBonus[][]) => ICharacterAttributes` — usado pelo Review step do wizard (Task 7).

- [ ] **Step 1: Criar `resources/character/models/calculateAttributes.ts`**

```ts
import { ATTRIBUTE_ORDER } from '../enums/Attribute';
import type { IAttributeBonus, ICharacterAttributes } from './RulesContent';

// Soma listas de bônus de atributo (Classe + Espécie + Origem) a partir de
// uma baseline de 0 (confirmado com o usuário — ver
// docs/superpowers/specs/2026-08-28-character-creation-wizard-design.md,
// seção "Riscos / suposições"). Recebe várias listas porque cada fonte
// (classe/espécie/origem) contribui sua própria `IAttributeBonus[]`.
export function calculateAttributes(bonusLists: IAttributeBonus[][]): ICharacterAttributes {
  const result = {} as ICharacterAttributes;

  for (const attribute of ATTRIBUTE_ORDER) result[attribute] = 0;

  for (const bonuses of bonusLists) {
    for (const bonus of bonuses) {
      result[bonus.attribute as keyof ICharacterAttributes] += bonus.amount;
    }
  }

  return result;
}
```

- [ ] **Step 2: Verificar manualmente**

```bash
npx tsx -e "
import { calculateAttributes } from './resources/character/models/calculateAttributes';
const result = calculateAttributes([
  [{ attribute: 'forca', amount: 2 }, { attribute: 'constituicao', amount: 1 }],
  [],
  [{ attribute: 'destreza', amount: 2 }],
]);
console.log(result);
"
```

Expected: `{ forca: 2, destreza: 2, constituicao: 1, carisma: 0, inteligencia: 0, sabedoria: 0, sorte: 0 }`

- [ ] **Step 3: Commit**

```bash
git add resources/character/models/calculateAttributes.ts
git commit -m "feat: utilitário de cálculo de atributos (classe+espécie+origem)"
```

---

## Task 7: `CharacterWizard` — componente do wizard (5 passos)

**Files:**
- Create: `resources/character/components/CharacterWizard.tsx`

**Interfaces:**
- Consumes: `getClassesService`/`getSpeciesService`/`getOriginsService` (Task 4), `calculateAttributes` (Task 6), `createCharacterService` (Task 5), `ImageUploadInput` (já existe).
- Produces: `<CharacterWizard opened={} code={} onCreated={} onCancel={} />` — usado pela Task 8.

Os 5 passos (Espécie, Classe, Escolhas da Classe, Origem, Revisão) vivem num único arquivo porque compartilham o mesmo estado do wizard e nunca são reusados fora dele (diferente de `CharacterEditPanel.tsx`, que é reusado por Create e Update) — decisão de organização de arquivo consistente com `.claude/rules/file-organization.md` ("um clear purpose por arquivo", aqui o "purpose" é o wizard inteiro).

- [ ] **Step 1: Criar `resources/character/components/CharacterWizard.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button, Card, Group, Loader, Modal, SimpleGrid, Stack, Text, TextInput, Checkbox, Radio, Divider } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { getClassesService, GET_CLASSES_KEY } from '../services/getClasses';
import { getSpeciesService, GET_SPECIES_KEY } from '../services/getSpecies';
import { getOriginsService, GET_ORIGINS_KEY } from '../services/getOrigins';
import { createCharacterService } from '../services/createCharacter';
import { calculateAttributes } from '../models/calculateAttributes';
import { ATTRIBUTE_ORDER, ATTRIBUTE_LABEL } from '../enums/Attribute';
import { ImageUploadInput } from './ImageUploadInput';
import type { IClass, IOrigin, ISpecies } from '../models/RulesContent';

type WizardStep = 'species' | 'class' | 'classChoices' | 'origin' | 'review';

// Wizard de criação de Personagem guiado pelas regras de Contos e Cantos de
// Vilgard (ver docs/superpowers/specs/2026-08-28-character-creation-wizard-design.md).
// Motor genérico: nenhuma etapa conhece o nome de nenhuma classe/espécie/
// origem específica — tudo vem das fichas carregadas do banco (Task 1/3/4).
export function CharacterWizard({
  code,
  opened,
  onCancel,
  onCreated,
}: {
  code: string;
  opened: boolean;
  onCancel: () => void;
  onCreated: (character: { name: string; image_url: string | null; hp_max: number; has_mana: boolean; mana_max: number }) => void;
}) {
  const [step, setStep] = useState<WizardStep>('species');
  const [speciesId, setSpeciesId] = useState<number | null>(null);
  const [classId, setClassId] = useState<number | null>(null);
  const [skillChoices, setSkillChoices] = useState<string[]>([]);
  const [knowledgeChoices, setKnowledgeChoices] = useState<string[]>([]);
  const [equipmentLabel, setEquipmentLabel] = useState<string | null>(null);
  const [originId, setOriginId] = useState<number | null>(null);
  const [originBonusIndex, setOriginBonusIndex] = useState<number | null>(null);
  const [originProficiency, setOriginProficiency] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const { data: speciesData, isLoading: speciesLoading } = useQuery({ queryKey: GET_SPECIES_KEY, queryFn: getSpeciesService, enabled: opened });
  const { data: classesData, isLoading: classesLoading } = useQuery({ queryKey: GET_CLASSES_KEY, queryFn: getClassesService, enabled: opened });
  const { data: originsData, isLoading: originsLoading } = useQuery({ queryKey: GET_ORIGINS_KEY, queryFn: getOriginsService, enabled: opened });

  const speciesList = speciesData?.data ?? [];
  const classesList = classesData?.data ?? [];
  const originsList = originsData?.data ?? [];

  const selectedSpecies = speciesList.find((item) => item.id === speciesId) ?? null;
  const selectedClass = classesList.find((item) => item.id === classId) ?? null;
  const selectedOrigin = originsList.find((item) => item.id === originId) ?? null;

  function reset() {
    setStep('species');
    setSpeciesId(null);
    setClassId(null);
    setSkillChoices([]);
    setKnowledgeChoices([]);
    setEquipmentLabel(null);
    setOriginId(null);
    setOriginBonusIndex(null);
    setOriginProficiency(null);
    setName('');
    setImageUrl('');
  }

  function cancel() {
    reset();
    onCancel();
  }

  function pickSpecies(item: ISpecies) {
    setSpeciesId(item.id);
    setStep('class');
  }

  function pickClass(item: IClass) {
    setClassId(item.id);
    setSkillChoices([]);
    setKnowledgeChoices([]);
    setEquipmentLabel(item.equipment_choice?.options[0]?.label ?? null);

    // Classe sem NENHUMA escolha (nem perícia, nem conhecimento, nem
    // equipamento) pula direto pra Origem — motor genérico não força uma
    // etapa vazia.
    const hasChoices = !!item.skill_proficiency_choice?.count || !!item.knowledge_proficiency_choice?.count || !!item.equipment_choice;

    setStep(hasChoices ? 'classChoices' : 'origin');
  }

  function toggleSkillChoice(value: string) {
    if (!selectedClass?.skill_proficiency_choice) return;

    const max = selectedClass.skill_proficiency_choice.count;

    setSkillChoices((prev) => {
      if (prev.includes(value)) return prev.filter((v) => v !== value);
      if (prev.length >= max) return prev;

      return [...prev, value];
    });
  }

  function toggleKnowledgeChoice(value: string) {
    if (!selectedClass?.knowledge_proficiency_choice) return;

    const max = selectedClass.knowledge_proficiency_choice.count;

    setKnowledgeChoices((prev) => {
      if (prev.includes(value)) return prev.filter((v) => v !== value);
      if (prev.length >= max) return prev;

      return [...prev, value];
    });
  }

  function classChoicesValid(): boolean {
    if (!selectedClass) return false;

    const skillOk = !selectedClass.skill_proficiency_choice || skillChoices.length === selectedClass.skill_proficiency_choice.count;
    const knowledgeOk = !selectedClass.knowledge_proficiency_choice || knowledgeChoices.length === selectedClass.knowledge_proficiency_choice.count;
    const equipmentOk = !selectedClass.equipment_choice || !!equipmentLabel;

    return skillOk && knowledgeOk && equipmentOk;
  }

  function pickOrigin(item: IOrigin) {
    setOriginId(item.id);
    setOriginBonusIndex(0);
    setOriginProficiency(item.proficiency_choice?.options[0] ?? null);
  }

  function originValid(): boolean {
    if (!selectedOrigin) return false;
    if (originBonusIndex === null) return false;
    if (selectedOrigin.proficiency_choice && !originProficiency) return false;

    return true;
  }

  const finalAttributes = selectedClass && selectedSpecies && selectedOrigin && originBonusIndex !== null
    ? calculateAttributes([
      selectedClass.attribute_bonuses,
      selectedSpecies.attribute_bonuses,
      selectedOrigin.attribute_bonus_options[originBonusIndex],
    ])
    : null;

  const createMutation = useMutation({
    mutationFn: () => {
      if (!selectedClass || !selectedSpecies || !selectedOrigin || !finalAttributes) return Promise.reject(new Error('Wizard incompleto.'));

      return createCharacterService({
        code,
        body: {
          name: name.trim(),
          image_url: imageUrl || null,
          hp_current: selectedClass.hp_base,
          hp_max: selectedClass.hp_base,
          has_mana: selectedClass.mana_base > 0,
          mana_current: selectedClass.mana_base,
          mana_max: selectedClass.mana_base,
          class_id: selectedClass.id,
          species_id: selectedSpecies.id,
          origin_id: selectedOrigin.id,
          level: 1,
          attributes: finalAttributes,
        },
      });
    },
    onSuccess: (res) => {
      notifications.show({ message: res.message['pt-br'], color: 'green' });

      const created = res.data;

      reset();
      onCreated({ name: created.name, image_url: created.image_url, hp_max: created.hp_max, has_mana: created.has_mana, mana_max: created.mana_max });
    },
    onError: (err: any) => {
      notifications.show({
        title: 'Erro',
        message: err?.data?.message?.['pt-br'] ?? 'Não foi possível criar o personagem. Tente novamente.',
        color: 'red',
      });
    },
  });

  const anyLoading = speciesLoading || classesLoading || originsLoading;

  return (
    <Modal
      opened={opened}
      onClose={cancel}
      title="Criar Personagem"
      size="lg"
      centered
    >
      {anyLoading ? (
        <div className="flex justify-center py-8">
          <Loader color="primary" />
        </div>
      ) : null}

      {!anyLoading && step === 'species' ? (
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            Escolha a Espécie do personagem.
          </Text>

          <SimpleGrid cols={2}>
            {speciesList.map((item) => (
              <Card
                key={item.id}
                padding="sm"
                className="cursor-pointer transition hover:border-primary-400/60"
                onClick={() => pickSpecies(item)}
              >
                <Text fw={600}>
                  {item.name}
                </Text>
              </Card>
            ))}
          </SimpleGrid>
        </Stack>
      ) : null}

      {!anyLoading && step === 'class' ? (
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            Escolha a Classe do personagem.
          </Text>

          <SimpleGrid cols={2}>
            {classesList.map((item) => (
              <Card
                key={item.id}
                padding="sm"
                className="cursor-pointer transition hover:border-primary-400/60"
                onClick={() => pickClass(item)}
              >
                <Text fw={600}>
                  {item.name}
                </Text>

                <Text size="xs" c="dimmed">
                  {`Vida: ${item.hp_base}${item.mana_base > 0 ? ` · Mana: ${item.mana_base}` : ''}`}
                </Text>
              </Card>
            ))}
          </SimpleGrid>

          <Button variant="subtle" color="gray" size="xs" onClick={() => setStep('species')}>
            Voltar
          </Button>
        </Stack>
      ) : null}

      {!anyLoading && step === 'classChoices' && selectedClass ? (
        <Stack gap="md">
          <Text fw={700}>
            {`Escolhas de ${selectedClass.name}`}
          </Text>

          {selectedClass.skill_proficiency_choice ? (
            <div>
              <Text size="sm" fw={600}>
                {`Perícias — escolha ${selectedClass.skill_proficiency_choice.count}`}
              </Text>

              <Stack gap="xs" mt="xs">
                {selectedClass.skill_proficiency_choice.options.map((option) => (
                  <Checkbox
                    key={option}
                    label={option}
                    checked={skillChoices.includes(option)}
                    onChange={() => toggleSkillChoice(option)}
                  />
                ))}
              </Stack>
            </div>
          ) : null}

          {selectedClass.knowledge_proficiency_choice && selectedClass.knowledge_proficiency_choice.count > 0 ? (
            <div>
              <Text size="sm" fw={600}>
                {`Conhecimentos — escolha ${selectedClass.knowledge_proficiency_choice.count}`}
              </Text>

              <Stack gap="xs" mt="xs">
                {selectedClass.knowledge_proficiency_choice.options.map((option) => (
                  <Checkbox
                    key={option}
                    label={option}
                    checked={knowledgeChoices.includes(option)}
                    onChange={() => toggleKnowledgeChoice(option)}
                  />
                ))}
              </Stack>
            </div>
          ) : null}

          {selectedClass.equipment_choice ? (
            <div>
              <Text size="sm" fw={600}>
                Equipamento inicial
              </Text>

              <Radio.Group value={equipmentLabel} onChange={setEquipmentLabel} mt="xs">
                <Stack gap="xs">
                  {selectedClass.equipment_choice.options.map((option) => (
                    <Radio
                      key={option.label}
                      value={option.label}
                      label={`${option.label}: ${option.description}`}
                    />
                  ))}
                </Stack>
              </Radio.Group>
            </div>
          ) : null}

          <Group justify="space-between">
            <Button variant="subtle" color="gray" size="xs" onClick={() => setStep('class')}>
              Voltar
            </Button>

            <Button disabled={!classChoicesValid()} onClick={() => setStep('origin')}>
              Continuar
            </Button>
          </Group>
        </Stack>
      ) : null}

      {!anyLoading && step === 'origin' ? (
        <Stack gap="md">
          {!selectedOrigin ? (
            <>
              <Text size="sm" c="dimmed">
                Escolha a Origem do personagem.
              </Text>

              <SimpleGrid cols={2}>
                {originsList.map((item) => (
                  <Card
                    key={item.id}
                    padding="sm"
                    className="cursor-pointer transition hover:border-primary-400/60"
                    onClick={() => pickOrigin(item)}
                  >
                    <Text fw={600}>
                      {item.name}
                    </Text>
                  </Card>
                ))}
              </SimpleGrid>
            </>
          ) : (
            <>
              <Text fw={700}>
                {selectedOrigin.name}
              </Text>

              <Radio.Group
                label="Bônus de atributo"
                value={originBonusIndex === null ? null : String(originBonusIndex)}
                onChange={(value) => setOriginBonusIndex(Number(value))}
              >
                <Stack gap="xs" mt="xs">
                  {selectedOrigin.attribute_bonus_options.map((option, index) => (
                    <Radio
                      key={index}
                      value={String(index)}
                      label={option.map((bonus) => `+${bonus.amount} ${ATTRIBUTE_LABEL[bonus.attribute as keyof typeof ATTRIBUTE_LABEL]}`).join(', ')}
                    />
                  ))}
                </Stack>
              </Radio.Group>

              {selectedOrigin.proficiency_choice ? (
                <Radio.Group
                  label="Perícia"
                  value={originProficiency}
                  onChange={setOriginProficiency}
                >
                  <Stack gap="xs" mt="xs">
                    {selectedOrigin.proficiency_choice.options.map((option) => (
                      <Radio key={option} value={option} label={option} />
                    ))}
                  </Stack>
                </Radio.Group>
              ) : null}
            </>
          )}

          <Group justify="space-between">
            <Button
              variant="subtle"
              color="gray"
              size="xs"
              onClick={() => (selectedOrigin ? setOriginId(null) : setStep(selectedClass?.skill_proficiency_choice || selectedClass?.knowledge_proficiency_choice?.count || selectedClass?.equipment_choice ? 'classChoices' : 'class'))}
            >
              Voltar
            </Button>

            {selectedOrigin ? (
              <Button disabled={!originValid()} onClick={() => setStep('review')}>
                Continuar
              </Button>
            ) : null}
          </Group>
        </Stack>
      ) : null}

      {!anyLoading && step === 'review' && selectedClass && selectedSpecies && selectedOrigin && finalAttributes ? (
        <Stack gap="md">
          <TextInput
            label="Nome"
            placeholder="Ex: Kaelen, o Guardião"
            required
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
          />

          <ImageUploadInput value={imageUrl} onChange={setImageUrl} />

          <Divider label="Resumo" labelPosition="left" />

          <Text size="sm">
            {`${selectedSpecies.name} · ${selectedClass.name} · ${selectedOrigin.name}`}
          </Text>

          <SimpleGrid cols={4}>
            {ATTRIBUTE_ORDER.map((attribute) => (
              <div key={attribute}>
                <Text size="xs" c="dimmed">
                  {ATTRIBUTE_LABEL[attribute]}
                </Text>

                <Text fw={700}>
                  {finalAttributes[attribute] >= 0 ? `+${finalAttributes[attribute]}` : finalAttributes[attribute]}
                </Text>
              </div>
            ))}
          </SimpleGrid>

          <Text size="sm">
            {`Vida máxima: ${selectedClass.hp_base}${selectedClass.mana_base > 0 ? ` · Mana máxima: ${selectedClass.mana_base}` : ''}`}
          </Text>

          {selectedClass.extra_resources.length > 0 ? (
            <div>
              <Text size="sm" fw={600}>
                Recursos da Classe
              </Text>

              <Stack gap={4} mt="xs">
                {selectedClass.extra_resources.map((resource) => (
                  <Text key={resource.label} size="sm" c="dimmed">
                    {`${resource.label}: ${resource.value}`}
                  </Text>
                ))}
              </Stack>
            </div>
          ) : null}

          <Group justify="space-between">
            <Button variant="subtle" color="gray" size="xs" onClick={() => setStep('origin')}>
              Voltar
            </Button>

            <Button
              loading={createMutation.isPending}
              disabled={!name.trim()}
              onClick={() => createMutation.mutate()}
            >
              Criar Personagem
            </Button>
          </Group>
        </Stack>
      ) : null}
    </Modal>
  );
}
```

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit
```

Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add resources/character/components/CharacterWizard.tsx
git commit -m "feat: CharacterWizard — wizard genérico de criação de Personagem"
```

---

## Task 8: Ligar o Wizard ao `AddCharacterMenu` / Tela do Mestre

**Files:**
- Modify: `app/mesa/[code]/mestre/page.tsx`

**Interfaces:**
- Consumes: `CharacterWizard` (Task 7), `AddCharacterMenu` (já existe — `onCreateNew`), `useSaveCharacterTemplateLogicData`/`SaveCharacterTemplatePrompt` (já existem).

- [ ] **Step 1: Trocar o formulário simples pelo wizard no fluxo "Personagem"**

No `app/mesa/[code]/mestre/page.tsx`, adicione o import:

```ts
import { CharacterWizard } from '@/resources/character/components/CharacterWizard';
```

Troque a prop `onCreateNew` do `<AddCharacterMenu>` — hoje ela chama `openCreate()` (que abre `CreateCharacterLogicComponent`, o formulário simples) quando `kind === ECharacterKind.CHARACTER`. Substitua por abrir o wizard:

```tsx
        <AddCharacterMenu
          onCreateNew={(kind) => (kind === ECharacterKind.NPC ? openCreateNpc() : setWizardOpened(true))}
          onUseSaved={(kind) => setTemplatePickerKind(kind)}
        />
```

Adicione o state novo perto dos outros `useState` de modal:

```ts
  const [wizardOpened, setWizardOpened] = useState(false);
```

Remova (ou deixe sem uso — mas prefira remover para não confundir) o botão/fluxo antigo de `openCreate`/`creating`/`CreateCharacterLogicComponent` relacionado à criação de **Personagem** — **mantenha** tudo relacionado a NPC (`creatingNpc`, `CreateNpcLogicComponent`) intacto, o formulário simples de NPC não muda.

Substitua o bloco `<CreateCharacterLogicComponent ... />` por:

```tsx
      <CharacterWizard
        code={code}
        opened={wizardOpened}
        onCancel={() => setWizardOpened(false)}
        onCreated={(character) => {
          setWizardOpened(false);
          offerSaveTemplate(
            { name: character.name, image_url: character.image_url, hp_max: character.hp_max, has_mana: character.has_mana, mana_max: character.mana_max } as any,
            ECharacterKind.CHARACTER,
          );
        }}
      />
```

Como `offerSaveTemplate` (já existe no arquivo, ver Task de "Personagens Salvos" anterior) espera um `ICharacterMaster` completo mas só usa `name`/`image_url`/`hp_max`/`has_mana`/`mana_max`, o cast `as any` é aceitável aqui (mesmo padrão pragmático já usado no arquivo) — **alternativa mais limpa**, se preferir: ajuste a assinatura de `offerSaveTemplate` para aceitar só esses 5 campos em vez de `ICharacterMaster` inteiro (`Pick<ICharacterMaster, 'name' | 'image_url' | 'hp_max' | 'has_mana' | 'mana_max'>`), já que é isso que ela sempre usou.

Remova as variáveis/hooks que ficaram sem uso (`creating`, `createCharacterLogicData`, `openCreate`) — rode `npx tsc --noEmit` e `npm run lint` depois pra confirmar que nada ficou pendurado.

- [ ] **Step 2: Verificar tipos e lint**

```bash
npx tsc --noEmit
npm run lint
```

Expected: zero erros; nenhum warning novo além dos 4 pré-existentes documentados em `.claude/rules/table-concept.md`.

- [ ] **Step 3: Verificar manualmente no navegador**

Com `next dev` rodando em `localhost:3002`:
1. Abra `/mesas`, entre numa mesa como Mestre.
2. Clique "Adicionar" → "Personagem" → "Criar novo".
3. Percorra o wizard (Espécie → Classe → Escolhas → Origem → Revisão) até criar.
4. Confirme que o personagem aparece no tabuleiro com a vida/mana corretas da classe escolhida.
5. Confirme que o prompt "Salvar para reutilização futura?" aparece no final, igual já acontecia antes.

- [ ] **Step 4: Commit**

```bash
git add app/mesa/[code]/mestre/page.tsx
git commit -m "feat: liga o CharacterWizard ao fluxo 'Adicionar > Personagem > Criar novo'"
```

---

## Task 9: Ficha — seção "Regras" read-only em `CharacterEditPanel`

**Files:**
- Modify: `resources/character/components/CharacterEditPanel.tsx`
- Create: `resources/character/services/getClasses.ts` já existe (Task 4) — reusado aqui via `useQuery`.

**Interfaces:**
- Consumes: `class_id`/`species_id`/`origin_id`/`level`/`attributes` de `ICharacterMaster` (Task 2/5), `getClassesService`/`getSpeciesService`/`getOriginsService` (Task 4).

- [ ] **Step 1: Adicionar a seção "Regras" ao final de `CharacterEditPanel.tsx`**

O painel recebe `state: ICharacterFormState` — esse tipo (definido no mesmo arquivo) **não** carrega `class_id`/etc. (são read-only, nunca editáveis por este painel). Passe-os como uma prop nova e opcional, só para exibição:

Adicione ao `CharacterEditPanelProps` (perto do final da lista de props):

```ts
  classId?: number | null;
  speciesId?: number | null;
  originId?: number | null;
  attributes?: import('../models/RulesContent').ICharacterAttributes | null;
```

No corpo do componente, logo antes do `<Group justify="space-between" mt="sm">` final (os botões de ação), adicione:

```tsx
        {classId ? (
          <>
            <Divider label="Regras (Contos e Cantos de Vilgard)" labelPosition="left" />

            <CharacterRulesSummary
              classId={classId}
              speciesId={speciesId ?? null}
              originId={originId ?? null}
              attributes={attributes ?? null}
            />
          </>
        ) : null}
```

- [ ] **Step 2: Criar o subcomponente `CharacterRulesSummary` no mesmo arquivo** (antes de `export function CharacterEditPanel`)

```tsx
import { useQuery } from '@tanstack/react-query';
import { SimpleGrid } from '@mantine/core';
import { getClassesService, GET_CLASSES_KEY } from '../services/getClasses';
import { getSpeciesService, GET_SPECIES_KEY } from '../services/getSpecies';
import { getOriginsService, GET_ORIGINS_KEY } from '../services/getOrigins';
import { ATTRIBUTE_ORDER, ATTRIBUTE_LABEL } from '../enums/Attribute';
import type { ICharacterAttributes } from '../models/RulesContent';

function CharacterRulesSummary({
  classId,
  speciesId,
  originId,
  attributes,
}: {
  classId: number;
  speciesId: number | null;
  originId: number | null;
  attributes: ICharacterAttributes | null;
}) {
  const { data: classesData } = useQuery({ queryKey: GET_CLASSES_KEY, queryFn: getClassesService });
  const { data: speciesData } = useQuery({ queryKey: GET_SPECIES_KEY, queryFn: getSpeciesService });
  const { data: originsData } = useQuery({ queryKey: GET_ORIGINS_KEY, queryFn: getOriginsService });

  const classItem = classesData?.data.find((item) => item.id === classId) ?? null;
  const speciesItem = speciesData?.data.find((item) => item.id === speciesId) ?? null;
  const originItem = originsData?.data.find((item) => item.id === originId) ?? null;

  return (
    <Stack gap="sm">
      <Text size="sm">
        {`${speciesItem?.name ?? '—'} · ${classItem?.name ?? '—'} · ${originItem?.name ?? '—'}`}
      </Text>

      {attributes ? (
        <SimpleGrid cols={4}>
          {ATTRIBUTE_ORDER.map((attribute) => (
            <div key={attribute}>
              <Text size="xs" c="dimmed">
                {ATTRIBUTE_LABEL[attribute]}
              </Text>

              <Text fw={700}>
                {attributes[attribute] >= 0 ? `+${attributes[attribute]}` : attributes[attribute]}
              </Text>
            </div>
          ))}
        </SimpleGrid>
      ) : null}

      {classItem && classItem.extra_resources.length > 0 ? (
        <Stack gap={4}>
          {classItem.extra_resources.map((resource) => (
            <Text key={resource.label} size="sm" c="dimmed">
              {`${resource.label}: ${resource.value}`}
            </Text>
          ))}
        </Stack>
      ) : null}
    </Stack>
  );
}
```

`Stack`/`Text` já estão importados no topo do arquivo (usados pelo resto do painel) — só adicione `SimpleGrid` ao import existente de `@mantine/core`.

- [ ] **Step 3: Passar as props novas de onde `CharacterEditPanel` é usado**

O painel de edição só recebe `ICharacterFormState` (sem `class_id`/etc. — esses campos nunca são editáveis por ele) — o objeto `ICharacterMaster` original de quem está sendo editado vive em `editingCharacter`, um `useState` que já existe em `app/mesa/[code]/mestre/page.tsx:108`. Precisa passar por essa cadeia: `mestre/page.tsx` → `UpdateCharacterLogicComponent` → `CharacterEditPanel`.

Em `resources/character/logics/UpdateCharacter.tsx`, adicione `character` aos props de `UpdateCharacterLogicComponent`:

```tsx
export function UpdateCharacterLogicComponent({
  logicData,
  character,
  opened,
  onCancel,
  onDelete,
}: {
  logicData: ReturnType<typeof useUpdateCharacterLogicData>;
  character: ICharacterMaster | null;
  opened: boolean;
  onCancel: () => void;
  onDelete?: () => void;
}) {
```

Adicione o import no topo do arquivo: `import type { ICharacterMaster } from '../models/Character';`

No `<CharacterEditPanel ... />` renderizado dentro deste componente, adicione:

```tsx
      classId={character?.class_id ?? null}
      speciesId={character?.species_id ?? null}
      originId={character?.origin_id ?? null}
      attributes={character?.attributes ?? null}
```

Em `app/mesa/[code]/mestre/page.tsx`, no `<UpdateCharacterLogicComponent ... />` (linha ~436), adicione a prop nova:

```tsx
      <UpdateCharacterLogicComponent
        logicData={updateCharacterLogicData}
        character={editingCharacter}
        opened={!!editingCharacter}
        onCancel={() => setEditingCharacter(null)}
        onDelete={openDeleteFromEdit}
      />
```

`CreateCharacterLogicComponent` (usado só por NPC a partir da Task 8) não precisa dessas props — personagem novo nunca tem classe ainda.

- [ ] **Step 4: Verificar tipos**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Verificar no navegador**

Abra a ficha de um personagem criado pelo wizard (Task 8) na Tela do Mestre → "Editar ficha completa" → confirme que a seção "Regras" aparece com Espécie/Classe/Origem, os 7 atributos e os recursos da classe. Abra a ficha de um personagem antigo (criado antes desta etapa, sem `class_id`) → confirme que a seção **não** aparece (sem erro).

- [ ] **Step 6: Commit**

```bash
git add resources/character/components/CharacterEditPanel.tsx resources/character/logics/UpdateCharacter.tsx app/mesa/[code]/mestre/page.tsx
git commit -m "feat: seção Regras (read-only) na ficha do personagem"
```

---

## Task 10: Verificação final

- [ ] **Step 1: `npx tsc --noEmit`** — zero erros.
- [ ] **Step 2: `npm run lint`** — mesmos 4 warnings pré-existentes (`locales/pt-br.ts`, `tailwind.config.mjs`, 2× `no-img-element`), zero novos.
- [ ] **Step 3: Confirmar payload da Exibição não vaza os dados novos**

```bash
curl -s "http://localhost:3002/api/tables/CODE_DE_UMA_MESA_COM_PERSONAGEM_DO_WIZARD?view=display" | grep -oE '"class_id"|"attributes"|"level"'
```

Expected: nenhuma ocorrência (comando não imprime nada).

- [ ] **Step 4: Fluxo completo end-to-end no navegador** — criar mesa → Adicionar → Personagem → Criar novo (percorrer o wizard completo, testando uma classe com todas as escolhas como Cavaleiro e uma sem nenhuma escolha extra como Druida) → confirmar ficha → salvar como template → editar a ficha e ver a seção Regras → abrir Exibição e confirmar que a carta aparece normal (sem quebra visual).
- [ ] **Step 5: Atualizar `.claude/rules/table-concept.md`** com um parágrafo resumindo esta etapa (seguindo o padrão do histórico já existente no arquivo — ver as seções anteriores como modelo).
- [ ] **Step 6: Commit final**

```bash
git add .claude/rules/table-concept.md
git commit -m "docs: registra a etapa do wizard de criação de personagem em table-concept.md"
```
