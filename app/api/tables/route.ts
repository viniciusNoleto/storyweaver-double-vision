import { randomBytes } from 'crypto';
import { db } from '@/libs/db';
import { tables, tableZones } from '@/db/schema';
import { hashMasterKey } from '@/libs/tableAuth';
import { setMasterSessionCookie } from '@/libs/session';
import { ETableStatus } from '@/resources/table/enums/TableStatus';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

// Alfabeto sem caracteres ambíguos (sem 0/O, 1/I) — mesma lógica de
// `generateRoomCode()` do cross-poker (app/api/rooms/route.ts lá), adaptada
// para o vocabulário da Mesa.
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

function generateTableCode(): string {
  let code = '';

  for (let i = 0; i < CODE_LENGTH; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];

  return code;
}

// Cria uma Mesa. Gera `code` (público, único) e `master_key` (segredo de alta
// entropia — ver decisão registrada em `.claude/rules/table-concept.md` seção 6
// / `libs/tableAuth.ts`). Persiste só `master_key_hash`; devolve `master_key`
// em texto puro APENAS nesta resposta — nenhuma outra rota volta a expô-la.
// Quem cria a Mesa já é o Mestre, então já setamos o cookie de sessão aqui
// (mesmo comportamento de `setRoomSessionCookie` no `createRoom` do cross-poker).
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = typeof body?.name === 'string' ? body.name.trim() : '';

    let code = generateTableCode();

    for (let attempts = 0; attempts < 5; attempts++) {
      const existing = await db.select({ id: tables.id }).from(tables).where(eq(tables.code, code));

      if (existing.length === 0) break;

      code = generateTableCode();
    }

    const masterKey = randomBytes(16).toString('hex');
    const masterKeyHash = hashMasterKey(masterKey);
    const now = new Date();

    const [createdTable] = await db.insert(tables).values({
      code,
      master_key_hash: masterKeyHash,
      name: name || null,
      status: ETableStatus.ACTIVE,
      created_at: now,
    }).returning({ id: tables.id });

    // Toda Mesa nasce com exatamente 1 zona (position 0) — ver
    // `.claude/rules/table-concept.md`. Personagens sempre têm uma zona
    // default disponível para cair (ver `characters/route.ts`).
    await db.insert(tableZones).values({
      table_id: createdTable.id,
      position: 0,
      created_at: now,
    });

    await setMasterSessionCookie(code, masterKey);

    return NextResponse.json({
      success: true,
      message: { 'pt-br': 'Mesa criada com sucesso.', 'es-mx': 'Mesa creada con éxito.', 'en-us': 'Table created successfully.' },
      data: { code, master_key: masterKey },
    }, { status: 201 });
  } catch (e) {
    console.error(e);

    return NextResponse.json({ success: false, message: { 'pt-br': 'Erro ao criar a mesa.', 'es-mx': 'Error al crear la mesa.', 'en-us': 'Error creating table.' }, data: null }, { status: 500 });
  }
}
