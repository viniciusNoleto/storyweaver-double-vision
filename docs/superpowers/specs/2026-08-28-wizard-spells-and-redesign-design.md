# Wizard — Magias, Itens dedicados e reestruturação visual (jogo-like)

Data: 2026-08-28
Contexto: sexta melhoria sobre o `CharacterWizard` construído na etapa 11 de `table-concept.md` (ver histórico ali; partes 1-3 desta rodada — Ver detalhes, Origem customizada, Ferramentas — já estão implementadas e commitadas). Este documento cobre a parte 4 (Magias) e a parte 5 (reestruturação visual), tratadas como um único projeto porque o pedido do usuário as amarra: a seção de Magias já nasce no formato novo, evitando retrabalho.

## Objetivo

1. Sistema de Magias real, vindo do banco (nada hardcoded — mesmo princípio da etapa 11): ~60 magias das 5 classes conjuradoras (Caçador, Clérigo, Druida, Feiticeiro, Paladino), com descrição completa do manual.
2. Reestruturar o wizard pra parecer mais com um criador de personagem de RPG de verdade:
   - Ícone (Iconify) em todo card de Espécie/Classe/Origem, em vez de card só com texto.
   - Seção **dedicada** de Itens/Ferramentas (hoje espalhada entre o passo Classe — `equipment_choice` — e o passo Origem — `tool_choice`), com um campo extra de item customizado (texto livre).
   - Seção **dedicada** de Magias (só aparece se a classe escolhida conjura).

## Decisões já confirmadas com o usuário

- Ordem: desenhar a estrutura nova do wizard e já implementar Magias dentro dela (não encaixar Magias na estrutura atual).
- Ícones: coluna `icon` (string Iconify) em `classes`/`species`/`origins`, escolhida no seed — sem upload de imagem.
- Seção de Itens: junta TUDO num só lugar — `equipment_choice` da Classe + `tool_choice` da Origem + um campo novo de item livre/customizado.
- Quantidade de magias conhecidas no nível 1: lida do texto já existente em `extra_resources` (label exato `"Magias conhecidas"`, `value` é a quantidade em string — confirmado via query: Caçador 1, Clérigo 4, Druida 5, Feiticeiro 3, Paladino 1). Não cria coluna numérica nova pra isso.
- Círculos disponíveis na criação: **todos** (Truques + 1º Ciclo + 2º Ciclo), sem restringir por nível — mas **separados visualmente** por círculo na UI (não misturados numa lista única).
- Processo: spec → plano → subagent-driven-development (mesmo fluxo do wizard original).

## Schema novo

```ts
// db/schema/spells.ts
export const spells = pgTable('spells', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  cast_time: varchar('cast_time', { length: 100 }).notNull(),   // "Tempo de Conjuração"
  duration: varchar('duration', { length: 150 }).notNull(),
  restrictions: varchar('restrictions', { length: 100 }).notNull(), // "Restrições" (Fala, Gestos, Materiais)
  range: varchar('range', { length: 100 }).notNull(),            // "Alcance"
  cost: varchar('cost', { length: 20 }).notNull(),               // "Custo" (mana) — texto pra casos como "0"
  description: text('description').notNull(),
});

// db/schema/classSpells.ts — join: mesma magia pode pertencer a mais de uma classe/ciclo
export const classSpells = pgTable('class_spells', {
  id: serial('id').primaryKey(),
  class_id: integer('class_id').notNull().references(() => classes.id),
  spell_id: integer('spell_id').notNull().references(() => spells.id),
  cycle: varchar('cycle', { length: 10 }).notNull(), // 'truque' | '1' | '2'
});
```

`classes`/`species`/`origins` ganham `icon: varchar('icon', { length: 60 })` (nullable — personagens/origens já seedados sem ícone não quebram; backfill via UPDATE idempotente, mesmo padrão de `linkFilhoDaOficinaToolChoice`).

`characters` ganha:
- `known_spell_ids: jsonb('known_spell_ids').default([])` — array de `spell_id`, nullable seria mais correto mas segue o padrão de `status_effects` (array com default `[]`). Mestre-only — **nunca** em `ICharacterDisplay` (mesma regra de `class_id`/`attributes`).
- `custom_items: text('custom_items')` — texto livre do item customizado escrito na seção Itens. Mestre-only, mesmo motivo.

