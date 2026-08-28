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
