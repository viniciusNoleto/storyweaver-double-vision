import { db } from '@/libs/db';
import { origins } from '@/db/schema';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const rows = await db.select().from(origins).orderBy(origins.name);

    return NextResponse.json({
      success: true,
      message: { 'pt-br': 'Operação realizada com sucesso.', 'es-mx': 'Operación realizada con éxito.', 'en-us': 'Operation completed successfully.' },
      data: rows,
    });
  } catch (e) {
    console.error(e);

    return NextResponse.json({ success: false, message: { 'pt-br': 'Erro ao listar as origens.', 'es-mx': 'Error al listar los orígenes.', 'en-us': 'Error listing origins.' }, data: null }, { status: 500 });
  }
}
