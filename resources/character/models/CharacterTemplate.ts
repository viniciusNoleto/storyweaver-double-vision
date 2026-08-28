import type { ECharacterKind } from '../enums/CharacterKind';

// Espelha `character_templates` (ver `db/schema/character_templates.ts`).
export interface ICharacterTemplate {
  id: number;
  kind: `${ECharacterKind}`;
  name: string;
  image_url: string | null;
  hp_max: number;
  has_mana: boolean;
  mana_max: number;
  created_at: string | null;
}
