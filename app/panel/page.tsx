import Link from 'next/link';
import { Check, ClipboardList, MapPin, Navigation, Phone, StickyNote, X } from 'lucide-react';
import { requireProvider } from '@/lib/auth';
import { db } from '@/lib/supabase';
import { PageHeader, Empty } from '@/components/Shell';
import { StatusBadge } from '@/components/StatusBadge';
import { SubmitButton } from '@/components/SubmitButton';
import { AvailabilityToggle } from '@/components/AvailabilityToggle';
import { fmtDate, fmtTime, timeAgo } from '@/lib/format';
import type { BookingStatus } from '@/lib/types';
import { setBookingStatus } from './actions';

const TABS = [
  { k: 'active', label: 'Faol', statuses: ['pending', 'accepted', 'on_way'] },
  { k: 'done', label: 'Bajarilgan', statuses: ['completed'] },
  { k: 'closed', label: 'Bekor / rad', statuses: ['cancelled', 'rejected'] },
];

function Action({ id, status, children, cls }: { id: string; status: BookingStatus; children: React.ReactNode; cls: string }) {
  return (
    <form action={setBookingStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <SubmitButton className={cls}>{children}</SubmitButton>
    </form>
  );
}

export default async function PanelHome({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const s = await requireProvider();
  const { tab = 'active' } = await searchParams;
  const current = TABS.find((t) => t.k === tab) ?? TABS[0];
  const [{ data: me }, { data: bookings }, { count: pending }, { count: freeSlots }] = await Promise.all([
    db().from('providers').select('is_available,rating,jobs_done,reviews_count').eq('id', s.id).single(),
    db()
      .from('bookings')
      .select('*, client:clients(first_name,last_name,username)')
      .eq('provider_id', s.id)
      .in('status', current.statuses)
      .order('scheduled_at', { ascending: current.k === 'active' })
      .limit(100),
    db().from('bookings').select('id', { count: 'exact', head: true }).eq('provider_id', s.id).eq('status', 'pending'),
    db().from('slots').select('id', { count: 'exact', head: true }).eq('provider_id', s.id).eq('is_booked', false).gt('starts_at', new Date().toISOString()),
  ]);

  return (
    <>
      <PageHeader title={`Salom, ${s.name.split(' ')[0]} 👋`} subtitle="Bugungi buyurtmalaringiz" action={<AvailabilityToggle available={!!me?.is_available} />} />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['Yangi', pending ?? 0, 'text-amber-600'],
          ["Bo'sh vaqtlar", freeSlots ?? 0, 'text-indigo-600'],
          ['Bajarilgan', me?.jobs_done ?? 0, 'text-emerald-600'],
          ['Reyting', `⭐ ${Number(me?.rating ?? 0).toFixed(1)}`, 'text-slate-900'],
        ].map(([l, v, c]) => (
          <div key={String(l)} className="card p-4"><div className={`text-2xl font-extrabold ${c}`}>{v}</div><div className="text-xs text-slate-500">{l}</div></div>
        ))}
      </div>
      {freeSlots === 0 && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-4 text-sm text-indigo-800">
          Mijozlar sizni band qilishi uchun bo'sh vaqtlaringizni qo'shing.
          <Link href="/panel/schedule" className="btn-primary btn-sm">Jadvalga o'tish</Link>
        </div>
      )}

      <div className="mb-5 flex gap-2">
        {TABS.map((t) => (
          <Link key={t.k} href={`/panel?tab=${t.k}`} className={`chip ${t.k === current.k ? 'chip-active' : ''}`}>{t.label}</Link>
        ))}
      </div>

      {!bookings?.length ? (
        <Empty icon={<ClipboardList className="h-6 w-6" />} title="Buyurtmalar yo'q" text="Yangi buyurtma kelganda shu yerda va Telegramda xabar olasiz." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {bookings.map((b) => (
            <div key={b.id} className="card flex flex-col p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
                    <div className="text-center leading-none"><div className="text-lg font-extrabold">{fmtTime(b.scheduled_at)}</div><div className="mt-0.5 text-[10px] opacity-80">{fmtDate(b.scheduled_at)}</div></div>
                  </div>
                  <div>
                    <div className="font-bold">{b.client?.first_name} {b.client?.last_name}</div>
                    <div className="text-xs text-slate-500">{b.client?.username ? `@${b.client.username} · ` : ''}{timeAgo(b.created_at)}</div>
                  </div>
                </div>
                <StatusBadge status={b.status} />
              </div>
              <div className="space-y-2 text-sm">
                <a href={`tel:${b.phone}`} className="flex items-center gap-2 font-semibold text-indigo-600"><Phone className="h-4 w-4" /> {b.phone}</a>
                <a href={`https://yandex.uz/maps/?text=${encodeURIComponent(b.address)}`} target="_blank" className="flex items-start gap-2 text-slate-700"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /> {b.address}</a>
                {b.note && <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-slate-600"><StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /> {b.note}</div>}
                {b.rating && <div className="rounded-xl bg-amber-50 p-3 text-amber-800">{'⭐'.repeat(b.rating)} {b.review && `— ${b.review}`}</div>}
              </div>
              <div className="mt-auto flex flex-wrap gap-2 pt-4">
                {b.status === 'pending' && (
                  <>
                    <Action id={b.id} status="accepted" cls="btn-success flex-1"><Check className="h-4 w-4" /> Qabul qilish</Action>
                    <Action id={b.id} status="rejected" cls="btn-danger"><X className="h-4 w-4" /> Rad etish</Action>
                  </>
                )}
                {b.status === 'accepted' && (
                  <>
                    <Action id={b.id} status="on_way" cls="btn-primary flex-1"><Navigation className="h-4 w-4" /> Yo'ldaman</Action>
                    <Action id={b.id} status="completed" cls="btn-success"><Check className="h-4 w-4" /> Bajarildi</Action>
                    <Action id={b.id} status="cancelled" cls="btn-ghost">Bekor</Action>
                  </>
                )}
                {b.status === 'on_way' && (
                  <>
                    <Action id={b.id} status="completed" cls="btn-success flex-1"><Check className="h-4 w-4" /> Ish bajarildi</Action>
                    <Action id={b.id} status="cancelled" cls="btn-ghost">Bekor</Action>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
