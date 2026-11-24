'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Search, Sparkles, X } from 'lucide-react';
import { api, haptic, useTg } from '@/components/app/tg';
import { BottomNav, ErrorBox, ProviderCard, SkeletonCard } from '@/components/app/ui';
import type { Category, PublicProvider } from '@/lib/types';

export default function MiniHome() {
  const { user } = useTg();
  const [cats, setCats] = useState<Category[] | null>(null);
  const [top, setTop] = useState<PublicProvider[] | null>(null);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const [found, setFound] = useState<PublicProvider[] | null>(null);

  const load = () => {
    setErr('');
    api<{ categories: Category[] }>('/api/app/categories').then((r) => setCats(r.categories)).catch((e) => setErr(e.message));
    api<{ providers: PublicProvider[] }>('/api/app/providers?available=1&limit=6').then((r) => setTop(r.providers)).catch(() => setTop([]));
  };
  useEffect(() => {
    load();
    api('/api/app/me', { method: 'POST' }).catch(() => {}); // mijozni ro'yxatga olish
  }, []);

  useEffect(() => {
    if (q.trim().length < 2) return setFound(null);
    const t = setTimeout(() => {
      api<{ providers: PublicProvider[] }>(`/api/app/providers?q=${encodeURIComponent(q.trim())}&limit=20`).then((r) => setFound(r.providers)).catch(() => setFound([]));
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const filtered = useMemo(
    () => (cats ?? []).filter((c) => !q.trim() || c.name.toLowerCase().includes(q.trim().toLowerCase())),
    [cats, q],
  );
  const hour = new Date().getHours();
  const greet = hour < 5 ? 'Xayrli tun' : hour < 12 ? 'Xayrli tong' : hour < 18 ? 'Xayrli kun' : 'Xayrli kech';

  return (
    <>
      {/* Hero */}
      <section className="relative -mx-4 mb-5 overflow-hidden rounded-b-[2rem] bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 px-5 pb-7 pt-6 text-white">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 left-10 h-40 w-40 rounded-full bg-fuchsia-300/30 blur-2xl" />
        <div className="relative">
          <div className="text-sm font-medium text-indigo-100">{greet}{user ? `, ${user.first_name}` : ''} 👋</div>
          <h1 className="mt-1 text-[26px] font-extrabold leading-tight tracking-tight">Qanday usta<br />kerak bugun?</h1>
          <div className="relative mt-5">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Santexnik, elektrik, ism..."
              className="w-full rounded-2xl border-0 bg-white py-3.5 pl-12 pr-10 text-[15px] font-medium text-slate-900 shadow-xl shadow-indigo-900/20 outline-none placeholder:text-slate-400"
            />
            {q && <button onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400"><X className="h-4 w-4" /></button>}
          </div>
        </div>
      </section>

      {err && <ErrorBox text={err} onRetry={load} />}

      {/* Qidiruv natijalari */}
      {found && (
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-bold text-slate-500">Ustalar ({found.length})</h2>
          <div className="space-y-3">
            {found.map((p, i) => <ProviderCard key={p.id} p={p} i={i} />)}
            {!found.length && <div className="card p-5 text-center text-sm text-slate-400">Usta topilmadi</div>}
          </div>
        </section>
      )}

      {/* Kategoriyalar */}
      <section className="mb-7">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-extrabold tracking-tight">Xizmatlar</h2>
          {cats && <span className="text-xs font-semibold text-slate-400">{cats.length} tur</span>}
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {!cats &&
            Array.from({ length: 9 }).map((_, i) => <div key={i} className="h-[118px] animate-pulse rounded-2xl bg-slate-200 dark:bg-white/10" />)}
          {filtered.map((c, i) => (
            <Link
              key={c.id}
              href={`/app/c/${c.slug}`}
              onClick={() => haptic('light')}
              style={{ animationDelay: `${i * 25}ms` }}
              className="group relative flex min-h-[118px] animate-fade-up flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-2 text-center shadow-soft transition active:scale-95 dark:border-white/10 dark:bg-white/[.04]"
            >
              <div className="absolute inset-x-0 top-0 h-1/2 opacity-[.08]" style={{ background: `radial-gradient(circle at 50% 0%, ${c.color}, transparent 70%)` }} />
              <div className="relative grid h-12 w-12 place-items-center rounded-2xl text-[26px]" style={{ background: `${c.color}1a` }}>{c.icon}</div>
              <div className="relative text-[12px] font-bold leading-[1.25] [overflow-wrap:anywhere]">{c.name}</div>
              {(c.providers_count ?? 0) > 0 && <div className="relative -mt-1 text-[10px] font-semibold text-slate-400">{c.providers_count} usta</div>}
            </Link>
          ))}
        </div>
      </section>

      {/* Bo'sh ustalar */}
      {!found && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-extrabold tracking-tight">Hozir bo'sh ustalar</h2>
          </div>
          <div className="space-y-3">
            {!top && [0, 1, 2].map((i) => <SkeletonCard key={i} />)}
            {top?.map((p, i) => <ProviderCard key={p.id} p={p} i={i} />)}
            {top && !top.length && <div className="card p-6 text-center text-sm text-slate-400">Hozircha bo'sh ustalar yo'q</div>}
          </div>
        </section>
      )}

      <BottomNav />
    </>
  );
}
