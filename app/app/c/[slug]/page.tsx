'use client';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { api, haptic, useBackButton } from '@/components/app/tg';
import { BottomNav, ErrorBox, ProviderCard, SkeletonCard, TopBar } from '@/components/app/ui';
import type { Category, PublicProvider } from '@/lib/types';

type Sort = 'all' | 'free' | 'rating' | 'cheap';
const FILTERS: [Sort, string][] = [['all', 'Hammasi'], ['free', "🟢 Bo'sh"], ['rating', '⭐ Reyting'], ['cheap', "💸 Arzon"]];

export default function CategoryPage() {
  useBackButton();
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<{ category: Category; providers: PublicProvider[] } | null>(null);
  const [err, setErr] = useState('');
  const [sort, setSort] = useState<Sort>('all');

  const load = () => {
    setErr('');
    api(`/api/app/providers?category=${slug}`).then(setData).catch((e) => setErr(e.message));
  };
  useEffect(load, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  const list = useMemo(() => {
    const ps = [...(data?.providers ?? [])];
    if (sort === 'free') return ps.filter((p) => p.is_available && p.next_slot);
    if (sort === 'rating') return ps.sort((a, b) => b.rating - a.rating);
    if (sort === 'cheap') return ps.sort((a, b) => (a.price_from || 1e12) - (b.price_from || 1e12));
    return ps;
  }, [data, sort]);

  return (
    <>
      <TopBar title={data ? `${data.category.icon} ${data.category.name}` : 'Yuklanmoqda...'} />
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
        {FILTERS.map(([k, l]) => (
          <button key={k} onClick={() => { haptic('select'); setSort(k); }} className={`chip ${sort === k ? 'chip-active' : ''}`}>{l}</button>
        ))}
      </div>
      {err && <ErrorBox text={err} onRetry={load} />}
      <div className="space-y-3">
        {!data && !err && [0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        {list.map((p, i) => <ProviderCard key={p.id} p={p} i={i} />)}
        {data && !list.length && (
          <div className="card px-6 py-10 text-center">
            <div className="text-4xl">🔍</div>
            <div className="mt-3 font-bold">Ustalar topilmadi</div>
            <div className="mt-1 text-sm text-slate-500">Tez orada bu bo'limga yangi ustalar qo'shiladi</div>
          </div>
        )}
      </div>
      <BottomNav />
    </>
  );
}
