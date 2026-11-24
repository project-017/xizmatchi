import { db } from '@/lib/supabase';
import { json } from '@/lib/tg-client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [cats, provs] = await Promise.all([
    db().from('categories').select('*').eq('is_active', true).order('sort').order('name'),
    db().from('providers').select('category_id').eq('is_active', true),
  ]);
  if (cats.error) return json({ error: cats.error.message }, 500);
  const counts = new Map<string, number>();
  for (const p of provs.data ?? []) if (p.category_id) counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1);
  return json({ categories: cats.data.map((c) => ({ ...c, providers_count: counts.get(c.id) ?? 0 })) });
}
