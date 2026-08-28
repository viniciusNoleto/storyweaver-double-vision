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
  icon: string | null;
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
  icon: string | null;
  description: string;
  attribute_bonuses: IAttributeBonus[];
  racial_abilities: IRacialAbility[];
}

export interface IToolChoice {
  count: number;
  tool_ids: number[];
}

// Espelha db/schema/tools.ts.
export interface ITool {
  id: number;
  name: string;
  price: string;
  attribute: `${EAttribute}`;
  description: string;
}

// Espelha db/schema/origins.ts.
export interface IOrigin {
  id: number;
  name: string;
  icon: string | null;
  description: string;
  attribute_bonus_options: IAttributeBonus[][];
  granted_proficiency: string | null;
  proficiency_choice: { options: string[] } | null;
  // Escolha de Ferramenta — referencia IDs reais de `tools`, nunca texto
  // solto (ver .claude/rules/table-concept.md).
  tool_choice: IToolChoice | null;
  starting_items: string;
  starting_money: string;
  is_custom: boolean;
}

// Record<EAttribute, number> — resultado final salvo no personagem.
export type ICharacterAttributes = Record<`${EAttribute}`, number>;

export type TSpellCycle = 'truque' | '1' | '2';

// Espelha db/schema/spells.ts.
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

// Resultado de GET /api/spells?class_id= — a magia junto do ciclo em que
// aquela classe específica a conjura (a mesma ISpell pode ter ciclos
// diferentes para classes diferentes, por isso o ciclo não vive em ISpell).
export interface IClassSpell {
  spell: ISpell;
  cycle: TSpellCycle;
}
