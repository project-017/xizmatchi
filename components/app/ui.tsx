'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ClipboardList, Home, MapPin, Star, Clock } from 'lucide-react';
import { Avatar } from '../Avatar';
import { fmtTime, dayKey, todayKey, addDays, money, fmtDate } from '@/lib/format';
import type { PublicProvider } from '@/lib/types';
import { haptic, tg } from './tg';

export function BottomNav() {
  const path = usePathname();
  const items = [
    { href: '/app', label: 'Asosiy', icon: Home },
    { href: '/app/bookings', label: 'Buyurtmalarim', icon: ClipboardList },
  ];
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/70 bg-white/85 px-6 pt-2 backdrop-blur-xl dark:border-white/10 dark:bg-ink/85">
      <div className="mx-auto flex max-w-md justify-around">
        {items.map(({ href, label, icon: Icon }) => {
          const active = path === href;
          return (
            <Link key={href} href={href} onClick={() => haptic('select')} className="flex flex-col items-center gap-1 px-4 py-1">
              <div className={`grid h-9 w-14 place-items-center rounded-full transition ${active ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-glow' : 'text-slate-400'}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className={`text-[11px] font-bold ${active ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** Telegram'dan tashqarida (brauzerda) ko'rinadigan orqaga tugmasi */
export function TopBar({ title, back = '/app' }: { title: string; back?: string }) {
  const inTg = !!tg()?.initData;
  return (
    <div className="sticky top-0 z-30 -mx-4 mb-4 flex items-center gap-2 bg-slate-50/85 px-4 py-3 backdrop-blur-xl dark:bg-ink/85">
      {!inTg && (
        <Link href={back} className="grid h-9 w-9 place-items-center rounded-xl bg-white shadow-soft dark:bg-white/10"><ChevronLeft className="h-5 w-5" /></Link>
      )}
      <h1 className="truncate text-lg font-extrabold tracking-tight">{title}</h1>
    </div>
  );
}

export function nextSlotLabel(iso?: string | null) {
  if (!iso) return null;
  const k = dayKey(iso);
  const t = fmtTime(iso);
  if (k === todayKey()) return `Bugun ${t}`;
  if (k === addDays(todayKey(), 1)) return `Ertaga ${t}`;
  return `${fmtDate(iso)} ${t}`;
}

export function ProviderCard({ p, i = 0 }: { p: PublicProvider; i?: number }) {
  const free = p.is_available && !!p.next_slot;
  return (
    <Link
      href={`/app/p/${p.id}`}
      onClick={() => haptic('light')}
      style={{ animationDelay: `${i * 40}ms` }}
      className="card flex animate-fade-up gap-3.5 p-3.5 transition active:scale-[.98]"
    >
      <div className="relative">
        <Avatar name={p.full_name} url={p.avatar_url} size={64} />
        <span className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-[3px] border-white dark:border-ink ${free ? 'bg-emerald-500' : 'bg-slate-300'}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="truncate font-bold">{p.full_name}</div>
          <div className="flex shrink-0 items-center gap-0.5 text-sm font-bold">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {Number(p.rating) > 0 ? Number(p.rating).toFixed(1) : 'Yangi'}
          </div>
        </div>
        <div className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500 dark:text-slate-400">
          {p.category && <span>{p.category.icon} {p.category.name}</span>}
          {p.experience_years > 0 && <span>· {p.experience_years} yil tajriba</span>}
        </div>
        {p.district && <div className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-400"><MapPin className="h-3 w-3" /> {p.district}</div>}
        <div className="mt-2 flex items-center justify-between gap-2">
          {free ? (
            <span className="badge bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"><Clock className="h-3 w-3" /> {nextSlotLabel(p.next_slot)}</span>
          ) : (
            <span className="badge bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400">Hozir band</span>
          )}
          {p.price_from > 0 && <span className="text-xs font-bold text-indigo-600 dark:text-indigo-300">{money(p.price_from)} dan</span>}
        </div>
      </div>
    </Link>
  );
}

export function SkeletonCard() {
  return (
    <div className="card flex gap-3.5 p-3.5">
      <div className="h-16 w-16 animate-pulse rounded-2xl bg-slate-200 dark:bg-white/10" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
        <div className="h-5 w-24 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
      </div>
    </div>
  );
}

export function ErrorBox({ text, onRetry }: { text: string; onRetry?: () => void }) {
  return (
    <div className="card p-6 text-center">
      <div className="text-3xl">😕</div>
      <div className="mt-2 text-sm text-slate-500">{text}</div>
      {onRetry && <button onClick={onRetry} className="btn-soft mt-4">Qayta urinish</button>}
    </div>
  );
}
