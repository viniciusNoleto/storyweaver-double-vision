import type { EStatusEffect } from '../enums/StatusEffect';
import type { ICharacterAttributes } from './RulesContent';

// Ver `.claude/rules/table-concept.md` seção 3 ("Redação de privacidade") e
// seção 6 (decisão registrada) para o porquê de existirem DOIS formatos.
//
// `GET /api/tables/[code]` é a única rota de snapshot e decide, no servidor,
// qual formato devolver por personagem, a partir do papel resolvido via cookie
// (`libs/tableAuth.ts`):
// - Mestre → `ICharacterMaster` (números reais: hp_current/hp_max).
// - Exibição (sem cookie de Mestre válido) → `ICharacterDisplay` (hp_color já
//   calculado no servidor via `HealthColor.ts`; NUNCA hp_current/hp_max).
//
// Decisão: duas interfaces nomeadas, sem união discriminada. Não existe um campo
// "view"/"kind" no payload da API — o consumidor (Tela do Mestre vs. Tela de
// Exibição) já sabe qual formato está pedindo porque é uma página diferente,
// então uma união discriminada adicionaria um campo sintético que a API nunca
// envia de fato. Cada página deve importar apenas a interface correspondente.

interface ICharacterBase {
  id: number;
  table_id: number;
  name: string;
  image_url: string | null;
  // Divisão/zona do tabuleiro em que o personagem está (substitui o antigo
  // position_x/position_y de posicionamento livre). Seguro em ambos os
  // formatos — não é um número de jogo (hp), é só a organização visual
  // das fichas. Ver `.claude/rules/table-concept.md`.
  zone_id: number;
  // Estados fixos (atordoado/envenenado/preso/sangrando — ver
  // `resources/character/enums/StatusEffect.ts`). Representados só pelo slug,
  // sem número — o ícone/animação de cada um vem de
  // `StatusEffectVisual.ts`/`StatusEffectBadge.tsx`. Por isso é seguro em
  // ambos os formatos (Mestre e Exibição).
  status_effects: EStatusEffect[];
  created_at: string | null;
  updated_at: string | null;
}

// Mana — EXCEÇÃO DELIBERADA à regra geral de "nenhum número de jogo na
// Exibição" (seção 2 de `.claude/rules/table-concept.md`). Decisão tomada
// com o usuário nesta sessão: ao contrário de hp_current/hp_max (que
// continuam PROIBIDOS na Exibição, sem exceção), mana é pensada para ser
// vista pelos jogadores no telão — os cristais de mana
// (`ManaCrystals.tsx`) são um elemento público da ficha, não uma informação
// que o Mestre precisa esconder. Por isso `has_mana`/`mana_current`/
// `mana_max` aparecem como números CRUS nos DOIS formatos abaixo
// (`ICharacterMaster` e `ICharacterDisplay`), diferente de `is_defeated`
// (que é derivado) e diferente de hp (que nunca aparece). Não
// confunda esta exceção com a regra geral — ela vale SÓ para estes 3 campos.
interface ICharacterMana {
  has_mana: boolean;
  mana_current: number;
  mana_max: number;
}

// Visão do Mestre — inclui todos os números de jogo e a flag de visibilidade.
export interface ICharacterMaster extends ICharacterBase, ICharacterMana {
  hp_current: number;
  hp_max: number;
  // Vida extra — bônus separado da vida normal (ver comentário em
  // `db/schema/characters.ts`). Dano é sempre abatido daqui primeiro. Assim
  // como hp_current/hp_max, NUNCA aparece em `ICharacterDisplay` — só entra
  // (já embutido) no `hp_color`/`is_defeated` calculados no servidor.
  extra_hp: number;
  visible: boolean;
  class_id: number | null;
  species_id: number | null;
  origin_id: number | null;
  level: number;
  attributes: ICharacterAttributes | null;
}

// Visão de Exibição — NUNCA inclua hp_current/hp_max aqui, nem em campos
// ocultos/data-*/comentários (ver regra de produto em table-concept.md seção 2).
// Personagens com `visible: false` simplesmente não aparecem nesta lista — por
// isso não há campo `visible` neste formato. `has_mana`/`mana_current`/
// `mana_max` (via `ICharacterMana`) SÃO permitidos aqui — ver comentário acima.
export interface ICharacterDisplay extends ICharacterBase, ICharacterMana {
  hp_color: string;
  // `is_defeated` é um booleano DERIVADO no servidor (`hp_current <= 0`) — não
  // é um número de jogo, é o mesmo tipo de dado já permitido que `hp_color`
  // (também calculado a partir de hp_current/hp_max, mas nunca expõe os
  // valores brutos). Por isso não viola a regra de "nenhum número de jogo na
  // Exibição" da seção 2 de table-concept.md. `ICharacterMaster` não precisa
  // deste campo — o Mestre já tem hp_current puro e pode calcular sozinho.
  is_defeated: boolean;
}