Migration única cobrindo as 3 mudanças (tabelas novas + colunas novas), aplicada com o procedimento manual já estabelecido (`psql` direto + registro de hash em `drizzle.__drizzle_migrations`) se `drizzle-kit migrate` pular de novo.

## Modelos TS

```ts
// resources/character/models/RulesContent.ts (extensão)
export interface ISpell {
  id: number;
  name: string;
  cast_time: string;
  duration: string;
  restrictions: string;
  range: string;
  cost: string;
  description: string;
}

export type TSpellCycle = 'truque' | '1' | '2';

export interface IClassSpell {
  spell: ISpell;
  cycle: TSpellCycle;
}

// IClass, ISpecies, IOrigin ganham icon: string | null
```

`ICharacterMaster` ganha `known_spell_ids: number[]` e `custom_items: string | null`. `ICharacterDisplay` não ganha nenhum dos dois.

## API

- `GET /api/spells?class_id=` (novo, sem checagem de Mestre — conteúdo de sistema, mesmo padrão de `/api/classes`/`/api/tools`): sem `class_id`, devolve o catálogo completo (`ISpell[]`, pro modal "Ver Magias"); com `class_id`, devolve `IClassSpell[]` (spell + cycle) só das magias daquela classe, ordenadas por ciclo então nome.
- Rotas de personagem (`POST/PATCH .../characters(/[id])`) passam a aceitar/persistir `known_spell_ids` e `custom_items`.
- `GET /api/tables/[code]` (snapshot): `toCharacterMaster` inclui os dois campos nos personagens do Mestre; branch de Exibição continua sem eles (checagem por `grep`, mesmo procedimento de verificação de todas as etapas anteriores).

## Seed

`db/seed/seedRules.ts` ganha:
- `seedSpells()`: insere os ~60 registros de `spells` (transcritos das páginas 41-58 do manual) e os registros de `class_spells` (a partir das listas da página 40), idempotente (checa `COUNT(*)` antes de inserir, como as demais).
- `backfillIcons()`: UPDATE idempotente (sempre roda, como `linkFilhoDaOficinaToolChoice`) setando `icon` nas 9 classes/8 espécies/8 origens fixas, usando a tabela de sugestões abaixo. Origens customizadas criadas pelo usuário (`is_custom: true`) ficam sem ícone (`icon: null`) — a UI usa um ícone genérico de fallback (`lucide:sparkles`) quando `icon` é `null`.
- `main()` chama as duas nas etapas apropriadas.

### Sugestão de ícones (Iconify, prefixo `lucide`)

| Classe | Ícone | Espécie | Ícone | Origem | Ícone |
|---|---|---|---|---|---|
| Bárbaro | `lucide:axe` | Anão | `lucide:hammer` | Filho da Oficina | `lucide:wrench` |
| Caçador | `lucide:target` | Draconato | `lucide:flame` | Criado nas Ruas | `lucide:footprints` |
| Cavaleiro | `lucide:shield` | Elfo | `lucide:sparkles` | Devoto do Altar | `lucide:church` |
| Clérigo | `lucide:cross` | Firbolg | `lucide:mountain` | Aprendiz de Erudito | `lucide:book-open` |
| Cozinheiro | `lucide:chef-hat` | Hobbit | `lucide:home` | Filho do Campo | `lucide:wheat` |
| Druida | `lucide:leaf` | Humano | `lucide:user` | Artista Itinerante | `lucide:music` |
| Feiticeiro | `lucide:wand-sparkles` | Orc | `lucide:skull` | Sobrevivente de Conflito | `lucide:sword` |
| Ladino | `lucide:footprints` | Tiefling | `lucide:moon` | Herdeiro de um Nome | `lucide:crown` |
| Paladino | `lucide:shield-plus` | | | | |

O implementador confirma que cada nome existe no set `lucide` do Iconify antes de seedar (trocar por um equivalente próximo se não existir) — não é crítico acertar exatamente estes, são sugestões de partida.

### Mapeamento classe → ciclo → magias (a partir da página 40 do manual)

