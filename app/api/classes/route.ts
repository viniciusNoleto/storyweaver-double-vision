import { db } from '@/libs/db';
import { classes } from '@/db/schema';
import { NextResponse } from 'next/server';

// Lista todas as Classes — conteúdo de regras, sem checagem de Mestre (mesmo
// raciocínio de GET /api/tables: dado público de sistema, não de uma Mesa
// específica).
export async function GET() {
  try {
    const rows = await db.select().from(classes).orderBy(classes.name);

    return NextResponse.json({
      success: true,
      message: { 'pt-br': 'Operação realizada com sucesso.', 'es-mx': 'Operación realizada con éxito.', 'en-us': 'Operation completed successfully.' },
      data: rows,
    });
  } catch (e) {
    console.error(e);

    return NextResponse.json({ success: false, message: { 'pt-br': 'Erro ao listar as classes.', 'es-mx': 'Error al listar las clases.', 'en-us': 'Error listing classes.' }, data: null }, { status: 500 });
  }
}
