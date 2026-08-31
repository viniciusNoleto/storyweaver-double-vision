import { db } from '@/libs/db';
import { tables, tableZones, characters } from '@/db/schema';
import { publish } from '@/libs/realtime';
import { and, asc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

// Remove uma divisão/zona do tabuleiro. App de uso pessoal — sem checagem de
// Mestre. Todo o trabalho (reassociar personagens + deletar a zona +
// renumerar as restantes) roda numa única transação para nunca deixar
// `characters.zone_id` apontando para uma zona que não existe mais, nem
// `table_zones.position` com furos.
export async function DELETE(_request: Request, { params }: { params: Promise<{ code: string; id: string }> }) {
  try {
    const { code, id } = await params;
    const tableCode = code.toUpperCase();
    const zoneId = Number(id);

    const [table] = await db.select({ id: tables.id }).from(tables).where(eq(tables.code, tableCode));

    if (!table) {
      return NextResponse.json({ success: false, message: { 'pt-br': 'Mesa não encontrada.', 'es-mx': 'Mesa no encontrada.', 'en-us': 'Table not found.' }, data: null }, { status: 404 });
    }

    const allZones = await db
      .select({ id: tableZones.id, position: tableZones.position })
      .from(tableZones)
      .where(eq(tableZones.table_id, table.id))
      .orderBy(asc(tableZones.position));

    const removedZone = allZones.find((z) => z.id === zoneId);

    if (!removedZone) {
      return NextResponse.json({ success: false, message: { 'pt-br': 'Divisão não encontrada.', 'es-mx': 'División no encontrada.', 'en-us': 'Zone not found.' }, data: null }, { status: 404 });
    }

    if (allZones.length <= 1) {
      return NextResponse.json({
        success: false,
        message: { 'pt-br': 'Não é possível remover a última divisão da Mesa.', 'es-mx': 'No es posible eliminar la última división de la Mesa.', 'en-us': 'Cannot remove the Table\'s last zone.' },
        data: null,
      }, { status: 422 });
    }

    const removedIndex = allZones.findIndex((z) => z.id === zoneId);

    // Zona-alvo: a ANTERIOR (position imediatamente menor). Se a removida for
    // a de position 0 (não há anterior), usa a PRÓXIMA (position imediatamente
    // maior) — sempre existe porque allZones.length > 1 nesse ponto.
    const targetZone = removedIndex > 0 ? allZones[removedIndex - 1] : allZones[removedIndex + 1];

    const remainingZonesInOrder = allZones.filter((z) => z.id !== zoneId);

    await db.transaction(async (tx) => {
      await tx
        .update(characters)
        .set({ zone_id: targetZone.id, updated_at: new Date() })
        .where(and(eq(characters.zone_id, zoneId), eq(characters.table_id, table.id)));

      await tx.delete(tableZones).where(eq(tableZones.id, zoneId));

      // Renumera as zonas restantes para 0..N-1, mesma ordem relativa —
      // mantém a Mesa sem furos de `position`.
      for (let i = 0; i < remainingZonesInOrder.length; i++) {
        const zone = remainingZonesInOrder[i];

        if (zone.position !== i) {
          await tx.update(tableZones).set({ position: i }).where(eq(tableZones.id, zone.id));
        }
      }
    });

    publish(`table:${tableCode}`);

    return NextResponse.json({
      success: true,
      message: { 'pt-br': 'Divisão removida com sucesso.', 'es-mx': 'División eliminada con éxito.', 'en-us': 'Zone removed successfully.' },
      data: null,
    });
  } catch (e) {
    console.error(e);

    return NextResponse.json({ success: false, message: { 'pt-br': 'Erro ao remover a divisão.', 'es-mx': 'Error al eliminar la división.', 'en-us': 'Error removing zone.' }, data: null }, { status: 500 });
  }
}
