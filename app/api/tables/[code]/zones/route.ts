import { db } from '@/libs/db';
import { tables, tableZones } from '@/db/schema';
import { getCurrentMaster } from '@/libs/tableAuth';
import { publish } from '@/libs/realtime';
import type { ITableZone } from '@/resources/table/models/TableZone';
import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

// Teto de divisões por Mesa — decisão desta etapa: zonas são sempre exibidas
// lado a lado com largura igual (ver `TableBoard.tsx`), então um número muito
// alto deixaria cada uma ilegível numa tela normal/telão.
const MAX_ZONES_PER_TABLE = 6;

function toTableZone(z: typeof tableZones.$inferSelect): ITableZone {
  return {
    id: z.id,
    table_id: z.table_id,
    position: z.position,
  };
}

// Cria uma nova divisão/zona no tabuleiro. Só o Mestre pode.
export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const tableCode = code.toUpperCase();

    const [table] = await db.select({ id: tables.id }).from(tables).where(eq(tables.code, tableCode));

    if (!table) {
      return NextResponse.json({ success: false, message: { 'pt-br': 'Mesa não encontrada.', 'es-mx': 'Mesa no encontrada.', 'en-us': 'Table not found.' }, data: null }, { status: 404 });
    }

    const isMaster = await getCurrentMaster(tableCode, table.id);

    if (!isMaster) {
      return NextResponse.json({ success: false, message: { 'pt-br': 'Apenas o Mestre pode fazer isso.', 'es-mx': 'Solo el Máster puede hacer esto.', 'en-us': 'Only the Master can do this.' }, data: null }, { status: 401 });
    }

    const existingZones = await db
      .select({ id: tableZones.id, position: tableZones.position })
      .from(tableZones)
      .where(eq(tableZones.table_id, table.id))
      .orderBy(desc(tableZones.position));

    if (existingZones.length >= MAX_ZONES_PER_TABLE) {
      return NextResponse.json({
        success: false,
        message: {
          'pt-br': `A Mesa já tem o máximo de ${MAX_ZONES_PER_TABLE} divisões.`,
          'es-mx': `La Mesa ya tiene el máximo de ${MAX_ZONES_PER_TABLE} divisiones.`,
          'en-us': `The Table already has the maximum of ${MAX_ZONES_PER_TABLE} zones.`,
        },
        data: null,
      }, { status: 422 });
    }

    const nextPosition = existingZones.length > 0 ? existingZones[0].position + 1 : 0;

    const [zone] = await db.insert(tableZones).values({
      table_id: table.id,
      position: nextPosition,
      created_at: new Date(),
    }).returning();

    publish(`table:${tableCode}`);

    return NextResponse.json({
      success: true,
      message: { 'pt-br': 'Divisão criada com sucesso.', 'es-mx': 'División creada con éxito.', 'en-us': 'Zone created successfully.' },
      data: toTableZone(zone),
    }, { status: 201 });
  } catch (e) {
    console.error(e);

    return NextResponse.json({ success: false, message: { 'pt-br': 'Erro ao criar a divisão.', 'es-mx': 'Error al crear la división.', 'en-us': 'Error creating zone.' }, data: null }, { status: 500 });
  }
}
