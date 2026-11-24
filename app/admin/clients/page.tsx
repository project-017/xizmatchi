import { Search, Users } from 'lucide-react';
import { db } from '@/lib/supabase';
import { PageHeader, Empty } from '@/components/Shell';
import { Avatar } from '@/components/Avatar';
import { SubmitButton } from '@/components/SubmitButton';
import { fmtDate, timeAgo } from '@/lib/format';
import { toggleClientBlock } from '../actions';

export default async function Clients({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  let query = db().from('clients').select('*, bookings(count)').order('last_seen_at', { ascending: false }).limit(300);
  if (q) query = query.or(`first_name.ilike.%${q.replace(/[%,()]/g, '')}%,username.ilike.%${q.replace(/[%,()]/g, '')}%,phone.ilike.%${q.replace(/[%,()]/g, '')}%`);
  const { data } = await query;

  return (
    <>
      <PageHeader title="Mijozlar" subtitle="Mini app orqali kirgan Telegram foydalanuvchilar" />
      <form className="relative mb-5 max-w-sm">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input name="q" defaultValue={q} className="input pl-10" placeholder="Ism, username yoki telefon..." />
      </form>
      {!data?.length ? (
        <Empty icon={<Users className="h-6 w-6" />} title="Mijozlar hali yo'q" text="Foydalanuvchilar mini appni ochishi bilan shu yerda paydo bo'ladi." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="border-b border-slate-100 bg-slate-50/60">
              <tr><th className="th">Mijoz</th><th className="th">Telefon</th><th className="th">Buyurtmalar</th><th className="th">Ro'yxatdan</th><th className="th">Oxirgi faollik</th><th className="th" /></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((c) => (
                <tr key={c.id}>
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <Avatar name={`${c.first_name ?? ''} ${c.last_name ?? ''}`} url={c.photo_url} size={36} />
                      <div><div className="font-semibold">{c.first_name} {c.last_name}</div><div className="text-xs text-slate-500">{c.username ? `@${c.username}` : `ID ${c.telegram_id}`}</div></div>
                    </div>
                  </td>
                  <td className="td">{c.phone ?? '—'}</td>
                  <td className="td">{c.bookings?.[0]?.count ?? 0}</td>
                  <td className="td">{fmtDate(c.created_at)}</td>
                  <td className="td text-slate-500">{timeAgo(c.last_seen_at)}</td>
                  <td className="td text-right">
                    <form action={toggleClientBlock}>
                      <input type="hidden" name="id" value={c.id} />
                      <SubmitButton className={c.is_blocked ? 'btn-soft btn-sm' : 'btn-danger btn-sm'}>{c.is_blocked ? 'Blokdan chiqarish' : 'Bloklash'}</SubmitButton>
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
