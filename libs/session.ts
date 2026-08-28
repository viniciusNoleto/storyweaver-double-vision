import 'server-only';

import { cookies } from 'next/headers';

const COOKIE_PREFIX = 'sw_master_';

// Mesas de RPG duram uma campanha inteira, não uma única partida — mantemos o
// Mestre logado por mais tempo do que o padrão de sessão do cross-poker (1 dia).
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export async function setMasterSessionCookie(tableCode: string, token: string) {
  const store = await cookies();

  store.set(`${COOKIE_PREFIX}${tableCode}`, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function getMasterSessionToken(tableCode: string): Promise<string | null> {
  const store = await cookies();

  return store.get(`${COOKIE_PREFIX}${tableCode}`)?.value ?? null;
}
