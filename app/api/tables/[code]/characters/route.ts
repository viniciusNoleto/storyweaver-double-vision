import { db } from '@/libs/db';
import { tables, characters } from '@/db/schema';
import { publish } from '@/libs/realtime';
import type { ICharacterMaster } from '@/resources/character/models/Character';
import type { ICharacterAttributes } from '@/resources/character/models/RulesContent';
import type { ECharacterType } from '@/resources/character/enums/CharacterType';
import { EStatusEffect } from '@/resources/character/enums/StatusEffect';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

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

// Filtra `status_effects` recebido do body para manter só strings que sejam
// valores válidos de `EStatusEffect` — ignora silenciosamente entradas
// inválidas em vez de rejeitar a requisição inteira (usado por POST e PATCH).
function sanitizeStatusEffects(value: unknown): EStatusEffect[] {
  if (!Array.isArray(value)) return [];

  const validValues = Object.values(EStatusEffect) as string[];

  return value.filter((entry): entry is EStatusEffect => typeof entry === 'string' && validValues.includes(entry));
}

// Cria um personagem na Mesa. App de uso pessoal — sem checagem de Mestre
// (ver `.claude/rules/table-concept.md`).
export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const tableCode = code.toUpperCase();

    const [table] = await db.select({ id: tables.id }).from(tables).where(eq(tables.code, tableCode));

    if (!table) {
      return NextResponse.json({ success: false, message: { 'pt-br': 'Mesa não encontrada.', 'es-mx': 'Mesa no encontrada.', 'en-us': 'Table not found.' }, data: null }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const name = typeof body?.name === 'string' ? body.name.trim() : '';

    if (!name) {
      return NextResponse.json({ success: false, message: { 'pt-br': 'Informe o nome do personagem.', 'es-mx': 'Ingresa el nombre del personaje.', 'en-us': 'Enter the character name.' }, data: null }, { status: 422 });
    }

    const now = new Date();

    const hasMana = typeof body.has_mana === 'boolean' ? body.has_mana : false;
    const manaMax = typeof body.mana_max === 'number' ? body.mana_max : 0;
    const manaCurrentRaw = typeof body.mana_current === 'number' ? body.mana_current : 0;
    const manaCurrent = Math.min(Math.max(manaCurrentRaw, 0), manaMax);

    const [character] = await db.insert(characters).values({
      table_id: table.id,
      name,
      image_url: typeof body.image_url === 'string' ? body.image_url : null,
      type: typeof body.type === 'string' && ['PC', 'NPC', 'Monstro'].includes(body.type) ? body.type : 'PC',
      position_x: typeof body.position_x === 'number' ? body.position_x : 20,
      position_y: typeof body.position_y === 'number' ? body.position_y : 20,
      hp_current: typeof body.hp_current === 'number' ? body.hp_current : 0,
      hp_max: typeof body.hp_max === 'number' ? body.hp_max : 1,
      extra_hp: typeof body.extra_hp === 'number' ? Math.max(body.extra_hp, 0) : 0,
      status_effects: sanitizeStatusEffects(body.status_effects),
      visible: typeof body.visible === 'boolean' ? body.visible : true,
      has_mana: hasMana,
      mana_max: manaMax,
      mana_current: manaCurrent,
      class_id: typeof body.class_id === 'number' ? body.class_id : null,
      species_id: typeof body.species_id === 'number' ? body.species_id : null,
      origin_id: typeof body.origin_id === 'number' ? body.origin_id : null,
      level: typeof body.level === 'number' ? body.level : 1,
      attributes: body.attributes && typeof body.attributes === 'object' ? body.attributes : null,
      created_at: now,
      updated_at: now,
    }).returning();

    publish(`table:${tableCode}`);

    return NextResponse.json({
      success: true,
      message: { 'pt-br': 'Personagem criado com sucesso.', 'es-mx': 'Personaje creado con éxito.', 'en-us': 'Character created successfully.' },
      data: toCharacterMaster(character),
    }, { status: 201 });
  } catch (e) {
    console.error(e);

    return NextResponse.json({ success: false, message: { 'pt-br': 'Erro ao criar o personagem.', 'es-mx': 'Error al crear el personaje.', 'en-us': 'Error creating character.' }, data: null }, { status: 500 });
  }
}
