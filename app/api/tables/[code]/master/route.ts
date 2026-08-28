import { db } from '@/libs/db';
import { tables, tablePublicColumns } from '@/db/schema';
import { hashMasterKey } from '@/libs/tableAuth';
import { setMasterSessionCookie } from '@/libs/session';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

// Autentica o link do Mestre: `/mesa/[code]/mestre?key=...` chama esta rota no
// primeiro acesso. Valida `hashMasterKey(key) === master_key_hash` e, se bater,
// seta o cookie httpOnly (`setMasterSessionCookie`) com a `master_key` em texto
// puro — a partir daí a `key` na URL não é mais necessária (ver
// `.claude/rules/table-concept.md` seção 2/6).
export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const tableCode = code.toUpperCase();
    const body = await request.json().catch(() => ({}));
    const key = typeof body?.key === 'string' ? body.key : '';

    if (!key) {
      return NextResponse.json({ success: false, message: { 'pt-br': 'Informe a chave do Mestre.', 'es-mx': 'Ingresa la clave del Máster.', 'en-us': 'Enter the Master key.' }, data: null }, { status: 422 });
    }

    const [row] = await db
      .select({ id: tables.id, master_key_hash: tables.master_key_hash })
      .from(tables)
      .where(eq(tables.code, tableCode));

    if (!row) {
      return NextResponse.json({ success: false, message: { 'pt-br': 'Mesa não encontrada.', 'es-mx': 'Mesa no encontrada.', 'en-us': 'Table not found.' }, data: null }, { status: 404 });
    }

    if (hashMasterKey(key) !== row.master_key_hash) {
      return NextResponse.json({ success: false, message: { 'pt-br': 'Chave do Mestre inválida.', 'es-mx': 'Clave del Máster inválida.', 'en-us': 'Invalid Master key.' }, data: null }, { status: 401 });
    }

    await setMasterSessionCookie(tableCode, key);

    const [table] = await db.select(tablePublicColumns).from(tables).where(eq(tables.id, row.id));

    return NextResponse.json({
      success: true,
      message: { 'pt-br': 'Autenticado como Mestre.', 'es-mx': 'Autenticado como Máster.', 'en-us': 'Authenticated as Master.' },
      data: { table },
    });
  } catch (e) {
    console.error(e);

    return NextResponse.json({ success: false, message: { 'pt-br': 'Erro ao autenticar.', 'es-mx': 'Error al autenticar.', 'en-us': 'Error authenticating.' }, data: null }, { status: 500 });
  }
}
