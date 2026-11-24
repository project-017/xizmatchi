import Link from 'next/link';
import { ArrowRight, CalendarDays, CheckCircle2, Clock, Users, Wrench } from 'lucide-react';
import { db } from '@/lib/supabase';
import { PageHeader } from '@/components/Shell';
import { StatusBadge } from '@/components/StatusBadge';
import { Avatar } from '@/components/Avatar';
import { fmtDateTime } from '@/lib/format';

export default async function Dashboard() {
  const c = (t: string) => db().from(t).select('id', { count: 'exact', head: true });
  const [providers, clients, bookings, pending, done, recent, top] = await Promise.all([
    c('providers'),
    c('clients'),
    c('bookings'),
    c('bookings').eq('status', 'pending'),
    c('bookings').eq('status', 'completed'),
    db().from('bookings').select('id,status,scheduled_at,address,client:clients(first_name,last_name),provider:providers(full_name)').order('created_at', { ascending: false }).limit(8),
    db().from('providers').select('id,full_name,avatar_url,rating,jobs_done,category:categories(name,icon)').eq('is_active', true).order('jobs_done', { ascending: false }).limit(5),
  ]);

  const stats = [
    { label: 'Ustalar', value: providers.count ?? 0, icon: Wrench, g: 'from-indigo-500 to-violet-500', href: '/admin/providers' },
    { label: 'Mijozlar', value: clients.count ?? 0, icon: Users, g: 'from-sky-500 to-cyan-400', href: '/admin/clients' },
    { label: 'Kutilayotgan', value: pending.count ?? 0, icon: Clock, g: 'from-amber-500 to-orange-500', href: '/admin/bookings?status=pending' },
    { label: 'Bajarilgan', value: done.count ?? 0, icon: CheckCircle2, g: 'from-emerald-500 to-teal-400', href: '/admin/bookings?status=completed' },
  ];

  return (
    <>
      <PageHeader title="Boshqaruv paneli" subtitle={`Jami ${bookings.count ?? 0} ta buyurtma`} action={<Link href="/admin/providers/new" className="btn-primary">+ Yangi usta</Link>} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, g, href }) => (
          <Link key={label} href={href} className="card group relative overflow-hidden p-5 transition hover:-translate-y-0.5">
            <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${g} opacity-10 transition group-hover:opacity-20`} />
            <div className={`mb-4 grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${g} text-white`}><Icon className="h-5 w-5" /></div>
            <div className="text-3xl font-extrabold tracking-tight">{value}</div>
            <div className="text-sm text-slate-500">{label}</div>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold">So'nggi buyurtmalar</h2>
            <Link href="/admin/bookings" className="flex items-center gap-1 text-sm font-semibold text-indigo-600">Barchasi <ArrowRight className="h-4 w-4" /></Link>
          </div>
          {recent.data?.length ? (
            <ul className="divide-y divide-slate-100">
              {recent.data.map((b) => {
                const cl = b.client as unknown as { first_name: string; last_name: string } | null;
                const pr = b.provider as unknown as { full_name: string } | null;
                return (
                  <li key={b.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{cl?.first_name} {cl?.last_name} → {pr?.full_name}</div>
                      <div className="truncate text-xs text-slate-500">{fmtDateTime(b.scheduled_at)} · {b.address}</div>
                    </div>
                    <StatusBadge status={b.status} />
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center py-12 text-sm text-slate-400"><CalendarDays className="mb-2 h-8 w-8" />Hali buyurtmalar yo'q</div>
          )}
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-bold">Eng faol ustalar</h2></div>
          <ul className="divide-y divide-slate-100">
            {(top.data ?? []).map((p, i) => {
              const cat = p.category as unknown as { name: string; icon: string } | null;
              return (
                <li key={p.id}>
                  <Link href={`/admin/providers/${p.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                    <span className="w-4 text-xs font-bold text-slate-400">{i + 1}</span>
                    <Avatar name={p.full_name} url={p.avatar_url} size={36} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{p.full_name}</div>
                      <div className="text-xs text-slate-500">{cat?.icon} {cat?.name ?? '—'}</div>
                    </div>
                    <div className="text-right text-xs"><div className="font-bold">⭐ {Number(p.rating).toFixed(1)}</div><div className="text-slate-400">{p.jobs_done} ish</div></div>
                  </Link>
                </li>
              );
            })}
            {!top.data?.length && <li className="px-5 py-10 text-center text-sm text-slate-400">Ustalar yo'q</li>}
          </ul>
        </div>
      </div>
    </>
  );
}
