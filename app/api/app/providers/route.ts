import { db } from '@/lib/supabase';
import { json } from '@/lib/tg-client';
import { PUBLIC_PROVIDER_COLS } from '@/lib/public';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const slug = sp.get('category');
  const q = sp.get('q')?.trim();
  const limit = Math.min(Number(sp.get('limit')) || 50, 100);

  let query = db().from('providers').select(PUBLIC_PROVIDER_COLS).eq('is_active', true);

  let category = null;
  if (slug) {
    const { data } = await db().from('categories').select('*').eq('slug', slug).maybeSingle();
    if (!data) return json({ error: 'Kategoriya topilmadi' }, 404);
    category = data;
    query = query.eq('category_id', data.id);
  }
  if (sp.get('available') === '1') query = query.eq('is_available', true);
  if (q) query = query.or(`full_name.ilike.%${q.replace(/[%,()]/g, '')}%,district.ilike.%${q.replace(/[%,()]/g, '')}%`);

  const { data, error } = await query.order('is_available', { ascending: false }).order('rating', { ascending: false }).limit(limit);
  if (error) return json({ error: error.message }, 500);

  // Har bir usta uchun eng yaqin bo'sh vaqt
  const ids = data.map((p) => p.id);
  const next = new Map<string, string>();
  if (ids.length) {
    const { data: slots } = await db()
      .from('slots')
      .select('provider_id,starts_at')
      .in('provider_id', ids)
      .eq('is_booked', false)
      .gt('starts_at', new Date().toISOString())
      .order('starts_at')
      .limit(500);
    for (const s of slots ?? []) if (!next.has(s.provider_id)) next.set(s.provider_id, s.starts_at);
  }

  return json({ category, providers: data.map((p) => ({ ...p, next_slot: next.get(p.id) ?? null })) });
}
