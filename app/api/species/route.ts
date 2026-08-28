import { db } from '@/libs/db';
import { species } from '@/db/schema';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const rows = await db.select().from(species).orderBy(species.name);

    return NextResponse.json({
      success: true,
      message: { 'pt-br': 'Operação realizada com sucesso.', 'es-mx': 'Operación realizada con éxito.', 'en-us': 'Operation completed successfully.' },
      data: rows,
    });
  } catch (e) {
    console.error(e);

    return NextResponse.json({ success: false, message: { 'pt-br': 'Erro ao listar as espécies.', 'es-mx': 'Error al listar las especies.', 'en-us': 'Error listing species.' }, data: null }, { status: 500 });
  }
}
