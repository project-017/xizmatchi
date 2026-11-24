import Link from 'next/link';
import { CalendarDays } from 'lucide-react';
import { db } from '@/lib/supabase';
import { PageHeader, Empty } from '@/components/Shell';
import { StatusBadge } from '@/components/StatusBadge';
import { SubmitButton } from '@/components/SubmitButton';
import { STATUS, fmtDateTime, timeAgo } from '@/lib/format';
import type { BookingStatus } from '@/lib/types';
import { adminSetStatus } from '../actions';

export default async function Bookings({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  let q = db()
    .from('bookings')
    .select('*, client:clients(first_name,last_name,username), provider:providers(full_name, category:categories(icon,name))')
    .order('created_at', { ascending: false })
    .limit(200);
  if (status && status in STATUS) q = q.eq('status', status);
  const { data } = await q;

  const tabs: [string, string][] = [['', 'Barchasi'], ...Object.entries(STATUS).map(([k, v]) => [k, v.label] as [string, string])];

  return (
    <>
      <PageHeader title="Buyurtmalar" subtitle="Barcha buyurtmalarni kuzatish va boshqarish" />
      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto">
        {tabs.map(([k, label]) => (
          <Link key={k} href={k ? `/admin/bookings?status=${k}` : '/admin/bookings'} className={`chip ${(status ?? '') === k ? 'chip-active' : ''}`}>{label}</Link>
        ))}
      </div>
      {!data?.length ? (
        <Empty icon={<CalendarDays className="h-6 w-6" />} title="Buyurtmalar yo'q" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="border-b border-slate-100 bg-slate-50/60">
              <tr><th className="th">Mijoz</th><th className="th">Usta</th><th className="th">Vaqt</th><th className="th">Manzil</th><th className="th">Holat</th><th className="th">O'zgartirish</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/60">
                  <td className="td"><div className="font-semibold">{b.client?.first_name} {b.client?.last_name}</div><div className="text-xs text-slate-500">{b.phone}</div></td>
                  <td className="td"><div className="font-semibold">{b.provider?.full_name}</div><div className="text-xs text-slate-500">{b.provider?.category?.icon} {b.provider?.category?.name}</div></td>
                  <td className="td whitespace-nowrap"><div>{fmtDateTime(b.scheduled_at)}</div><div className="text-xs text-slate-400">{timeAgo(b.created_at)}</div></td>
                  <td className="td max-w-[220px]"><div className="truncate">{b.address}</div>{b.note && <div className="truncate text-xs text-slate-400">{b.note}</div>}</td>
                  <td className="td"><StatusBadge status={b.status as BookingStatus} />{b.rating && <div className="mt-1 text-xs">⭐ {b.rating}</div>}</td>
                  <td className="td">
                    <form action={adminSetStatus} className="flex gap-1.5">
                      <input type="hidden" name="id" value={b.id} />
                      <select name="status" defaultValue={b.status} className="input w-36 py-1.5 text-xs">
                        {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                      <SubmitButton className="btn-soft btn-sm">OK</SubmitButton>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
