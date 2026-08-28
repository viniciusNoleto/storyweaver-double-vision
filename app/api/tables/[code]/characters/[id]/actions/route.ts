import { db } from '@/libs/db';
import { tables, characters } from '@/db/schema';
import { getCurrentMaster } from '@/libs/tableAuth';
import { publish } from '@/libs/realtime';
import type { ICharacterMaster } from '@/resources/character/models/Character';
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
    zone_id: c.zone_id,
    hp_current: c.hp_current,
    hp_max: c.hp_max,
    stats: c.stats as Record<string, number>,
    status_effects: c.status_effects as EStatusEffect[],
    visible: c.visible,
    has_mana: c.has_mana,
    mana_current: c.mana_current,
    mana_max: c.mana_max,
    created_at: c.created_at ? c.created_at.toISOString() : null,
    updated_at: c.updated_at ? c.updated_at.toISOString() : null,
  };
}

// Aplica dano/cura (hp) ou gasto/restauração de mana a um personagem. Só o
// Mestre pode. `hp_current` sempre clampado entre 0 e hp_max; `mana_current`
// sempre clampado entre 0 e mana_max — ações de mana exigem
// `character.has_mana === true` (422 caso contrário). Publica um evento
// realtime COM payload (`character-action`) para a Tela de Exibição animar a
// mudança, em vez de só refazer o fetch como o `state-changed` sem payload.
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

    const validTypes = ['damage', 'heal', 'mana-spend', 'mana-restore'];

    if (!validTypes.includes(type) || typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({
        success: false,
        message: {
          'pt-br': 'Informe um tipo de ação ("damage", "heal", "mana-spend" ou "mana-restore") e um valor maior que zero.',
          'es-mx': 'Ingresa un tipo de acción ("damage", "heal", "mana-spend" o "mana-restore") y un valor mayor que cero.',
          'en-us': 'Provide an action type ("damage", "heal", "mana-spend" or "mana-restore") and an amount greater than zero.',
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
    } else {
      const delta = type === 'damage' ? -amount : amount;

      updates.hp_current = clamp(character.hp_current + delta, 0, character.hp_max);
    }

    const [updated] = await db
      .update(characters)
      .set(updates)
      .where(eq(characters.id, characterId))
      .returning();

    publish(`table:${tableCode}`, {
      type: 'character-action',
      data: {
        character_id: updated.id,
        action: type,
        amount,
        hp_current: updated.hp_current,
        hp_max: updated.hp_max,
        // Sempre presentes no payload do evento, independente do tipo de
        // ação — simplifica quem consome (não precisa checar `action` antes
        // de ler mana_current/mana_max). Ver `.claude/rules/table-concept.md`.
        mana_current: updated.mana_current,
        mana_max: updated.mana_max,
      },
    });

    const messages: Record<string, { 'pt-br': string; 'es-mx': string; 'en-us': string }> = {
      damage: { 'pt-br': 'Dano aplicado com sucesso.', 'es-mx': 'Daño aplicado con éxito.', 'en-us': 'Damage applied successfully.' },
      heal: { 'pt-br': 'Cura aplicada com sucesso.', 'es-mx': 'Curación aplicada con éxito.', 'en-us': 'Heal applied successfully.' },
      'mana-spend': { 'pt-br': 'Mana gasta com sucesso.', 'es-mx': 'Maná gastado con éxito.', 'en-us': 'Mana spent successfully.' },
      'mana-restore': { 'pt-br': 'Mana restaurada com sucesso.', 'es-mx': 'Maná restaurado con éxito.', 'en-us': 'Mana restored successfully.' },
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
