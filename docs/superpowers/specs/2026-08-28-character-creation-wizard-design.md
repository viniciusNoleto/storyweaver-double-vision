# Wizard de Criação de Personagem — Contos e Cantos de Vilgard

## Contexto e motivação

Hoje a criação de personagem na Tela do Mestre é um formulário simples e livre (`CharacterEditPanel.tsx`): nome, imagem, vida, mana, condições. O usuário pediu para substituir isso, quando o Mestre clicar em "Criar novo" um Personagem (não NPC — NPC continua com o formulário reduzido), por um **wizard interativo** que guia a criação seguindo as regras do manual próprio do sistema, *Contos e Cantos de Vilgard* (arquivo `Contos e Cantos de Vilgard.pdf` na raiz do projeto): escolher Espécie, Classe e Origem, com atributos/vida/mana calculados automaticamente a partir dessas escolhas.

Requisito explícito do usuário, levantado durante o brainstorming: **nada disso pode ser hardcoded**. Classes, Espécies e Origens devem ser entidades reais do sistema, guardadas no banco de dados — não switch/if por classe espalhado no código do wizard. O wizard deve ser um motor **genérico**, que lê a definição de cada Classe/Espécie/Origem do banco e monta as perguntas dinamicamente a partir dela. Adicionar uma classe nova no futuro deve significar "inserir uma linha no banco", nunca "escrever código novo".

Este projeto foi decomposto (ver `.claude/rules/table-concept.md`) em 5 partes; as partes 1 e 2 (upload de imagem, Personagens Salvos) já foram entregues. **Este spec cobre a parte 3**: o wizard em si, com Espécie + Classe + Origem e cálculo automático no nível 1.

## Escopo desta etapa

**Dentro do escopo:**
- Tabelas novas no banco para Classes, Espécies e Origens, com dados extraídos do manual (9 classes, 8 espécies, as 6 "Origens Comuns").
- Wizard multi-etapa que lê essas tabelas e guia a escolha de Espécie → Classe → resolução das escolhas da Classe (perícias/conhecimentos/equipamento) → Origem → revisão final.
- Cálculo automático dos 7 atributos (Força, Destreza, Constituição, Carisma, Inteligência, Sabedoria, Sorte) a partir da soma dos bônus de Classe + Espécie + Origem (baseline confirmado com o usuário: todo atributo começa em **0**).
- Cálculo automático de vida máxima e mana máxima (nível 1) a partir da Classe escolhida.
- Atributos finais, Classe, Espécie, Origem e nível ficam salvos no personagem e visíveis na ficha (seção nova, read-only, dentro de `CharacterEditPanel.tsx`).
- Recursos extras de cada Classe (Fúria, Dado Furtivo, Fera Companheira, Petiscos, etc.) aparecem como **referência/texto** na ficha — sem contador interativo de uso/gasto.
- Personagem criado pelo wizard continua sendo uma linha normal em `characters` — compatível com tudo que já existe (`TableBoard`, `MasterToken`, `DisplayToken`, ações de dano/cura, Personagens Salvos).

**Fora do escopo (adiado para etapas futuras, já concordado com o usuário):**
- Tela de criar/editar Classes/Espécies/Origens pela interface — por enquanto essas fichas só existem via seed no banco; editar exige acesso direto ao banco.
- Criação de Origem customizada pela interface (o manual descreve essa regra, mas fica pra depois).
- Rastreamento/uso ativo dos recursos de Classe (Fúria, Dado Furtivo, etc.) — só aparecem como texto informativo.
- Magias, Invenções e Ferramentas do manual — não entram no wizard nesta etapa.
- Progressão além do nível 1 (o manual só documenta as regras até nível 2 por enquanto; o wizard cria sempre no nível 1).
- NPC continua com o formulário simples de sempre — o wizard é exclusivo do fluxo "Personagem".

## Modelo de dados

### Tabela `classes`

