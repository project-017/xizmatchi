'use client';
import { useState } from 'react';
import { dayParts, addDays, todayKey } from '@/lib/format';

export function DayPicker() {
  const days = Array.from({ length: 14 }, (_, i) => addDays(todayKey(), i));
  const [sel, setSel] = useState<string[]>([days[0]]);
  const toggle = (d: string) => setSel((s) => (s.includes(d) ? s.filter((x) => x !== d) : [...s, d]));
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="label mb-0">Kunlar</label>
        <div className="flex gap-2 text-xs font-semibold">
          <button type="button" className="text-indigo-600" onClick={() => setSel(days.slice(0, 7))}>7 kun</button>
          <button type="button" className="text-slate-400" onClick={() => setSel([])}>Tozalash</button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d) => {
          const p = dayParts(d);
          const on = sel.includes(d);
          return (
            <button
              type="button"
              key={d}
              onClick={() => toggle(d)}
              className={`rounded-xl border py-2 text-center transition active:scale-95 ${on ? 'border-transparent bg-gradient-to-b from-indigo-600 to-violet-600 text-white shadow-glow' : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300'}`}
            >
              <div className={`text-[10px] font-semibold ${on ? 'text-indigo-100' : 'text-slate-400'}`}>{p.short}</div>
              <div className="text-sm font-extrabold">{p.day}</div>
            </button>
          );
        })}
      </div>
      {sel.map((d) => <input key={d} type="hidden" name="dates" value={d} />)}
    </div>
  );
}
