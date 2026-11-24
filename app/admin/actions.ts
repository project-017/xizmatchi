'use server';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/supabase';
import { slugify, fmtDateTime, STATUS } from '@/lib/format';
import { notify } from '@/lib/telegram';
import type { BookingStatus } from '@/lib/types';

const str = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
const num = (fd: FormData, k: string) => Math.max(0, Math.round(Number(fd.get(k)) || 0));
const back = (path: string, kind: 'ok' | 'error', msg: string): never => redirect(`${path}?${kind}=${encodeURIComponent(msg)}`);

function providerFields(fd: FormData) {
  const chat = str(fd, 'telegram_chat_id');
  return {
    full_name: str(fd, 'full_name'),
    phone: str(fd, 'phone') || null,
    category_id: str(fd, 'category_id') || null,
    bio: str(fd, 'bio') || null,
    experience_years: num(fd, 'experience_years'),
    price_from: num(fd, 'price_from'),
    price_unit: str(fd, 'price_unit') || 'xizmat',
    district: str(fd, 'district') || null,
    avatar_url: str(fd, 'avatar_url') || null,
    telegram_chat_id: /^-?\d+$/.test(chat) ? Number(chat) : null,
  };
}

// ───────────────── Ustalar ─────────────────
export async function createProvider(fd: FormData) {
  await requireAdmin();
  const login = str(fd, 'login').toLowerCase();
  const password = str(fd, 'password');
  const fields = providerFields(fd);
  const path = '/admin/providers/new';
  if (!/^[a-z0-9_.-]{3,32}$/.test(login)) back(path, 'error', "Login 3-32 belgi: lotin harflari, raqam, _ . -");
  if (password.length < 6) back(path, 'error', "Parol kamida 6 belgi bo'lsin");
  if (!fields.full_name) back(path, 'error', 'Ism familiyani kiriting');

  const { data, error } = await db()
    .from('providers')
    .insert({ ...fields, login, password_hash: await bcrypt.hash(password, 10) })
    .select('id')
    .single();
  if (error) back(path, 'error', error.code === '23505' ? 'Bu login band, boshqasini tanlang' : error.message);
  revalidatePath('/admin/providers');
  back(`/admin/providers/${data!.id}`, 'ok', `Usta yaratildi. Login: ${login}  •  Parol: ${password}`);
}

export async function updateProvider(fd: FormData) {
  await requireAdmin();
  const id = str(fd, 'id');
  const path = `/admin/providers/${id}`;
  const fields = providerFields(fd);
  if (!fields.full_name) back(path, 'error', 'Ism familiyani kiriting');
  const login = str(fd, 'login').toLowerCase();
  if (!/^[a-z0-9_.-]{3,32}$/.test(login)) back(path, 'error', "Login 3-32 belgi: lotin harflari, raqam, _ . -");

  const update: Record<string, unknown> = { ...fields, login, is_active: fd.get('is_active') === 'on' };
  const password = str(fd, 'password');
  if (password) {
    if (password.length < 6) back(path, 'error', "Parol kamida 6 belgi bo'lsin");
    update.password_hash = await bcrypt.hash(password, 10);
  }
  const { error } = await db().from('providers').update(update).eq('id', id);
  if (error) back(path, 'error', error.code === '23505' ? 'Bu login band' : error.message);
  revalidatePath('/admin/providers');
  back(path, 'ok', password ? `Saqlandi. Yangi parol: ${password}` : 'Saqlandi');
}

export async function toggleProvider(fd: FormData) {
  await requireAdmin();
  const id = str(fd, 'id');
  const { data } = await db().from('providers').select('is_active').eq('id', id).single();
  await db().from('providers').update({ is_active: !data?.is_active }).eq('id', id);
  revalidatePath('/admin/providers');
}

export async function deleteProvider(fd: FormData) {
  await requireAdmin();
  await db().from('providers').delete().eq('id', str(fd, 'id'));
  revalidatePath('/admin/providers');
  back('/admin/providers', 'ok', "Usta o'chirildi");
}

// ───────────────── Kategoriyalar ─────────────────
export async function saveCategory(fd: FormData) {
  await requireAdmin();
  const id = str(fd, 'id');
  const name = str(fd, 'name');
  if (!name) back('/admin/categories', 'error', 'Nomini kiriting');
  const row = {
    name,
    slug: str(fd, 'slug') ? slugify(str(fd, 'slug')) : slugify(name),
    icon: str(fd, 'icon') || '🛠️',
    color: str(fd, 'color') || '#6366f1',
    description: str(fd, 'description') || null,
    sort: num(fd, 'sort'),
    is_active: id ? fd.get('is_active') === 'on' : true,
  };
  const { error } = id ? await db().from('categories').update(row).eq('id', id) : await db().from('categories').insert(row);
  if (error) back('/admin/categories', 'error', error.code === '23505' ? 'Bunday slug mavjud' : error.message);
  revalidatePath('/admin/categories');
  back('/admin/categories', 'ok', id ? 'Saqlandi' : "Xizmat turi qo'shildi");
}

export async function deleteCategory(fd: FormData) {
  await requireAdmin();
  const { error } = await db().from('categories').delete().eq('id', str(fd, 'id'));
  if (error) back('/admin/categories', 'error', error.message);
  revalidatePath('/admin/categories');
  back('/admin/categories', 'ok', "O'chirildi");
}

// ───────────────── Buyurtmalar ─────────────────
export async function adminSetStatus(fd: FormData) {
  await requireAdmin();
  const id = str(fd, 'id');
  const status = str(fd, 'status') as BookingStatus;
  if (!(status in STATUS)) return;
  const { data: b } = await db().from('bookings').select('slot_id,scheduled_at,client:clients(telegram_id)').eq('id', id).single();
  await db().from('bookings').update({ status }).eq('id', id);
  if (b?.slot_id) await db().from('slots').update({ is_booked: !['cancelled', 'rejected'].includes(status) }).eq('id', b.slot_id);
  const client = b?.client as unknown as { telegram_id: number } | null;
  if (b) await notify(client?.telegram_id, `ℹ️ Buyurtmangiz holati (${fmtDateTime(b.scheduled_at)}): <b>${STATUS[status].label}</b>`, true);
  revalidatePath('/admin/bookings');
}

// ───────────────── Mijozlar ─────────────────
export async function toggleClientBlock(fd: FormData) {
  await requireAdmin();
  const id = str(fd, 'id');
  const { data } = await db().from('clients').select('is_blocked').eq('id', id).single();
  await db().from('clients').update({ is_blocked: !data?.is_blocked }).eq('id', id);
  revalidatePath('/admin/clients');
}
