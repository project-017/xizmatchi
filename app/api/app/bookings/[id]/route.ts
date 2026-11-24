import { db } from '@/lib/supabase';
import { getTgClient, json, unauthorized } from '@/lib/tg-client';
import { notify, esc } from '@/lib/telegram';
import { fmtDateTime } from '@/lib/format';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const client = await getTgClient(req);
  if (!client) return unauthorized();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const { data: b } = await db()
    .from('bookings')
    .select('*, provider:providers(telegram_chat_id)')
    .eq('id', id)
    .eq('client_id', client.id)
    .maybeSingle();
  if (!b) return json({ error: 'Buyurtma topilmadi' }, 404);

  if (body.action === 'cancel') {
    if (!['pending', 'accepted'].includes(b.status)) return json({ error: 'Bu buyurtmani bekor qilib bo\'lmaydi' }, 400);
    await db().from('bookings').update({ status: 'cancelled' }).eq('id', id);
    if (b.slot_id) await db().from('slots').update({ is_booked: false }).eq('id', b.slot_id);
    await notify(
      b.provider?.telegram_chat_id,
      `❌ <b>Buyurtma bekor qilindi</b>\n\n👤 ${esc(client.first_name)}\n🕒 ${fmtDateTime(b.scheduled_at)}\n📍 ${esc(b.address)}`,
    );
    return json({ ok: true });
  }

  if (body.action === 'rate') {
    const rating = Math.round(Number(body.rating));
    if (b.status !== 'completed') return json({ error: 'Faqat bajarilgan ishni baholash mumkin' }, 400);
    if (!(rating >= 1 && rating <= 5)) return json({ error: 'Baho 1 dan 5 gacha' }, 400);
    const review = String(body.review || '').trim().slice(0, 500) || null;
    await db().from('bookings').update({ rating, review }).eq('id', id);
    return json({ ok: true });
  }

  return json({ error: "Noma'lum amal" }, 400);
}
