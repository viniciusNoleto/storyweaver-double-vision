import { db } from '@/libs/db';
import { tables, characters, tableZones } from '@/db/schema';
import { getCurrentMaster } from '@/libs/tableAuth';
import { publish } from '@/libs/realtime';
import type { ICharacterMaster } from '@/resources/character/models/Character';
import type { ICharacterAttributes } from '@/resources/character/models/RulesContent';
import { EStatusEffect } from '@/resources/character/enums/StatusEffect';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

function toCharacterMaster(c: typeof characters.$inferSelect): ICharacterMaster {
  return {
    id: c.id,
    table_id: c.table_id,
    name: c.name,
    image_url: c.image_url,
    zone_id: c.zone_id,
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

// Filtra `status_effects` recebido do body para manter só strings que sejam
// valores válidos de `EStatusEffect` — ignora silenciosamente entradas
// inválidas em vez de rejeitar a requisição inteira.
function sanitizeStatusEffects(value: unknown): EStatusEffect[] {
  if (!Array.isArray(value)) return [];

  const validValues = Object.values(EStatusEffect) as string[];

  return value.filter((entry): entry is EStatusEffect => typeof entry === 'string' && validValues.includes(entry));
}

// Resolve a Mesa pelo `code` e se a requisição atual pertence ao Mestre dela.
// Usado por PATCH e DELETE abaixo — as duas rotas exigem `isMaster === true`,
// senão negam a mutação sem tocar no banco (ver table-concept.md seção 3).
async function resolveTableAndMaster(tableCode: string) {
  const [table] = await db.select({ id: tables.id }).from(tables).where(eq(tables.code, tableCode));

  if (!table) return { table: null, isMaster: false };

  const isMaster = await getCurrentMaster(tableCode, table.id);

  return { table, isMaster };
}

// Cada chamada gera uma nova Response — nunca reutilize uma instância de
// `NextResponse.json(...)` entre requisições (o corpo é um stream de uso único).
function tableNotFound() {
  return NextResponse.json({ success: false, message: { 'pt-br': 'Mesa não encontrada.', 'es-mx': 'Mesa no encontrada.', 'en-us': 'Table not found.' }, data: null }, { status: 404 });
}

function unauthorized() {
  return NextResponse.json({ success: false, message: { 'pt-br': 'Apenas o Mestre pode fazer isso.', 'es-mx': 'Solo el Máster puede hacer esto.', 'en-us': 'Only the Master can do this.' }, data: null }, { status: 401 });
}

function characterNotFound() {
  return NextResponse.json({ success: false, message: { 'pt-br': 'Personagem não encontrado.', 'es-mx': 'Personaje no encontrado.', 'en-us': 'Character not found.' }, data: null }, { status: 404 });
}

// `zone_id` inválido (não existe ou pertence a outra Mesa) — 422 em vez de
// ignorar silenciosamente, para o client (drag-and-drop entre zonas) saber
// que a operação falhou.
function invalidZone() {
  return NextResponse.json({ success: false, message: { 'pt-br': 'Divisão inválida.', 'es-mx': 'División inválida.', 'en-us': 'Invalid zone.' }, data: null }, { status: 422 });
}

// Atualiza um personagem (nome, imagem, posição, hp, status_effects,
// visible). Todos os campos do body são opcionais — só os presentes são
// alterados. Só o Mestre pode.
export async function PATCH(request: Request, { params }: { params: Promise<{ code: string; id: string }> }) {
  try {
    const { code, id } = await params;
    const tableCode = code.toUpperCase();
    const characterId = Number(id);

    const { table, isMaster } = await resolveTableAndMaster(tableCode);

    if (!table) return tableNotFound();
    if (!isMaster) return unauthorized();

    const [existing] = await db
      .select()
      .from(characters)
      .where(and(eq(characters.id, characterId), eq(characters.table_id, table.id)));

    if (!existing) return characterNotFound();

    const body = await request.json().catch(() => ({}));

    const updates: Partial<typeof characters.$inferInsert> = { updated_at: new Date() };

    if (typeof body.name === 'string' && body.name.trim()) updates.name = body.name.trim();
    if ('image_url' in body) updates.image_url = typeof body.image_url === 'string' ? body.image_url : null;

    if (typeof body.zone_id === 'number') {
      const [zone] = await db
        .select({ id: tableZones.id })
        .from(tableZones)
        .where(and(eq(tableZones.id, body.zone_id), eq(tableZones.table_id, table.id)));

      if (!zone) return invalidZone();

      updates.zone_id = zone.id;
    }

    if (typeof body.hp_current === 'number') updates.hp_current = body.hp_current;
    if (typeof body.hp_max === 'number') updates.hp_max = body.hp_max;
    if (typeof body.extra_hp === 'number') updates.extra_hp = Math.max(body.extra_hp, 0);
    if (Array.isArray(body.status_effects)) updates.status_effects = sanitizeStatusEffects(body.status_effects);
    if (typeof body.visible === 'boolean') updates.visible = body.visible;
    if (typeof body.has_mana === 'boolean') updates.has_mana = body.has_mana;

    // `mana_current`/`mana_max` sempre clampados juntos: se qualquer um dos
    // dois vier no body, recalcula `mana_current` contra o `mana_max`
    // RESULTANTE (o valor novo se enviado, senão o existente) — nunca deixa
    // `mana_current` > `mana_max` persistido.
    if (typeof body.mana_max === 'number' || typeof body.mana_current === 'number') {
      const resultingManaMax = typeof body.mana_max === 'number' ? body.mana_max : existing.mana_max;
      const rawManaCurrent = typeof body.mana_current === 'number' ? body.mana_current : existing.mana_current;

      if (typeof body.mana_max === 'number') updates.mana_max = resultingManaMax;

      updates.mana_current = Math.min(Math.max(rawManaCurrent, 0), Math.max(resultingManaMax, 0));
    }

    const [character] = await db
      .update(characters)
      .set(updates)
      .where(eq(characters.id, characterId))
      .returning();

    publish(`table:${tableCode}`);

    return NextResponse.json({
      success: true,
      message: { 'pt-br': 'Personagem atualizado com sucesso.', 'es-mx': 'Personaje actualizado con éxito.', 'en-us': 'Character updated successfully.' },
      data: toCharacterMaster(character),
    });
  } catch (e) {
    console.error(e);

    return NextResponse.json({ success: false, message: { 'pt-br': 'Erro ao atualizar o personagem.', 'es-mx': 'Error al actualizar el personaje.', 'en-us': 'Error updating character.' }, data: null }, { status: 500 });
  }
}

// Remove um personagem da Mesa. Só o Mestre pode.
export async function DELETE(_request: Request, { params }: { params: Promise<{ code: string; id: string }> }) {
  try {
    const { code, id } = await params;
    const tableCode = code.toUpperCase();
    const characterId = Number(id);

    const { table, isMaster } = await resolveTableAndMaster(tableCode);

    if (!table) return tableNotFound();
    if (!isMaster) return unauthorized();

    const deleted = await db
      .delete(characters)
      .where(and(eq(characters.id, characterId), eq(characters.table_id, table.id)))
      .returning({ id: characters.id });

    if (deleted.length === 0) return characterNotFound();

    publish(`table:${tableCode}`);

    return NextResponse.json({
      success: true,
      message: { 'pt-br': 'Personagem removido com sucesso.', 'es-mx': 'Personaje eliminado con éxito.', 'en-us': 'Character removed successfully.' },
      data: null,
    });
  } catch (e) {
    console.error(e);

    return NextResponse.json({ success: false, message: { 'pt-br': 'Erro ao remover o personagem.', 'es-mx': 'Error al eliminar el personaje.', 'en-us': 'Error removing character.' }, data: null }, { status: 500 });
  }
}
