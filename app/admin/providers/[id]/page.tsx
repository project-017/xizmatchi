import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { db } from '@/lib/supabase';
import { PageHeader } from '@/components/Shell';
import { Flash } from '@/components/Flash';
import { Avatar } from '@/components/Avatar';
import { StatusBadge } from '@/components/StatusBadge';
import { SubmitButton } from '@/components/SubmitButton';
import { fmtDateTime } from '@/lib/format';
import { ProviderForm } from '../ProviderForm';
import { deleteProvider, updateProvider } from '../../actions';

export default async function EditProvider({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { id } = await params;
  const { ok, error } = await searchParams;
  const [{ data: p }, { data: categories }, { data: bookings }] = await Promise.all([
    db().from('providers').select('*').eq('id', id).maybeSingle(),
    db().from('categories').select('*').order('sort'),
    db().from('bookings').select('id,status,scheduled_at,address,rating,client:clients(first_name,last_name)').eq('provider_id', id).order('scheduled_at', { ascending: false }).limit(10),
  ]);
  if (!p) notFound();

  return (
    <>
      <Link href="/admin/providers" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4" /> Ustalar</Link>
      <PageHeader
        title={p.full_name}
        subtitle={`⭐ ${Number(p.rating).toFixed(1)} · ${p.reviews_count} ta baho · ${p.jobs_done} ta bajarilgan ish`}
        action={
          <form action={deleteProvider}>
            <input type="hidden" name="id" value={p.id} />
            <SubmitButton className="btn-danger" confirm="Ustani va uning barcha buyurtmalarini o'chirasizmi?"><Trash2 className="h-4 w-4" /> O'chirish</SubmitButton>
          </form>
        }
      />
      <Flash ok={ok} error={error} />
      <div className="mb-6 flex items-center gap-4"><Avatar name={p.full_name} url={p.avatar_url} size={64} /></div>
      <ProviderForm action={updateProvider} categories={categories ?? []} p={p} />

      <div className="card mt-6 overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4 font-bold">So'nggi buyurtmalar</div>
        <ul className="divide-y divide-slate-100">
          {(bookings ?? []).map((b) => {
            const c = b.client as unknown as { first_name: string; last_name: string } | null;
            return (
              <li key={b.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <div className="min-w-0"><div className="font-semibold">{c?.first_name} {c?.last_name}</div><div className="truncate text-xs text-slate-500">{fmtDateTime(b.scheduled_at)} · {b.address}</div></div>
                <div className="flex items-center gap-2">{b.rating && <span className="text-xs">⭐{b.rating}</span>}<StatusBadge status={b.status} /></div>
              </li>
            );
          })}
          {!bookings?.length && <li className="px-5 py-8 text-center text-sm text-slate-400">Buyurtmalar yo'q</li>}
        </ul>
      </div>
    </>
  );
}
