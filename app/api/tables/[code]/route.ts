import { db } from '@/libs/db';
import { tables, tablePublicColumns, characters, tableZones } from '@/db/schema';
import { getCurrentMaster } from '@/libs/tableAuth';
import { publish } from '@/libs/realtime';
import { healthColor } from '@/resources/character/models/HealthColor';
import type { ICharacterDisplay, ICharacterMaster } from '@/resources/character/models/Character';
import type { ICharacterAttributes } from '@/resources/character/models/RulesContent';
import type { EStatusEffect } from '@/resources/character/enums/StatusEffect';
import type { ITableZone } from '@/resources/table/models/TableZone';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

// Resolve a Mesa pelo `code` e se a requisição atual pertence ao Mestre dela —
// mesmo padrão de `resolveTableAndMaster` em
// `app/api/tables/[code]/characters/[id]/route.ts`. Usado por PATCH e DELETE
// abaixo, que exigem `isMaster === true`.
async function resolveTableAndMaster(tableCode: string) {
  const [table] = await db.select({ id: tables.id }).from(tables).where(eq(tables.code, tableCode));

  if (!table) return { table: null, isMaster: false };

  const isMaster = await getCurrentMaster(tableCode, table.id);

  return { table, isMaster };
}

function tableNotFound() {
  return NextResponse.json({ success: false, message: { 'pt-br': 'Mesa não encontrada.', 'es-mx': 'Mesa no encontrada.', 'en-us': 'Table not found.' }, data: null }, { status: 404 });
}

function unauthorized() {
  return NextResponse.json({ success: false, message: { 'pt-br': 'Apenas o Mestre pode fazer isso.', 'es-mx': 'Solo el Máster puede hacer esto.', 'en-us': 'Only the Master can do this.' }, data: null }, { status: 401 });
}

// Única rota de snapshot da Mesa (ver `.claude/rules/table-concept.md` seção 3,
// "Redação de privacidade — uma única fonte, dois payloads"). Resolve o papel
// via cookie (`getCurrentMaster`) e monta um shape de personagem diferente por
// papel — nunca crie outra rota de snapshot com lógica de redação própria.
export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const tableCode = code.toUpperCase();

    const [table] = await db.select(tablePublicColumns).from(tables).where(eq(tables.code, tableCode));

    if (!table) {
      return NextResponse.json({ success: false, message: { 'pt-br': 'Mesa não encontrada.', 'es-mx': 'Mesa no encontrada.', 'en-us': 'Table not found.' }, data: null }, { status: 404 });
    }

    // `?view=display` força a visão redigida mesmo com cookie de Mestre válido
    // (ex.: o Mestre abrindo o link de Exibição no mesmo navegador). Só pode
    // pedir a visão MAIS restrita — nunca a mais ampla — então não enfraquece
    // a regra de nunca confiar no cliente para identidade. Ver
    // `.claude/rules/table-concept.md` seção 3.
    const forcedDisplay = new URL(request.url).searchParams.get('view') === 'display';
    const isMaster = forcedDisplay ? false : await getCurrentMaster(tableCode, table.id);

    const zoneRows = await db
      .select()
      .from(tableZones)
      .where(eq(tableZones.table_id, table.id))
      .orderBy(tableZones.position);

    // Zonas nunca carregam número de jogo — mesmo formato para Mestre e
    // Exibição (ver `.claude/rules/table-concept.md`).
    const zoneList: ITableZone[] = zoneRows.map((z) => ({
      id: z.id,
      table_id: z.table_id,
      position: z.position,
    }));

    const characterRows = await db
      .select()
      .from(characters)
      .where(eq(characters.table_id, table.id))
      .orderBy(characters.id);

    const characterList: ICharacterMaster[] | ICharacterDisplay[] = isMaster
      ? characterRows.map((c): ICharacterMaster => ({
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
        // Mana aparece nos dois formatos (exceção deliberada, ver comentário
        // em `resources/character/models/Character.ts`).
        has_mana: c.has_mana,
        mana_current: c.mana_current,
        mana_max: c.mana_max,
        class_id: c.class_id,
        species_id: c.species_id,
        origin_id: c.origin_id,
        level: c.level,
        attributes: c.attributes as ICharacterAttributes | null,
        known_spell_ids: c.known_spell_ids as number[],
        custom_items: c.custom_items,
        created_at: c.created_at ? c.created_at.toISOString() : null,
        updated_at: c.updated_at ? c.updated_at.toISOString() : null,
      }))
      : characterRows
        .filter((c) => c.visible)
        .map((c): ICharacterDisplay => ({
          id: c.id,
          table_id: c.table_id,
          name: c.name,
          image_url: c.image_url,
          zone_id: c.zone_id,
          // hp_current/hp_max/extra_hp NUNCA entram aqui, nem ocultos — só o
          // resultado já calculado de HealthColor.ts (que já incorpora
          // extra_hp no numerador/denominador). Ver regra de produto em
          // table-concept.md seção 2.
          hp_color: healthColor(c.hp_current, c.hp_max, c.extra_hp),
          status_effects: c.status_effects as EStatusEffect[],
          // Derivado (hp_current + extra_hp <= 0), não é o número bruto — ver
          // comentário em `resources/character/models/Character.ts`.
          is_defeated: c.hp_current + c.extra_hp <= 0,
          // EXCEÇÃO DELIBERADA: mana é permitida como número cru também na
          // Exibição (decisão registrada em
          // `resources/character/models/Character.ts`) — hp continua
          // proibido acima desta linha.
          has_mana: c.has_mana,
          mana_current: c.mana_current,
          mana_max: c.mana_max,
          created_at: c.created_at ? c.created_at.toISOString() : null,
          updated_at: c.updated_at ? c.updated_at.toISOString() : null,
        }));

    return NextResponse.json({
      success: true,
      message: { 'pt-br': 'Operação realizada com sucesso.', 'es-mx': 'Operación realizada con éxito.', 'en-us': 'Operation completed successfully.' },
      data: { table, you: { is_master: isMaster }, zones: zoneList, characters: characterList },
    });
  } catch (e) {
    console.error(e);

    return NextResponse.json({ success: false, message: { 'pt-br': 'Erro ao buscar a mesa.', 'es-mx': 'Error al buscar la mesa.', 'en-us': 'Error fetching table.' }, data: null }, { status: 500 });
  }
}

