import Link from 'next/link';
import { Plus, Search, Wrench } from 'lucide-react';
import { db } from '@/lib/supabase';
import { PageHeader, Empty } from '@/components/Shell';
import { Avatar } from '@/components/Avatar';
import { Flash } from '@/components/Flash';
import { SubmitButton } from '@/components/SubmitButton';
import { money } from '@/lib/format';
import { toggleProvider } from '../actions';

export default async function Providers({ searchParams }: { searchParams: Promise<{ q?: string; ok?: string; error?: string }> }) {
  const { q, ok, error } = await searchParams;
  let query = db().from('providers').select('*, category:categories(name,icon)').order('created_at', { ascending: false });
  if (q) query = query.or(`full_name.ilike.%${q.replace(/[%,()]/g, '')}%,login.ilike.%${q.replace(/[%,()]/g, '')}%,phone.ilike.%${q.replace(/[%,()]/g, '')}%`);
  const { data } = await query;

  return (
    <>
      <PageHeader title="Ustalar" subtitle={`${data?.length ?? 0} ta usta`} action={<Link href="/admin/providers/new" className="btn-primary"><Plus className="h-4 w-4" /> Yangi usta</Link>} />
      <Flash ok={ok} error={error} />
      <form className="relative mb-5 max-w-sm">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input name="q" defaultValue={q} className="input pl-10" placeholder="Ism, login yoki telefon..." />
      </form>

      {!data?.length ? (
        <Empty icon={<Wrench className="h-6 w-6" />} title="Ustalar topilmadi" text="Birinchi ustani qo'shing — u admin sayt orqali o'z login paroli bilan kiradi." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="border-b border-slate-100 bg-slate-50/60">
              <tr><th className="th">Usta</th><th className="th">Xizmat</th><th className="th">Login</th><th className="th">Narx</th><th className="th">Reyting</th><th className="th">Holat</th><th className="th" /></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60">
                  <td className="td">
                    <Link href={`/admin/providers/${p.id}`} className="flex items-center gap-3">
                      <Avatar name={p.full_name} url={p.avatar_url} size={38} />
                      <div><div className="font-semibold">{p.full_name}</div><div className="text-xs text-slate-500">{p.phone ?? '—'}</div></div>
                    </Link>
                  </td>
                  <td className="td">{p.category ? `${p.category.icon} ${p.category.name}` : <span className="text-slate-400">—</span>}</td>
                  <td className="td font-mono text-xs">{p.login}</td>
                  <td className="td whitespace-nowrap">{money(p.price_from)}</td>
                  <td className="td whitespace-nowrap">⭐ {Number(p.rating).toFixed(1)} <span className="text-xs text-slate-400">({p.jobs_done})</span></td>
                  <td className="td">
                    <form action={toggleProvider}>
                      <input type="hidden" name="id" value={p.id} />
                      <SubmitButton className={`badge cursor-pointer ${p.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {p.is_active ? 'Faol' : "O'chirilgan"}
                      </SubmitButton>
                    </form>
                  </td>
                  <td className="td text-right"><Link href={`/admin/providers/${p.id}`} className="btn-soft btn-sm">Tahrirlash</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
