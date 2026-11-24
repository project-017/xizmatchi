'use server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { redirect } from 'next/navigation';
import { clearSession, setSession } from '@/lib/auth';
import { db } from '@/lib/supabase';

function safeEqual(a: string, b: string) {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export async function login(_prev: { error?: string } | undefined, fd: FormData) {
  const loginName = String(fd.get('login') || '').trim().toLowerCase();
  const password = String(fd.get('password') || '');
  if (!loginName || !password) return { error: 'Login va parolni kiriting' };

  const adminLogin = (process.env.ADMIN_LOGIN || '').toLowerCase();
  const adminPass = process.env.ADMIN_PASSWORD || '';
  if (adminLogin && adminPass && safeEqual(loginName, adminLogin) && safeEqual(password, adminPass)) {
    await setSession({ role: 'admin', id: 'admin', name: 'Administrator' });
    redirect('/admin');
  }

  const { data: p } = await db()
    .from('providers')
    .select('id,full_name,password_hash,is_active')
    .eq('login', loginName)
    .maybeSingle();
  if (!p || !(await bcrypt.compare(password, p.password_hash))) return { error: "Login yoki parol noto'g'ri" };
  if (!p.is_active) return { error: "Profilingiz vaqtincha o'chirilgan. Admin bilan bog'laning." };

  await setSession({ role: 'provider', id: p.id, name: p.full_name });
  redirect('/panel');
}

export async function logout() {
  await clearSession();
  redirect('/login');
}
