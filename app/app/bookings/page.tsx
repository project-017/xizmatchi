'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Loader2, MapPin, Phone, Star } from 'lucide-react';
import { api, haptic, tg } from '@/components/app/tg';
import { BottomNav, ErrorBox, SkeletonCard } from '@/components/app/ui';
import { Avatar } from '@/components/Avatar';
import { StatusBadge } from '@/components/StatusBadge';
import { fmtDateTime } from '@/lib/format';
import type { Booking } from '@/lib/types';

type B = Booking & { provider: { id: string; full_name: string; phone: string | null; avatar_url: string | null; category: { name: string; icon: string } | null } | null };

function Rate({ b, onDone }: { b: B; onDone: () => void }) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <div className="mt-3 rounded-2xl bg-amber-50 p-3.5 dark:bg-amber-500/10">
      <div className="text-sm font-bold text-amber-900 dark:text-amber-200">Ustani baholang</div>
      <div className="mt-2 flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => { haptic('select'); setRating(n); }} className="transition active:scale-90">
            <Star className={`h-8 w-8 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-amber-200 dark:text-amber-500/30'}`} />
          </button>
        ))}
      </div>
      {rating > 0 && (
        <div className="mt-3 animate-fade-up space-y-2">
          <textarea rows={2} value={review} onChange={(e) => setReview(e.target.value)} className="input" placeholder="Fikringiz (ixtiyoriy)" />
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await api(`/api/app/bookings/${b.id}`, { method: 'PATCH', body: JSON.stringify({ action: 'rate', rating, review }) });
                haptic('success');
                onDone();
              } catch (e) {
                tg()?.showAlert?.((e as Error).message) ?? alert((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
            className="btn-primary w-full"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Yuborish
          </button>
        </div>
      )}
    </div>
  );
}

export default function MyBookings() {
  const [list, setList] = useState<B[] | null>(null);
  const [err, setErr] = useState('');
  const [tab, setTab] = useState<'active' | 'history'>('active');

  const load = () => {
    setErr('');
    api<{ bookings: B[] }>('/api/app/me', { method: 'POST' }).then((r) => setList(r.bookings)).catch((e) => setErr(e.message));
  };
  useEffect(load, []);

  const cancel = (b: B) => {
    const doIt = async () => {
      try {
        await api(`/api/app/bookings/${b.id}`, { method: 'PATCH', body: JSON.stringify({ action: 'cancel' }) });
        haptic('success');
        load();
      } catch (e) {
        haptic('error');
        alert((e as Error).message);
      }
    };
    const w = tg();
    if (w?.showConfirm) w.showConfirm('Buyurtmani bekor qilasizmi?', (ok: boolean) => ok && doIt());
    else if (confirm('Buyurtmani bekor qilasizmi?')) doIt();
  };

  const active = (list ?? []).filter((b) => ['pending', 'accepted', 'on_way'].includes(b.status));
  const history = (list ?? []).filter((b) => !['pending', 'accepted', 'on_way'].includes(b.status));
  const shown = tab === 'active' ? active : history;

  return (
    <>
      <div className="pb-2 pt-5">
        <h1 className="text-2xl font-extrabold tracking-tight">Buyurtmalarim</h1>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-2xl bg-slate-200/60 p-1 dark:bg-white/5">
        {(['active', 'history'] as const).map((k) => (
          <button
            key={k}
            onClick={() => { haptic('select'); setTab(k); }}
            className={`rounded-xl py-2.5 text-sm font-bold transition ${tab === k ? 'bg-white text-slate-900 shadow-soft dark:bg-white/15 dark:text-white' : 'text-slate-500'}`}
          >
            {k === 'active' ? `Faol${active.length ? ` (${active.length})` : ''}` : 'Tarix'}
          </button>
        ))}
      </div>

      {err && <ErrorBox text={err} onRetry={load} />}
      <div className="space-y-3">
        {!list && !err && [0, 1].map((i) => <SkeletonCard key={i} />)}
        {list && !shown.length && (
          <div className="card px-6 py-12 text-center">
            <div className="text-5xl">{tab === 'active' ? '🧰' : '📜'}</div>
            <div className="mt-3 font-bold">{tab === 'active' ? "Faol buyurtmalar yo'q" : "Tarix bo'sh"}</div>
            <Link href="/app" className="btn-primary mt-5">Usta topish</Link>
          </div>
        )}
        {shown.map((b, i) => (
          <div key={b.id} style={{ animationDelay: `${i * 40}ms` }} className="card animate-fade-up p-4">
            <div className="flex items-start gap-3">
              <Avatar name={b.provider?.full_name ?? '?'} url={b.provider?.avatar_url} size={48} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/app/p/${b.provider_id}`} className="truncate font-bold">{b.provider?.full_name}</Link>
                  <StatusBadge status={b.status} />
                </div>
                <div className="text-xs text-slate-500">{b.provider?.category?.icon} {b.provider?.category?.name}</div>
              </div>
            </div>
            <div className="mt-3 space-y-1.5 rounded-xl bg-slate-50 p-3 text-sm dark:bg-white/5">
              <div className="font-bold">🕒 {fmtDateTime(b.scheduled_at)}</div>
              <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> <span className="break-words">{b.address}</span></div>
            </div>
            {b.status === 'completed' && !b.rating && <Rate b={b} onDone={load} />}
            {b.rating && (
              <div className="mt-3 flex items-center gap-1 text-sm">
                {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`h-4 w-4 ${n <= b.rating! ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />)}
                <span className="ml-1 text-xs text-slate-500">Sizning bahoingiz</span>
              </div>
            )}
            {['pending', 'accepted', 'on_way'].includes(b.status) && (
              <div className="mt-3 flex gap-2">
                {b.provider?.phone && ['accepted', 'on_way'].includes(b.status) && (
                  <a href={`tel:${b.provider.phone}`} className="btn-success flex-1"><Phone className="h-4 w-4" /> Qo'ng'iroq</a>
                )}
                {['pending', 'accepted'].includes(b.status) && (
                  <button onClick={() => cancel(b)} className="btn-danger flex-1">Bekor qilish</button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <BottomNav />
    </>
  );
}