- **Caçador** — 1º Ciclo: Alarme, Curar Ferimentos, Emaranhar o Caminho, Flecha da Tempestade, Marca da Presa, Vinhas do Ermo. (sem Truques)
- **Clérigo** — Truques: Consertar, Estabilizar, Luz, Orientação, Resistência, Taumaturgia. 1º Ciclo: Bênção, Comando, Criar ou Destruir Água, Curar Ferimentos, Detectar Veneno e Doença, Escudo da Fé, Infligir Ferimentos, Perdição, Purificar Alimentos, Raio Guiador, Santuário. 2º Ciclo: Acalmar Emoções, Ajuda, Augúrio, Cegueira/Surdez, Chama Contínua, Imobilizar Pessoa, Localizar Objeto, Oração Curativa, Proteção contra Veneno, Repouso Tranquilo, Restauração Menor, Silêncio, Vínculo Protetor, Zona da Verdade.
- **Druida** — Truques: Arte Druídica, Chicote de Espinhos, Orientação, Resistência. 1º Ciclo: Amizade Animal, Curar Ferimentos, Emaranhar, Falar com Animais, Forma Aquática I, Forma de Ataque I, Forma Escavadora I, Forma Invasora I, Forma Montada I, Forma Rastreadora I, Forma Voadora I. (sem 2º Ciclo nas páginas lidas)
- **Feiticeiro** — Truques: Ataque Certeiro, Consertar, Globos de Luz, Ilusão Menor, Luz, Mensagem, Mãos Mágicas, Prestidigitação, Proteção contra Lâminas. 1º Ciclo: Armadura Arcana, Compreender Idiomas, Disfarçar-se, Enfeitiçar Pessoa, Escudo Arcano, Espirro Ácido, Imagem Silenciosa, Leque Cromático, Mãos Flamejantes, Névoa Obscurecente, Onda Trovejante, Queda Suave, Raio Adoecente, Raio de Bruxa, Recuo Acelerado, Salto, Sono. 2º Ciclo: Alterar-se, Arrombar, Aumentar/Reduzir, Cegueira/Surdez, Coroa da Loucura, Despedaçar, Detectar Pensamentos, Escuridão, Imobilizar Pessoa, Invisibilidade, Levitação, Lufada de Vento, Nublar, Nuvem de Adagas, Passo Nebuloso, Patas de Aranha, Raio Ardente, Sugestão, Teia, Ver o Invisível, Visão no Escuro.
- **Paladino** — 1º Ciclo: Auxílio Divino, Bênção, Comando, Curar Ferimentos, Destruição Psíquica, Destruição Flamejante, Destruição Trovejante, Detectar Veneno e Doença, Duelo Compelido, Escudo da Fé, Heroísmo, Purificar Alimentos. 2º Ciclo: Ajuda, Arma Mágica, Convocar Montaria, Localizar Objeto, Marca da Punição, Proteção contra Veneno, Restauração Menor, Zona da Verdade.

**Nota de reuso**: várias magias aparecem em mais de uma lista (ex.: "Bênção" em Clérigo e Paladino; "Curar Ferimentos" em Caçador/Clérigo/Druida/Paladino; "Cegueira/Surdez" em Clérigo/Feiticeiro; "Zona da Verdade" em Clérigo/Paladino; "Localizar Objeto"/"Restauração Menor"/"Ajuda"/"Proteção contra Veneno" em Clérigo/Paladino). O catálogo `spells` tem UM registro por nome único (~60 no total, não ~75); `class_spells` é quem faz o N:N pra cada classe+ciclo. O implementador da task de seed deve deduplicar por nome ao inserir o catálogo, e criar uma linha em `class_spells` por (classe, ciclo, magia) mesmo quando a magia já existe no catálogo.

As descrições completas (tempo/duração/restrições/alcance/custo/texto) de cada uma das ~60 magias estão nas páginas 41 a 58 do manual (`Contos e Cantos de Vilgard.pdf`) — o implementador da task de seed deve ler essas páginas via `Read` (múltiplas chamadas de até 20 páginas) e transcrever fielmente. Onde o "Custo" do manual for texto não-numérico (nenhum caso identificado nas páginas lidas, mas por segurança), manter como string.

