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