Uma linha por classe (Bárbaro, Caçador, Cavaleiro, Clérigo, Cozinheiro, Druida, Feiticeiro, Ladino, Paladino).

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | serial | |
| `name` | varchar | Nome de exibição |
| `description` | text | Texto de "Sobre a Classe" (flavor, mostrado no wizard) |
| `primary_attributes` | jsonb (`string[]`) | 1 ou 2 atributos primários (Caçador tem 2: mágico e físico) |
| `attribute_bonuses` | jsonb (`{attribute: string, amount: number}[]`) | Bônus fixos de atributo ao escolher a classe |
| `skill_proficiency_choice` | jsonb, nullable | `{ count: number, options: string[] }` — "escolha N perícias de [...]" |
| `knowledge_proficiency_choice` | jsonb, nullable | `{ fixed?: string[], count: number, options: string[] }` — conhecimentos fixos + escolha |
| `equipment_choice` | jsonb, nullable | `{ options: { label: string, description: string }[] }` — "escolha A ou B..." |
| `fixed_equipment` | jsonb, nullable (`string[]`) | Itens que a classe sempre concede, sem escolha |
| `hp_base` | integer | Pontos de Vida no nível 1 (coluna "Pontos de Vida" da tabela de progressão) |
| `mana_base` | integer | Pontos de Mana no nível 1 (0 se a classe não usa mana) |
| `evasion` | integer | "Evasão" no nível 1 |
| `extra_resources` | jsonb (`{label: string, value: string}[]`) | Recursos extras da classe no nível 1 (Fúria, Dado Furtivo, Fera Companheira, Petiscos, Ciclo de magias, etc.) — **só exibidos como referência**, nunca rastreados |

### Tabela `species` (Espécies)

Uma linha por espécie (Anão, Draconato, Elfo, Firbolg, Hobbit, Humano, Orc, Tiefling).

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | serial | |
| `name` | varchar | |
| `description` | text | Texto de "Cultura" |
| `attribute_bonuses` | jsonb (`{attribute: string, amount: number}[]`) | |
| `racial_abilities` | jsonb (`{name: string, description: string}[]`) | Só texto informativo — várias são situacionais ("+1d6 de Esperança em testes de X"), não viram mecânica automática nesta etapa |

### Tabela `origins` (Origens)

Uma linha por origem comum (Filho da Oficina, Criado nas Ruas, Devoto do Altar, Aprendiz de Erudito, Filho do Campo, Artista Itinerante, Sobrevivente de Conflito, Herdeiro de um Nome — 8 no total, o manual lista mais que as 6 que eu tinha visto inicialmente).

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | serial | |
| `name` | varchar | |
| `description` | text | |
| `attribute_bonus_options` | jsonb (`{attribute: string, amount: number}[][]`) | Lista de alternativas — ex: `[[{Destreza, 2}], [{Destreza, 1}, {Inteligência, 1}]]` (o jogador escolhe uma) |
| `proficiency_choice` | jsonb, nullable | `{ options: string[] }` — ex: "Habilidade (blefe ou furtividade)" — sempre 1 escolhida |
| `starting_items` | text | Descrição livre dos itens iniciais |
| `starting_money` | varchar | Ex: "12 cg" |
| `is_custom` | boolean, default false | Reservado para quando a criação de origem customizada existir (fora de escopo agora, mas o campo já evita uma migration futura) |

### Extensão de `characters`

Novas colunas, todas **nullable** (retrocompatíveis — NPCs e personagens antigos continuam sem elas):

| Campo | Tipo | Descrição |
|---|---|---|
| `class_id` | integer, FK → `classes.id`, nullable | |
| `species_id` | integer, FK → `species.id`, nullable | |
| `origin_id` | integer, FK → `origins.id`, nullable | |
| `level` | integer, default 1 | Sempre 1 nesta etapa |
| `attributes` | jsonb, nullable (`{forca, destreza, constituicao, carisma, inteligencia, sabedoria, sorte}`, todos `number`) | Resultado final do wizard |

