'use server';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireProvider } from '@/lib/auth';
import { db } from '@/lib/supabase';
import { notify, esc } from '@/lib/telegram';
import { fmtDateTime, toUtcIso } from '@/lib/format';
import type { BookingStatus } from '@/lib/types';

const str = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
const back = (path: string, kind: 'ok' | 'error', msg: string): never => redirect(`${path}?${kind}=${encodeURIComponent(msg)}`);

/** Usta qaysi holatdan qaysi holatga o'tkaza oladi */
const FLOW: Record<string, BookingStatus[]> = {
  pending: ['accepted', 'rejected'],
  accepted: ['on_way', 'completed', 'cancelled'],
  on_way: ['completed', 'cancelled'],
};

const CLIENT_MSG: Partial<Record<BookingStatus, string>> = {
  accepted: '✅ <b>Buyurtmangiz qabul qilindi!</b>',
  rejected: '😔 <b>Afsus, usta buyurtmani qabul qila olmadi.</b> Boshqa ustani tanlab ko\'ring.',
  on_way: '🚗 <b>Usta yo\'lga chiqdi!</b>',
  completed: '🎉 <b>Ish bajarildi!</b> Iltimos, ustani baholang — bu boshqalarga yordam beradi.',
  cancelled: '❌ <b>Buyurtma usta tomonidan bekor qilindi.</b>',
};

export async function setBookingStatus(fd: FormData) {
  const s = await requireProvider();
  const id = str(fd, 'id');
  const status = str(fd, 'status') as BookingStatus;
  const { data: b } = await db()
    .from('bookings')
    .select('*, client:clients(telegram_id), provider:providers(full_name,phone)')
    .eq('id', id)
    .eq('provider_id', s.id)
    .maybeSingle();
  if (!b || !FLOW[b.status]?.includes(status)) return;

  await db().from('bookings').update({ status }).eq('id', id);
  if (b.slot_id && (status === 'rejected' || status === 'cancelled')) {
    await db().from('slots').update({ is_booked: false }).eq('id', b.slot_id);
  }
  const msg = CLIENT_MSG[status];
  if (msg) {
    await notify(
      b.client?.telegram_id,
      `${msg}\n\n👷 ${esc(b.provider?.full_name)}` + (b.provider?.phone ? `\n📞 ${esc(b.provider.phone)}` : '') + `\n🕒 ${fmtDateTime(b.scheduled_at)}\n📍 ${esc(b.address)}`,
      true,
    );
  }
  revalidatePath('/panel');
}

export async function addSlots(fd: FormData) {
  const s = await requireProvider();
  const path = '/panel/schedule';
  const dates = fd.getAll('dates').map(String).filter(Boolean);
  const from = str(fd, 'from');
  const to = str(fd, 'to');
  const duration = Math.max(30, Number(fd.get('duration')) || 60);
  if (!dates.length) back(path, 'error', 'Kamida bitta kunni tanlang');
  if (!/^\d{2}:\d{2}$/.test(from) || !/^\d{2}:\d{2}$/.test(to) || from >= to) back(path, 'error', "Vaqt oralig'i noto'g'ri");

  const now = Date.now();
  const rows: { provider_id: string; starts_at: string; ends_at: string }[] = [];
  for (const date of dates) {
    let t = new Date(toUtcIso(date, from)).getTime();
    const end = new Date(toUtcIso(date, to)).getTime();
    while (t + duration * 60_000 <= end) {
      if (t > now) rows.push({ provider_id: s.id, starts_at: new Date(t).toISOString(), ends_at: new Date(t + duration * 60_000).toISOString() });
      t += duration * 60_000;
    }
  }
  if (!rows.length) back(path, 'error', "Kelajakdagi vaqt topilmadi — o'tgan vaqtni qo'shib bo'lmaydi");
  const { error } = await db().from('slots').upsert(rows, { onConflict: 'provider_id,starts_at', ignoreDuplicates: true });
  if (error) back(path, 'error', error.message);
  revalidatePath(path);
  back(path, 'ok', `${rows.length} ta bo'sh vaqt qo'shildi`);
}

export async function deleteSlot(fd: FormData) {
  const s = await requireProvider();
  await db().from('slots').delete().eq('id', str(fd, 'id')).eq('provider_id', s.id).eq('is_booked', false);
  revalidatePath('/panel/schedule');
}

export async function clearDay(fd: FormData) {
  const s = await requireProvider();
  const date = str(fd, 'date');
  await db()
    .from('slots')
    .delete()
    .eq('provider_id', s.id)
    .eq('is_booked', false)
    .gte('starts_at', toUtcIso(date, '00:00'))
    .lt('starts_at', new Date(new Date(toUtcIso(date, '00:00')).getTime() + 86400_000).toISOString());
  revalidatePath('/panel/schedule');
}

export async function toggleAvailable() {
  const s = await requireProvider();
  const { data } = await db().from('providers').select('is_available').eq('id', s.id).single();
  await db().from('providers').update({ is_available: !data?.is_available }).eq('id', s.id);
  revalidatePath('/panel', 'layout');
}

export async function updateProfile(fd: FormData) {
  const s = await requireProvider();
  const chat = str(fd, 'telegram_chat_id');
  const { error } = await db()
    .from('providers')
    .update({
      phone: str(fd, 'phone') || null,
      bio: str(fd, 'bio') || null,
      district: str(fd, 'district') || null,
      price_from: Math.max(0, Math.round(Number(fd.get('price_from')) || 0)),
      price_unit: str(fd, 'price_unit') || 'xizmat',
      experience_years: Math.max(0, Math.round(Number(fd.get('experience_years')) || 0)),
      telegram_chat_id: /^-?\d+$/.test(chat) ? Number(chat) : null,
    })
    .eq('id', s.id);
  if (error) back('/panel/profile', 'error', error.message);
  back('/panel/profile', 'ok', 'Profil saqlandi');
}

export async function changePassword(fd: FormData) {
  const s = await requireProvider();
  const current = str(fd, 'current');
  const next = str(fd, 'next');
  const path = '/panel/profile';
  if (next.length < 6) back(path, 'error', "Yangi parol kamida 6 belgi bo'lsin");
  const { data } = await db().from('providers').select('password_hash').eq('id', s.id).single();
  if (!data || !(await bcrypt.compare(current, data.password_hash))) back(path, 'error', "Joriy parol noto'g'ri");
  await db().from('providers').update({ password_hash: await bcrypt.hash(next, 10) }).eq('id', s.id);
  back(path, 'ok', "Parol o'zgartirildi");
}
