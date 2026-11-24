import { db } from '@/lib/supabase';
import { json } from '@/lib/tg-client';
import { PUBLIC_PROVIDER_COLS } from '@/lib/public';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: provider } = await db().from('providers').select(PUBLIC_PROVIDER_COLS).eq('id', id).eq('is_active', true).maybeSingle();
  if (!provider) return json({ error: 'Usta topilmadi' }, 404);

  const now = new Date();
  const until = new Date(now.getTime() + 21 * 86400_000);
  const [slots, reviews] = await Promise.all([
    db()
      .from('slots')
      .select('id,starts_at,ends_at')
      .eq('provider_id', id)
      .eq('is_booked', false)
      .gt('starts_at', now.toISOString())
      .lt('starts_at', until.toISOString())
      .order('starts_at'),
    db()
      .from('bookings')
      .select('id,rating,review,updated_at,client:clients(first_name)')
      .eq('provider_id', id)
      .not('rating', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(10),
  ]);

  return json({ provider, slots: slots.data ?? [], reviews: reviews.data ?? [] });
}