## Wizard — novo fluxo (6 passos)

1. **Espécie** — grid de cards com ícone (`ISpecies.icon`) + nome; "Ver detalhes" já existe (mantém).
2. **Classe** — grid de cards com ícone; escolhas de perícia/conhecimento (`skill_proficiency_choice`/`knowledge_proficiency_choice`) continuam neste passo (são inerentes à classe escolhida, não "itens").
3. **Origem** — grid de cards com ícone (fallback `lucide:sparkles` quando `icon` é `null`, cobre origens customizadas); bônus de atributo e proficiência de origem continuam aqui; "Criar Origem customizada" mantém como está.
4. **Itens** (novo) — três blocos na mesma tela, cada um só aparece se aplicável:
   - Equipamento da Classe (`equipment_choice`) — Radio.Group, migrado do antigo passo `classChoices` sem mudança de lógica.
   - Ferramenta da Origem (`tool_choice`) — Select, migrado do passo Origem sem mudança de lógica.
   - Item customizado — `Textarea` livre (`custom_items`), sempre visível, opcional.
   - Se a classe não tiver `equipment_choice` E a origem não tiver `tool_choice`, o passo ainda aparece (só com o campo de item customizado) — não pula, porque o campo customizado é sempre uma opção.
5. **Magias** (novo, condicional) — só aparece se `class.extra_resources` tiver um item com `label === 'Magias conhecidas'`. Busca `GET /api/spells?class_id=`:
   - Agrupamento visual por ciclo (Truques / 1º Ciclo / 2º Ciclo), cada grupo com cabeçalho.
   - Cada magia é um card/checkbox com nome + custo; "Ver detalhes" abre a descrição completa (reusa o padrão de modal já existente).
   - Limite: `Number(extra_resources.find(r => r.label === 'Magias conhecidas').value)` magias escolhidas no total, somando todos os ciclos (não por ciclo separado) — contador visível ("3 de 4 escolhidas"), "Continuar" desabilitado até bater a contagem.
6. **Revisão** — mostra também: nomes das magias escolhidas (com custo), item customizado (se preenchido), além do que já existia.

`classHasChoices()` (helper já existente, ver etapa 11) é renomeado/estendido conceitualmente para decidir se o passo Itens tem algo além do campo livre — não bloqueia a navegação de qualquer forma (o passo sempre existe agora).

`createCharacterService` ganha `known_spell_ids?: number[]` e `custom_items?: string` no payload.

## Ficha (CharacterEditPanel / CharacterRulesSummary)

Seção "Regras" (read-only, mesma que já existe) ganha uma lista de magias conhecidas (nome + custo, com o mesmo "Ver detalhes" clicável) e o texto de item customizado, quando presentes — mesmo padrão visual dos `extra_resources` já exibidos.

## Fora de escopo (consciente, não esquecimento)

- Gasto/consumo de mana por magia específica durante o jogo (o sistema de mana já existente — cristais — continua só um contador geral, sem ligar "conjurei Bênção, gastou 1 mana" automaticamente).
- Magias de 3º ciclo em diante / progressão de nível (não existem no material lido; fora do nível 1).
- Invenções/Ferramentas mecânicas do capítulo de Invenções (páginas 60+, não lidas) — não faz parte deste pedido.
- Edição de Classes/Espécies/Origens/Magias pela interface (só seed) — mesma decisão já registrada na etapa 11.
- Efeitos de página inteira (ex.: `Forma Aquática I` do Druida altera deslocamento/forma) não viram lógica de jogo automatizada — só texto de referência na ficha, mesmo tratamento que `extra_resources` já recebe hoje.

## Verificação esperada

Mesmo padrão de todas as etapas anteriores: `npx tsc --noEmit` e `npm run lint` limpos (zero erros novos, mesmos 4 warnings pré-existentes) a cada task; `grep` confirmando que `known_spell_ids`/`custom_items` nunca aparecem no payload `?view=display`; teste manual via `curl` e/ou Playwright real do fluxo completo (criar um Clérigo com magias + item customizado; criar um Bárbaro, confirmando que o passo Magias não aparece).
