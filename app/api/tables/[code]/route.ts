import { db } from '@/libs/db';
import { tables, tablePublicColumns, characters, tableZones } from '@/db/schema';
import { getCurrentMaster } from '@/libs/tableAuth';
import { healthColor } from '@/resources/character/models/HealthColor';
import type { ICharacterDisplay, ICharacterMaster } from '@/resources/character/models/Character';
import type { EStatusEffect } from '@/resources/character/enums/StatusEffect';
import type { ITableZone } from '@/resources/table/models/TableZone';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

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
        stats: c.stats as Record<string, number>,
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
          zone_id: c.zone_id,
          // hp_current/hp_max/stats NUNCA entram aqui, nem ocultos — só o
          // resultado já calculado de HealthColor.ts. Ver regra de produto em
          // table-concept.md seção 2.
          hp_color: healthColor(c.hp_current, c.hp_max),
          status_effects: c.status_effects as EStatusEffect[],
          // Derivado (hp_current <= 0), não é o número bruto — ver comentário
          // em `resources/character/models/Character.ts`.
          is_defeated: c.hp_current <= 0,
          // EXCEÇÃO DELIBERADA: mana é permitida como número cru também na
          // Exibição (decisão registrada em
          // `resources/character/models/Character.ts`) — hp/stats continuam
          // proibidos acima desta linha.
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
