import { db } from '@/lib/supabase';
import { getTgClient, json, unauthorized } from '@/lib/tg-client';
import { notify, notifyAdmin, esc } from '@/lib/telegram';
import { appUrl as getAppUrl } from '@/lib/settings';
import { fmtDateTime } from '@/lib/format';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const client = await getTgClient(req);
  if (!client) return unauthorized();
  if (client.is_blocked) return json({ error: 'Hisobingiz bloklangan' }, 403);

  const body = await req.json().catch(() => ({}));
  const slotId = String(body.slot_id || '');
  const address = String(body.address || '').trim().slice(0, 300);
  const phone = String(body.phone || '').trim().slice(0, 32);
  const note = String(body.note || '').trim().slice(0, 1000) || null;
  if (!slotId) return json({ error: 'Vaqtni tanlang' }, 400);
  if (address.length < 3) return json({ error: 'Manzilni kiriting' }, 400);
  if (phone.replace(/\D/g, '').length < 9) return json({ error: "Telefon raqamni to'g'ri kiriting" }, 400);

  const { count } = await db()
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', client.id)
    .eq('status', 'pending');
  if ((count ?? 0) >= 5) return json({ error: "Sizda tasdiqlanmagan buyurtmalar ko'p. Avval ularni yakunlang." }, 429);

  // Atomik band qilish: faqat bo'sh va kelajakdagi slot
  const { data: slot } = await db()
    .from('slots')
    .update({ is_booked: true })
    .eq('id', slotId)
    .eq('is_booked', false)
    .gt('starts_at', new Date().toISOString())
    .select('*')
    .maybeSingle();
  if (!slot) return json({ error: "Afsus, bu vaqt band bo'lib qoldi. Boshqa vaqt tanlang." }, 409);

  const { data: provider } = await db()
    .from('providers')
    .select('id,full_name,is_active,telegram_chat_id')
    .eq('id', slot.provider_id)
    .single();
  if (!provider?.is_active) {
    await db().from('slots').update({ is_booked: false }).eq('id', slot.id);
    return json({ error: 'Usta hozircha faol emas' }, 409);
  }

  const { data: booking, error } = await db()
    .from('bookings')
    .insert({ client_id: client.id, provider_id: provider.id, slot_id: slot.id, scheduled_at: slot.starts_at, address, phone, note })
    .select('*')
    .single();
  if (error) {
    await db().from('slots').update({ is_booked: false }).eq('id', slot.id);
    return json({ error: error.message }, 500);
  }

  await db().from('clients').update({ phone }).eq('id', client.id);

  const appUrl = await getAppUrl();
  await notify(
    provider.telegram_chat_id,
    `🆕 <b>Yangi buyurtma!</b>\n\n` +
      `👤 ${esc(client.first_name)} ${esc(client.last_name)}\n` +
      `📞 ${esc(phone)}\n🕒 ${fmtDateTime(slot.starts_at)}\n📍 ${esc(address)}` +
      (note ? `\n📝 ${esc(note)}` : '') +
      (appUrl ? `\n\nQabul qilish: ${appUrl}/panel` : ''),
  );

  await notifyAdmin(
    `🆕 <b>Yangi buyurtma</b>\n👷 ${esc(provider.full_name)}\n👤 ${esc(client.first_name)} · ${esc(phone)}\n🕒 ${fmtDateTime(slot.starts_at)}\n📍 ${esc(address)}`,
  );

  return json({ booking });
}
