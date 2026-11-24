import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from './supabase';

export type Session = { role: 'admin' | 'provider'; id: string; name: string };

const COOKIE = 'xz_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 kun

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error('AUTH_SECRET sozlanmagan yoki juda qisqa (.env)');
  return new TextEncoder().encode(s);
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.role !== 'admin' && payload.role !== 'provider') return null;
    return { role: payload.role, id: String(payload.id), name: String(payload.name) };
  } catch {
    return null;
  }
}

export async function setSession(s: Session) {
  const token = await new SignJWT({ ...s })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

export async function requireAdmin() {
  const s = await getSession();
  if (!s || s.role !== 'admin') redirect('/login');
  return s;
}

/** Usta sessiyasi + bazada hali ham faol ekanini tekshiradi */
export async function requireProvider() {
  const s = await getSession();
  if (!s || s.role !== 'provider') redirect('/login');
  const { data } = await db().from('providers').select('id,is_active').eq('id', s.id).maybeSingle();
  if (!data || !data.is_active) {
    redirect('/login?error=' + encodeURIComponent('Profilingiz faol emas. Admin bilan bog\'laning.'));
  }
  return s;
}
