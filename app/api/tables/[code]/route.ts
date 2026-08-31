import { db } from '@/libs/db';
import { tables, tablePublicColumns, characters, tableZones } from '@/db/schema';
import { publish } from '@/libs/realtime';
import { healthColor } from '@/resources/character/models/HealthColor';
import type { ICharacterDisplay, ICharacterMaster } from '@/resources/character/models/Character';
import type { ITableZone } from '@/resources/table/models/TableZone';
import type { ECharacterType } from '@/resources/character/enums/CharacterType';
import type { EStatusEffect } from '@/resources/character/enums/StatusEffect';
import { asc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

// App de uso pessoal (um único dono, sem contas) — não há mais checagem de
// "é o Mestre" em lugar nenhum: qualquer um com o link pode gerenciar a mesa
// de qualquer navegador/dispositivo. A ÚNICA distinção que resta é
// visual/de privacidade: `?view=display` (usado só pela Tela de Exibição)
// continua pedindo o formato redigido (sem HP), nunca o formato completo —
// essa parte não é sobre autenticação, é sobre nunca mostrar números de jogo
// numa tela pública/telão. Ver `.claude/rules/table-concept.md` seção 2.

function tableNotFound() {
  return NextResponse.json({ success: false, message: { 'pt-br': 'Mesa não encontrada.', 'es-mx': 'Mesa no encontrada.', 'en-us': 'Table not found.' }, data: null }, { status: 404 });
}

// Única rota de snapshot da Mesa (ver `.claude/rules/table-concept.md` seção 3,
// "Redação de privacidade — uma única fonte, dois payloads"). `?view=display`
// decide o formato — nunca crie outra rota de snapshot com lógica própria.
export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const tableCode = code.toUpperCase();

    const [table] = await db.select(tablePublicColumns).from(tables).where(eq(tables.code, tableCode));

    if (!table) {
      return NextResponse.json({ success: false, message: { 'pt-br': 'Mesa não encontrada.', 'es-mx': 'Mesa no encontrada.', 'en-us': 'Table not found.' }, data: null }, { status: 404 });
    }

    const forcedDisplay = new URL(request.url).searchParams.get('view') === 'display';
    const isMaster = !forcedDisplay;

    const zoneRows = await db
      .select()
      .from(tableZones)
      .where(eq(tableZones.table_id, table.id))
      .orderBy(asc(tableZones.position));

    const zones: ITableZone[] = zoneRows.map((z) => ({ id: z.id, table_id: z.table_id, position: z.position }));

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
        type: c.type as `${ECharacterType}`,
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
          type: c.type as `${ECharacterType}`,
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
      data: { table, you: { is_master: isMaster }, zones, characters: characterList },
    });
  } catch (e) {
    console.error(e);

    return NextResponse.json({ success: false, message: { 'pt-br': 'Erro ao buscar a mesa.', 'es-mx': 'Error al buscar la mesa.', 'en-us': 'Error fetching table.' }, data: null }, { status: 500 });
  }
}

// Apaga a Mesa e tudo que pertence a ela (personagens e zonas). Sem `ON
// DELETE CASCADE` no schema (ver `db/schema/`), então a ordem de exclusão
// respeita as foreign keys — personagens antes das zonas, zonas antes da
// Mesa — dentro de uma única transação.
export async function DELETE(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const tableCode = code.toUpperCase();

    const [table] = await db.select({ id: tables.id }).from(tables).where(eq(tables.code, tableCode));

    if (!table) return tableNotFound();

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
