import { CalendarPlus, Trash2, X } from 'lucide-react';
import { requireProvider } from '@/lib/auth';
import { db } from '@/lib/supabase';
import { PageHeader, Empty } from '@/components/Shell';
import { Flash } from '@/components/Flash';
import { SubmitButton } from '@/components/SubmitButton';
import { dayKey, dayParts, fmtTime } from '@/lib/format';
import type { Slot } from '@/lib/types';
import { addSlots, clearDay, deleteSlot } from '../actions';
import { DayPicker } from './DayPicker';

export default async function Schedule({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const s = await requireProvider();
  const { ok, error } = await searchParams;
  const { data } = await db()
    .from('slots')
    .select('*')
    .eq('provider_id', s.id)
    .gt('starts_at', new Date().toISOString())
    .order('starts_at')
    .limit(500);

  const groups = new Map<string, Slot[]>();
  for (const sl of (data ?? []) as Slot[]) {
    const k = dayKey(sl.starts_at);
    groups.set(k, [...(groups.get(k) ?? []), sl]);
  }

  return (
    <>
      <PageHeader title="Ish jadvali" subtitle="Mijozlar faqat siz qo'shgan bo'sh vaqtlarni band qila oladi" />
      <Flash ok={ok} error={error} />
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <form action={addSlots} className="card h-fit space-y-5 p-6 lg:sticky lg:top-10">
          <h2 className="flex items-center gap-2 font-bold"><CalendarPlus className="h-5 w-5 text-indigo-500" /> Bo'sh vaqt qo'shish</h2>
          <DayPicker />
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Boshlanish</label><input type="time" name="from" defaultValue="09:00" className="input" /></div>
            <div><label className="label">Tugash</label><input type="time" name="to" defaultValue="18:00" className="input" /></div>
          </div>
          <div>
            <label className="label">Bitta ish davomiyligi</label>
            <select name="duration" defaultValue="120" className="input">
              <option value="60">1 soat</option>
              <option value="90">1.5 soat</option>
              <option value="120">2 soat</option>
              <option value="180">3 soat</option>
              <option value="240">4 soat</option>
              <option value="480">Butun kun (8 soat)</option>
            </select>
          </div>
          <SubmitButton className="btn-primary btn-lg w-full">Jadvalga qo'shish</SubmitButton>
        </form>

        <div className="space-y-4">
          {!groups.size && <Empty icon={<CalendarPlus className="h-6 w-6" />} title="Bo'sh vaqtlar yo'q" text="Chap tomondagi forma orqali bir necha kunga birdaniga qo'shing." />}
          {[...groups].map(([day, slots]) => {
            const p = dayParts(day);
            const free = slots.filter((x) => !x.is_booked).length;
            return (
              <div key={day} className="card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="font-bold">{p.label}, {p.day}-{p.month}</div>
                    <div className="text-xs text-slate-500">{free} bo'sh · {slots.length - free} band</div>
                  </div>
                  {free > 0 && (
                    <form action={clearDay}>
                      <input type="hidden" name="date" value={day} />
                      <SubmitButton className="btn-danger btn-sm" confirm="Shu kundagi barcha bo'sh vaqtlar o'chirilsinmi?"><Trash2 className="h-3.5 w-3.5" /> Kunni tozalash</SubmitButton>
                    </form>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {slots.map((sl) =>
                    sl.is_booked ? (
                      <span key={sl.id} className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-bold text-white" title="Band qilingan">{fmtTime(sl.starts_at)}–{fmtTime(sl.ends_at)}</span>
                    ) : (
                      <form key={sl.id} action={deleteSlot}>
                        <input type="hidden" name="id" value={sl.id} />
                        <SubmitButton className="group btn rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600">
                          {fmtTime(sl.starts_at)}–{fmtTime(sl.ends_at)} <X className="h-3.5 w-3.5 opacity-40 group-hover:opacity-100" />
                        </SubmitButton>
                      </form>
                    ),
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
