import { Plus, Trash2 } from 'lucide-react';
import { db } from '@/lib/supabase';
import { PageHeader } from '@/components/Shell';
import { Flash } from '@/components/Flash';
import { SubmitButton } from '@/components/SubmitButton';
import { deleteCategory, saveCategory } from '../actions';

export default async function Categories({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { ok, error } = await searchParams;
  const [{ data: cats }, { data: provs }] = await Promise.all([
    db().from('categories').select('*').order('sort').order('name'),
    db().from('providers').select('category_id'),
  ]);
  const count = (id: string) => (provs ?? []).filter((p) => p.category_id === id).length;

  return (
    <>
      <PageHeader title="Xizmat turlari" subtitle="Mini app bosh sahifasida ko'rinadigan kategoriyalar" />
      <Flash ok={ok} error={error} />

      <form action={saveCategory} className="card mb-6 grid items-end gap-3 p-5 sm:grid-cols-[80px_1fr_110px_90px_auto]">
        <div><label className="label">Belgi</label><input name="icon" defaultValue="🛠️" className="input text-center text-lg" /></div>
        <div><label className="label">Nomi</label><input name="name" required className="input" placeholder="masalan: Lift ustasi" /></div>
        <div><label className="label">Rang</label><input name="color" type="color" defaultValue="#6366f1" className="input h-[42px] p-1" /></div>
        <div><label className="label">Tartib</label><input name="sort" type="number" defaultValue={(cats?.length ?? 0) + 1} className="input" /></div>
        <SubmitButton className="btn-primary h-[42px]"><Plus className="h-4 w-4" /> Qo'shish</SubmitButton>
      </form>

      <div className="grid gap-3 md:grid-cols-2">
        {(cats ?? []).map((c) => (
          <div key={c.id} className="card p-4">
            <form action={saveCategory} className="flex flex-wrap items-center gap-3">
              <input type="hidden" name="id" value={c.id} />
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl" style={{ background: `${c.color}1f` }}>{c.icon}</div>
              <div className="grid min-w-0 flex-1 grid-cols-[56px_1fr] gap-2">
                <input name="icon" defaultValue={c.icon} className="input px-2 text-center" />
                <input name="name" defaultValue={c.name} className="input font-semibold" />
                <input name="color" type="color" defaultValue={c.color} className="input h-[38px] p-1" />
                <div className="flex gap-2">
                  <input name="slug" defaultValue={c.slug} className="input font-mono text-xs" title="slug" />
                  <input name="sort" type="number" defaultValue={c.sort} className="input w-20" title="tartib" />
                </div>
              </div>
              <div className="flex w-full items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <input type="checkbox" name="is_active" defaultChecked={c.is_active} className="h-4 w-4 accent-indigo-600" /> Faol
                  <span className="ml-2 font-normal text-slate-400">· {count(c.id)} usta</span>
                </label>
                <div className="flex gap-2">
                  <SubmitButton className="btn-soft btn-sm">Saqlash</SubmitButton>
                  <SubmitButton formAction={deleteCategory} className="btn-danger btn-sm" confirm={`"${c.name}" o'chirilsinmi? Ustalar kategoriyasiz qoladi.`}><Trash2 className="h-3.5 w-3.5" /></SubmitButton>
                </div>
              </div>
            </form>
          </div>
        ))}
      </div>
    </>
  );
}
