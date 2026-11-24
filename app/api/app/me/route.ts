import { db } from '@/lib/supabase';
import { getTgClient, json, unauthorized } from '@/lib/tg-client';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const client = await getTgClient(req);
  if (!client) return unauthorized();
  const { data: bookings } = await db()
    .from('bookings')
    .select('*, provider:providers(id,full_name,phone,avatar_url,category:categories(name,icon,color))')
    .eq('client_id', client.id)
    .order('created_at', { ascending: false })
    .limit(50);
  return json({ client, bookings: bookings ?? [] });
}