Personagens criados pelo formulário simples ou por NPC continuam com esses campos `null` — a ficha simplesmente não mostra a seção de regras/atributos quando `class_id` é `null`.

## Fluxo do Wizard

Modal (ou sequência de modais) substituindo `CreateCharacterLogicComponent` quando a origem for "Personagem" no `AddCharacterMenu` (NPC continua indo pro formulário simples de sempre):

1. **Espécie** — grade de cards com as 8 espécies (nome + bônus de atributo resumido). Selecionar mostra as habilidades raciais como texto informativo.
2. **Classe** — grade de cards com as 9 classes (nome + atributo(s) primário(s)). Selecionar mostra "Sobre a Classe" e a Progressão de nível 1.
3. **Escolhas da Classe** — o motor genérico lê `skill_proficiency_choice`, `knowledge_proficiency_choice` e `equipment_choice` da classe escolhida e renderiza só os passos que existirem (checkboxes com limite N, ou radio para equipamento). Classe sem algum desses campos (`null`) pula a etapa correspondente automaticamente.
4. **Origem** — grade de cards com as 8 origens. Selecionar exige resolver `attribute_bonus_options` (radio entre as alternativas) e `proficiency_choice` (se existir).
5. **Revisão** — nome do personagem, upload de foto (reaproveita `ImageUploadInput.tsx`), e um resumo somado automaticamente: os 7 atributos finais, vida máxima, mana máxima (se a classe tiver `mana_base > 0`), e a lista de "Recursos da Classe" (`extra_resources`) como referência. Confirmar cria o personagem (mesmo endpoint `POST /api/tables/[code]/characters`, com os campos novos no body) e — como já existe hoje — pergunta se quer salvar como Personagem Salvo.

## Cálculo

```
para cada atributo:
  final = 0
  + bônus da Classe (attribute_bonuses)
  + bônus da Espécie (attribute_bonuses)
  + bônus da alternativa de Origem escolhida

hp_max = classes.hp_base (da classe escolhida)
has_mana = classes.mana_base > 0
mana_max = classes.mana_base (se has_mana)
```

Nenhum dado (perícia, item, dinheiro inicial) desta etapa afeta o tabuleiro/combate além do que já existe hoje (`hp_max`, `has_mana`, `mana_max`) — o resto fica salvo só como registro na ficha.

## Seed dos dados do manual

Uma migration/seed script transcreve os dados de todas as 9 classes, 8 espécies e 8 origens comuns do PDF pro formato das tabelas acima. Isso é trabalho de transcrição cuidadosa (não de arquitetura) — validado por amostragem contra o PDF antes de finalizar.

## Compatibilidade

- Nenhuma mudança em `ICharacterDisplay`/na Tela de Exibição — atributos, classe, espécie e origem são Mestre-only (mesma regra de privacidade de sempre; nada disso é "número de jogo" que precise aparecer no telão, então fica de fora do payload de Exibição por padrão, a menos que o usuário peça o contrário).
- `TableBoard`, `MasterToken`, `DisplayToken`, ações de dano/cura, drag-and-drop, Personagens Salvos — nada muda; o wizard só afeta a criação inicial via Personagem.
- NPC e o botão "Criar novo" dentro de NPC continuam exatamente como estão.

## Riscos / suposições assinaladas

- **Baseline de atributos = 0** — confirmado com o usuário nesta sessão (sem etapa de distribuição de pontos no manual).
- O manual só documenta progressão até nível 2; o wizard fixa `level = 1` — se o manual ganhar mais níveis no futuro, isso pode precisar de uma revisão.
- `extra_resources` fica genérico (`label`/`value`) de propósito — cada classe tem um conjunto de colunas de progressão diferente na tabela do livro (ex: Bárbaro tem "Força Extra", Ladino tem "Dado Furtivo", Cozinheiro tem "Petiscos"); representar isso como lista de pares chave-valor evita precisar de uma coluna nova no schema pra cada classe.
