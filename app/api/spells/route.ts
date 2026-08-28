import { db } from '@/libs/db';
import { spells, classSpells } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

// Lista magias — conteúdo de sistema, sem checagem de Mestre (mesmo padrão
// de /api/classes, /api/tools). Sem ?class_id, devolve o catálogo completo
// (ISpell[], usado pelo modal "Ver Magias"). Com ?class_id, devolve
// IClassSpell[] (magia + ciclo) só das magias daquela classe, ordenadas por
// ciclo e depois por nome — é o que a etapa Magias do wizard consome.
export async function GET(request: Request) {
  try {
    const classIdParam = new URL(request.url).searchParams.get('class_id');

    if (!classIdParam) {
      const rows = await db.select().from(spells).orderBy(spells.name);

      return NextResponse.json({
        success: true,
        message: { 'pt-br': 'Operação realizada com sucesso.', 'es-mx': 'Operación realizada con éxito.', 'en-us': 'Operation completed successfully.' },
        data: rows,
      });
    }

    const classId = Number(classIdParam);

    const rows = await db
      .select({ spell: spells, cycle: classSpells.cycle })
      .from(classSpells)
      .innerJoin(spells, eq(classSpells.spell_id, spells.id))
      .where(eq(classSpells.class_id, classId))
      .orderBy(classSpells.cycle, spells.name);

    return NextResponse.json({
      success: true,
      message: { 'pt-br': 'Operação realizada com sucesso.', 'es-mx': 'Operación realizada con éxito.', 'en-us': 'Operation completed successfully.' },
      data: rows,
    });
  } catch (e) {
    console.error(e);

    return NextResponse.json({ success: false, message: { 'pt-br': 'Erro ao listar as magias.', 'es-mx': 'Error al listar los hechizos.', 'en-us': 'Error listing spells.' }, data: null }, { status: 500 });
  }
}
