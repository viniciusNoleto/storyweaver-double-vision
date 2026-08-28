import { db } from '@/libs/db';
import { tools } from '@/db/schema';
import { NextResponse } from 'next/server';

// Lista todas as Ferramentas — conteúdo de sistema, sem checagem de Mestre
// (mesmo raciocínio de GET /api/classes).
export async function GET() {
  try {
    const rows = await db.select().from(tools).orderBy(tools.name);

    return NextResponse.json({
      success: true,
      message: { 'pt-br': 'Operação realizada com sucesso.', 'es-mx': 'Operación realizada con éxito.', 'en-us': 'Operation completed successfully.' },
      data: rows,
    });
  } catch (e) {
    console.error(e);

    return NextResponse.json({ success: false, message: { 'pt-br': 'Erro ao listar as ferramentas.', 'es-mx': 'Error al listar las herramientas.', 'en-us': 'Error listing tools.' }, data: null }, { status: 500 });
  }
}
