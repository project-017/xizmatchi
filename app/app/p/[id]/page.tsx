'use client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Award, Briefcase, CalendarX, Check, Loader2, LocateFixed, MapPin, Phone, Star } from 'lucide-react';
import { api, haptic, tg, useBackButton } from '@/components/app/tg';
import { ErrorBox, TopBar } from '@/components/app/ui';
import { Avatar } from '@/components/Avatar';
import { dayKey, dayParts, fmtDateTime, fmtTime, money, timeAgo } from '@/lib/format';
import type { PublicProvider } from '@/lib/types';

type SlotT = { id: string; starts_at: string; ends_at: string };
type Review = { id: string; rating: number; review: string | null; updated_at: string; client: { first_name: string } | null };

export default function ProviderPage() {
  useBackButton();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<{ provider: PublicProvider; slots: SlotT[]; reviews: Review[] } | null>(null);
  const [err, setErr] = useState('');
  const [day, setDay] = useState<string>('');
  const [slot, setSlot] = useState<SlotT | null>(null);
  const [form, setForm] = useState({ address: '', phone: '', note: '' });
  const [sending, setSending] = useState(false);
  const [formErr, setFormErr] = useState('');
  const [done, setDone] = useState(false);
  const [locating, setLocating] = useState(false);

  const load = () => {
    setErr('');
    api(`/api/app/providers/${id}`).then((r) => {
      setData(r);
      if (r.slots.length) setDay(dayKey(r.slots[0].starts_at));
    }).catch((e) => setErr(e.message));
  };
  useEffect(() => {
    load();
    api('/api/app/me', { method: 'POST' }).then((r) => r.client?.phone && setForm((f) => ({ ...f, phone: f.phone || r.client.phone }))).catch(() => {});
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const days = useMemo(() => {
    const m = new Map<string, SlotT[]>();
    for (const s of data?.slots ?? []) m.set(dayKey(s.starts_at), [...(m.get(dayKey(s.starts_at)) ?? []), s]);
    return m;
  }, [data]);

  const submit = async () => {
    setFormErr('');
    if (!slot) return setFormErr('Vaqtni tanlang');
    if (form.address.trim().length < 3) return setFormErr('Manzilni kiriting');
    if (form.phone.replace(/\D/g, '').length < 9) return setFormErr('Telefon raqamni kiriting');
    setSending(true);
    try {
      await api('/api/app/bookings', { method: 'POST', body: JSON.stringify({ slot_id: slot.id, ...form }) });
      haptic('success');
      setDone(true);
    } catch (e) {
      haptic('error');
      setFormErr((e as Error).message);
      if ((e as Error).message.includes('band')) { setSlot(null); load(); }
    } finally {
      setSending(false);
    }
  };

  const locate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const link = `https://maps.google.com/?q=${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}`;
        setForm((f) => ({ ...f, address: f.address ? `${f.address} (${link})` : link }));
        setLocating(false);
        haptic('success');
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  if (err) return <><TopBar title="Usta" /><ErrorBox text={err} onRetry={load} /></>;
  if (!data) {
    return (
      <div className="space-y-4 pt-6">
        <div className="mx-auto h-24 w-24 animate-pulse rounded-3xl bg-slate-200 dark:bg-white/10" />
        <div className="mx-auto h-5 w-48 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
        <div className="h-28 animate-pulse rounded-2xl bg-slate-200 dark:bg-white/10" />
      </div>
    );
  }

  const p = data.provider;

  if (done && slot) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center text-center">
        <div className="grid h-24 w-24 animate-pop place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-[0_20px_50px_-15px_rgba(16,185,129,.8)]">
          <Check className="h-12 w-12" strokeWidth={3} />
        </div>
        <h1 className="mt-6 text-2xl font-extrabold">Buyurtma yuborildi!</h1>
        <p className="mt-2 max-w-xs text-sm text-slate-500">
          <b>{p.full_name}</b> buyurtmangizni ko'rib chiqadi. Tasdiqlanganda Telegram orqali xabar olasiz.
        </p>
        <div className="card mt-6 w-full p-4 text-left text-sm">
          <div className="flex justify-between py-1"><span className="text-slate-500">Vaqt</span><b>{fmtDateTime(slot.starts_at)}</b></div>
          <div className="flex justify-between gap-4 py-1"><span className="text-slate-500">Manzil</span><b className="truncate">{form.address}</b></div>
        </div>
        <div className="mt-6 grid w-full gap-2">
          <Link href="/app/bookings" className="btn-primary btn-lg">Buyurtmalarim</Link>
          <button onClick={() => router.push('/app')} className="btn-ghost btn-lg">Bosh sahifa</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <TopBar title={p.category ? `${p.category.icon} ${p.category.name}` : 'Usta'} />

      {/* Profil */}
      <section className="card relative overflow-hidden p-5 text-center">
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-br from-indigo-500/15 via-violet-500/15 to-fuchsia-500/15" />
        <Avatar name={p.full_name} url={p.avatar_url} size={88} className="relative mx-auto rounded-3xl ring-4 ring-white dark:ring-ink" />
        <h1 className="relative mt-3 text-xl font-extrabold">{p.full_name}</h1>
        {p.district && <div className="mt-1 flex items-center justify-center gap-1 text-sm text-slate-500"><MapPin className="h-3.5 w-3.5" /> {p.district}</div>}
        <div className="mt-4 grid grid-cols-3 divide-x divide-slate-100 rounded-2xl bg-slate-50 py-3 dark:divide-white/10 dark:bg-white/5">
          <div><div className="flex items-center justify-center gap-1 font-extrabold"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{Number(p.rating) > 0 ? Number(p.rating).toFixed(1) : '—'}</div><div className="text-[11px] text-slate-500">{p.reviews_count} baho</div></div>
          <div><div className="flex items-center justify-center gap-1 font-extrabold"><Briefcase className="h-4 w-4 text-indigo-500" />{p.jobs_done}</div><div className="text-[11px] text-slate-500">bajarilgan</div></div>
          <div><div className="flex items-center justify-center gap-1 font-extrabold"><Award className="h-4 w-4 text-fuchsia-500" />{p.experience_years}</div><div className="text-[11px] text-slate-500">yil tajriba</div></div>
        </div>
        {p.price_from > 0 && (
          <div className="mt-3 rounded-2xl bg-gradient-to-r from-indigo-50 to-fuchsia-50 py-2.5 text-sm dark:from-indigo-500/10 dark:to-fuchsia-500/10">
            Narx: <b className="text-indigo-700 dark:text-indigo-300">{money(p.price_from)} dan</b> / {p.price_unit}
          </div>
        )}
        {p.bio && <p className="mt-4 whitespace-pre-line text-left text-sm leading-relaxed text-slate-600 dark:text-slate-300">{p.bio}</p>}
        {p.phone && (
          <a href={`tel:${p.phone}`} className="btn-ghost mt-4 w-full"><Phone className="h-4 w-4" /> {p.phone}</a>
        )}
      </section>

      {/* Vaqt tanlash */}
      <section className="mt-6">
        <h2 className="mb-3 text-lg font-extrabold tracking-tight">Vaqtni tanlang</h2>
        {!p.is_available || !days.size ? (
          <div className="card flex flex-col items-center px-6 py-8 text-center">
            <CalendarX className="h-10 w-10 text-slate-300" />
            <div className="mt-2 font-bold">Bo'sh vaqt yo'q</div>
            <div className="mt-1 text-sm text-slate-500">{p.is_available ? "Usta hali jadval qo'shmagan" : 'Usta hozir band'}. Keyinroq qayta ko'ring.</div>
          </div>
        ) : (
          <>
            <div className="no-scrollbar -mx-4 -my-3 flex gap-2 overflow-x-auto px-4 py-3">
              {[...days.keys()].map((k) => {
                const d = dayParts(k);
                const on = k === day;
                return (
                  <button
                    key={k}
                    onClick={() => { haptic('select'); setDay(k); setSlot(null); }}
                    className={`flex w-[68px] shrink-0 flex-col items-center rounded-2xl border py-2.5 transition active:scale-95 ${on ? 'border-transparent bg-gradient-to-b from-indigo-600 to-violet-600 text-white shadow-glow' : 'border-slate-200 bg-white dark:border-white/10 dark:bg-white/5'}`}
                  >
                    <span className={`text-[11px] font-semibold ${on ? 'text-indigo-100' : 'text-slate-400'}`}>{d.label === 'Bugun' || d.label === 'Ertaga' ? d.label : d.short}</span>
                    <span className="text-xl font-extrabold">{d.day}</span>
                    <span className={`text-[10px] ${on ? 'text-indigo-100' : 'text-slate-400'}`}>{days.get(k)!.length} vaqt</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {(days.get(day) ?? []).map((s) => {
                const on = slot?.id === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => { haptic('select'); setSlot(s); }}
                    className={`rounded-xl border py-3 text-sm font-bold transition active:scale-95 ${on ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-4 ring-indigo-500/15 dark:bg-indigo-500/15 dark:text-indigo-200' : 'border-slate-200 bg-white dark:border-white/10 dark:bg-white/5'}`}
                  >
                    {fmtTime(s.starts_at)}
                    <span className="block text-[10px] font-medium text-slate-400">– {fmtTime(s.ends_at)}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* Forma */}
      {slot && (
        <section className="mt-6 animate-fade-up space-y-3">
          <h2 className="text-lg font-extrabold tracking-tight">Ma'lumotlaringiz</h2>
          <div>
            <label className="label">Manzil *</label>
            <textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input" placeholder="Tuman, ko'cha, uy, xonadon" />
            <button type="button" onClick={locate} className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-300">
              {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LocateFixed className="h-3.5 w-3.5" />} Joriy joylashuvni qo'shish
            </button>
          </div>
          <div>
            <label className="label">Telefon *</label>
            <input type="tel" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" placeholder="+998 90 123 45 67" />
          </div>
          <div>
            <label className="label">Muammo haqida (ixtiyoriy)</label>
            <textarea rows={3} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="input" placeholder="Masalan: oshxonadagi kran oqyapti" />
          </div>
        </section>
      )}

      {/* Sharhlar */}
      {data.reviews.length > 0 && (
        <section className="mt-7">
          <h2 className="mb-3 text-lg font-extrabold tracking-tight">Mijozlar fikri</h2>
          <div className="space-y-2.5">
            {data.reviews.map((r) => (
              <div key={r.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <b className="text-sm">{r.client?.first_name ?? 'Mijoz'}</b>
                  <span className="text-xs text-slate-400">{timeAgo(r.updated_at)}</span>
                </div>
                <div className="mt-1 flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`h-3.5 w-3.5 ${n <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-white/20'}`} />)}
                </div>
                {r.review && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{r.review}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pastki tugma */}
      {days.size > 0 && p.is_available && (
        <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/70 bg-white/90 px-4 pt-3 backdrop-blur-xl dark:border-white/10 dark:bg-ink/90">
          <div className="mx-auto max-w-md">
            {formErr && <div className="mb-2 rounded-xl bg-rose-50 px-3 py-2 text-center text-xs font-semibold text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">{formErr}</div>}
            <button
              disabled={sending}
              onClick={() => {
                if (!slot) { haptic('error'); setFormErr('Avval vaqtni tanlang'); return; }
                haptic('medium');
                submit();
              }}
              className="btn-primary btn-lg w-full"
            >
              {sending && <Loader2 className="h-5 w-5 animate-spin" />}
              {slot ? `Band qilish · ${dayParts(dayKey(slot.starts_at)).label} ${fmtTime(slot.starts_at)}` : 'Vaqtni tanlang'}
            </button>
          </div>
        </div>
      )}
      {!tg()?.initData && <div className="h-4" />}
    </>
  );
}