// Renomeia a Mesa (`name`). Só o Mestre pode. Usado pela tela "Gerenciar
// Mesas" (ver `.claude/rules/table-concept.md`).
export async function PATCH(request: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const tableCode = code.toUpperCase();

    const { table, isMaster } = await resolveTableAndMaster(tableCode);

    if (!table) return tableNotFound();
    if (!isMaster) return unauthorized();

    const body = await request.json().catch(() => ({}));

    if (typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json({ success: false, message: { 'pt-br': 'Nome inválido.', 'es-mx': 'Nombre inválido.', 'en-us': 'Invalid name.' }, data: null }, { status: 422 });
    }

    const [updated] = await db
      .update(tables)
      .set({ name: body.name.trim() })
      .where(eq(tables.id, table.id))
      .returning(tablePublicColumns);

    return NextResponse.json({
      success: true,
      message: { 'pt-br': 'Mesa renomeada com sucesso.', 'es-mx': 'Mesa renombrada con éxito.', 'en-us': 'Table renamed successfully.' },
      data: updated,
    });
  } catch (e) {
    console.error(e);

    return NextResponse.json({ success: false, message: { 'pt-br': 'Erro ao renomear a mesa.', 'es-mx': 'Error al renombrar la mesa.', 'en-us': 'Error renaming table.' }, data: null }, { status: 500 });
  }
}

// Apaga a Mesa e tudo que pertence a ela (personagens, divisões). Só o
// Mestre pode. Sem `ON DELETE CASCADE` no schema (ver `db/schema/`), então a
// ordem de exclusão respeita as foreign keys — personagens e zonas antes da
// Mesa — dentro de uma única transação.
export async function DELETE(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const tableCode = code.toUpperCase();

    const { table, isMaster } = await resolveTableAndMaster(tableCode);

    if (!table) return tableNotFound();
    if (!isMaster) return unauthorized();

    await db.transaction(async (tx) => {
      await tx.delete(characters).where(eq(characters.table_id, table.id));
      await tx.delete(tableZones).where(eq(tableZones.table_id, table.id));
      await tx.delete(tables).where(eq(tables.id, table.id));
    });

    publish(`table:${tableCode}`);

    return NextResponse.json({
      success: true,
      message: { 'pt-br': 'Mesa excluída com sucesso.', 'es-mx': 'Mesa eliminada con éxito.', 'en-us': 'Table deleted successfully.' },
      data: null,
    });
  } catch (e) {
    console.error(e);

    return NextResponse.json({ success: false, message: { 'pt-br': 'Erro ao excluir a mesa.', 'es-mx': 'Error al eliminar la mesa.', 'en-us': 'Error deleting table.' }, data: null }, { status: 500 });
  }
}
