import 'server-only';

import { createHash } from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from './db';
import { tables } from '@/db/schema';
import { getMasterSessionToken } from './session';

// Hash da `master_key`: sha256 hex (nativo do Node `crypto`), sem salt.
//
// Por quê: `master_key` não é uma senha escolhida por usuário (que precisaria de
// bcrypt/scrypt/argon2 para resistir a força bruta contra segredos de baixa
// entropia) — é um segredo aleatório de alta entropia gerado pelo servidor na
// criação da Mesa (etapa 3, ex. `crypto.randomBytes(16).toString('hex')`). Um
// hash rápido e determinístico é suficiente e evita a dependência extra.
export function hashMasterKey(masterKey: string): string {
  return createHash('sha256').update(masterKey).digest('hex');
}

// Resolve se a requisição atual (via cookie `sw_master_{code}`, ver libs/session.ts)
// pertence ao Mestre da Mesa `tableId`/`tableCode`. O cookie guarda a `master_key`
// em texto puro (setado uma única vez, no primeiro acesso com `?key=` válida) —
// esta função re-hasheia o valor do cookie e compara com o `master_key_hash`
// persistido. Nunca confie em papel/id vindo do body/query da requisição.
//
// Retorna `boolean`. Rotas que precisarem do registro da Mesa devem buscá-lo
// separadamente (esta função só resolve identidade, não devolve dados).
export async function getCurrentMaster(tableCode: string, tableId: number): Promise<boolean> {
  const token = await getMasterSessionToken(tableCode);

  if (!token) return false;

  const [table] = await db
    .select({ master_key_hash: tables.master_key_hash })
    .from(tables)
    .where(eq(tables.id, tableId));

  if (!table) return false;

  return hashMasterKey(token) === table.master_key_hash;
}
