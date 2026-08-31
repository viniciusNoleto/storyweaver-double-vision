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

// Abreviação de 3 letras — usada em espaços pequenos (verso da carta), onde o
// nome completo não cabe.
export const ATTRIBUTE_ABBR: Record<EAttribute, string> = {
  [EAttribute.FORCA]: 'FOR',
  [EAttribute.DESTREZA]: 'DES',
  [EAttribute.CONSTITUICAO]: 'CON',
  [EAttribute.CARISMA]: 'CAR',
  [EAttribute.INTELIGENCIA]: 'INT',
  [EAttribute.SABEDORIA]: 'SAB',
  [EAttribute.SORTE]: 'SOR',
};
