import { db } from '@/libs/db';
import { tables, characters } from '@/db/schema';
import { getCurrentMaster } from '@/libs/tableAuth';
import { publish } from '@/libs/realtime';
import type { ICharacterMaster } from '@/resources/character/models/Character';
import type { ICharacterAttributes } from '@/resources/character/models/RulesContent';
import type { ECharacterType } from '@/resources/character/enums/CharacterType';
import type { EStatusEffect } from '@/resources/character/enums/StatusEffect';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function toCharacterMaster(c: typeof characters.$inferSelect): ICharacterMaster {
  return {
    id: c.id,
    table_id: c.table_id,
    name: c.name,
    image_url: c.image_url,
    type: c.type as `${ECharacterType}`,
    position_x: c.position_x,
    position_y: c.position_y,
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

// Aplica dano/cura (hp), gasto/restauração de mana, ou adição/remoção de
// vida extra a um personagem. Só o Mestre pode. `hp_current` sempre clampado
// entre 0 e hp_max; `mana_current` sempre clampado entre 0 e mana_max — ações
// de mana exigem `character.has_mana === true` (422 caso contrário).
// `extra_hp` nunca vai abaixo de 0, sem teto superior (ver comentário em
// `db/schema/characters.ts`). `damage` abate primeiro de `extra_hp` — só o
// que sobrar (se sobrar) desconta de `hp_current` (regra de produto pedida
// pelo usuário). Publica um evento realtime COM payload (`character-action`)
// para a Tela de Exibição animar a mudança, em vez de só refazer o fetch como
// o `state-changed` sem payload.
export async function POST(request: Request, { params }: { params: Promise<{ code: string; id: string }> }) {
  try {
    const { code, id } = await params;
    const tableCode = code.toUpperCase();
    const characterId = Number(id);

    const [table] = await db.select({ id: tables.id }).from(tables).where(eq(tables.code, tableCode));

    if (!table) {
      return NextResponse.json({ success: false, message: { 'pt-br': 'Mesa não encontrada.', 'es-mx': 'Mesa no encontrada.', 'en-us': 'Table not found.' }, data: null }, { status: 404 });
    }

    const isMaster = await getCurrentMaster(tableCode, table.id);

    if (!isMaster) {
      return NextResponse.json({ success: false, message: { 'pt-br': 'Apenas o Mestre pode fazer isso.', 'es-mx': 'Solo el Máster puede hacer esto.', 'en-us': 'Only the Master can do this.' }, data: null }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const type = body?.type;
    const amount = body?.amount;

    const validTypes = ['damage', 'heal', 'mana-spend', 'mana-restore', 'extra-add', 'extra-remove'];

    if (!validTypes.includes(type) || typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({
        success: false,
        message: {
          'pt-br': 'Informe um tipo de ação ("damage", "heal", "mana-spend", "mana-restore", "extra-add" ou "extra-remove") e um valor maior que zero.',
          'es-mx': 'Ingresa un tipo de acción ("damage", "heal", "mana-spend", "mana-restore", "extra-add" o "extra-remove") y un valor mayor que cero.',
          'en-us': 'Provide an action type ("damage", "heal", "mana-spend", "mana-restore", "extra-add" or "extra-remove") and an amount greater than zero.',
        },
        data: null,
      }, { status: 422 });
    }

    const [character] = await db
      .select()
      .from(characters)
      .where(and(eq(characters.id, characterId), eq(characters.table_id, table.id)));

    if (!character) {
      return NextResponse.json({ success: false, message: { 'pt-br': 'Personagem não encontrado.', 'es-mx': 'Personaje no encontrado.', 'en-us': 'Character not found.' }, data: null }, { status: 404 });
    }

    const isManaAction = type === 'mana-spend' || type === 'mana-restore';

    if (isManaAction && !character.has_mana) {
      return NextResponse.json({
        success: false,
        message: {
          'pt-br': 'Este personagem não tem mana.',
          'es-mx': 'Este personaje no tiene maná.',
          'en-us': 'This character does not have mana.',
        },
        data: null,
      }, { status: 422 });
    }

    const updates: Partial<typeof characters.$inferInsert> = { updated_at: new Date() };

    if (isManaAction) {
      const delta = type === 'mana-spend' ? -amount : amount;

      updates.mana_current = clamp(character.mana_current + delta, 0, character.mana_max);
    } else if (type === 'extra-add') {
      updates.extra_hp = character.extra_hp + amount;
    } else if (type === 'extra-remove') {
      updates.extra_hp = Math.max(character.extra_hp - amount, 0);
    } else if (type === 'damage') {
      // Dano abate primeiro de `extra_hp` — só o excedente (se houver)
      // desconta de `hp_current`. Regra de produto pedida pelo usuário.
      const extraAbsorbed = Math.min(character.extra_hp, amount);
      const remainingDamage = amount - extraAbsorbed;

      updates.extra_hp = character.extra_hp - extraAbsorbed;
      updates.hp_current = clamp(character.hp_current - remainingDamage, 0, character.hp_max);
    } else {
      updates.hp_current = clamp(character.hp_current + amount, 0, character.hp_max);
    }

    const [updated] = await db
      .update(characters)
      .set(updates)
      .where(eq(characters.id, characterId))
      .returning();

    // Payload do evento SSE narrado para só `character_id`/`action` — este
    // canal (`table:${code}`) não exige autenticação para abrir (ver
    // `app/api/tables/[code]/stream/route.ts`), então nenhum número de jogo
    // (hp/mana/extra_hp) deve trafegar por aqui. Quem precisa dos números
    // reais já os busca via `GET /api/tables/[code]` (que sim exige o cookie
    // de Mestre para devolver o formato completo).
    publish(`table:${tableCode}`, {
      type: 'character-action',
      data: {
        character_id: updated.id,
        action: type,
      },
    });

    const messages: Record<string, { 'pt-br': string; 'es-mx': string; 'en-us': string }> = {
      damage: { 'pt-br': 'Dano aplicado com sucesso.', 'es-mx': 'Daño aplicado con éxito.', 'en-us': 'Damage applied successfully.' },
      heal: { 'pt-br': 'Cura aplicada com sucesso.', 'es-mx': 'Curación aplicada con éxito.', 'en-us': 'Heal applied successfully.' },
      'mana-spend': { 'pt-br': 'Mana gasta com sucesso.', 'es-mx': 'Maná gastado con éxito.', 'en-us': 'Mana spent successfully.' },
      'mana-restore': { 'pt-br': 'Mana restaurada com sucesso.', 'es-mx': 'Maná restaurado con éxito.', 'en-us': 'Mana restored successfully.' },
      'extra-add': { 'pt-br': 'Vida extra adicionada com sucesso.', 'es-mx': 'Vida extra añadida con éxito.', 'en-us': 'Extra HP added successfully.' },
      'extra-remove': { 'pt-br': 'Vida extra removida com sucesso.', 'es-mx': 'Vida extra eliminada con éxito.', 'en-us': 'Extra HP removed successfully.' },
    };

    return NextResponse.json({
      success: true,
      message: messages[type],
      data: toCharacterMaster(updated),
    });
  } catch (e) {
    console.error(e);

    return NextResponse.json({ success: false, message: { 'pt-br': 'Erro ao aplicar a ação.', 'es-mx': 'Error al aplicar la acción.', 'en-us': 'Error applying action.' }, data: null }, { status: 500 });
  }
}
