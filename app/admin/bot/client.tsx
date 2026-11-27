'use client';
import { useState } from 'react';
import { Eye, EyeOff, KeyRound, Loader2, Megaphone } from 'lucide-react';
import { broadcastBatch } from './actions';

export function TokenInput() {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        name="token"
        required
        autoComplete="off"
        spellCheck={false}
        type={show ? 'text' : 'password'}
        className="input px-10 py-3 font-mono"
        placeholder="123456789:AAFxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      />
      <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function Broadcast({ clients }: { clients: number }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [error, setError] = useState('');

  const run = async () => {
    if (!text.trim() || !confirm(`Xabar ${clients} ta mijozga yuborilsinmi?`)) return;
    setBusy(true);
    setError('');
    let offset: number | null = 0;
    let sent = 0, failed = 0, total = clients;
    while (offset !== null) {
      const r = await broadcastBatch(text, offset);
      if ('error' in r) { setError(r.error ?? 'Xato'); break; }
      sent += r.sent; failed += r.failed; total = r.total;
      setProgress({ sent, failed, total });
      offset = r.next;
      if (offset !== null) await new Promise((res) => setTimeout(res, 1100)); // Telegram limiti: ~30 xabar/soniya
    }
    setBusy(false);
  };

  const done = progress ? progress.sent + progress.failed : 0;
  return (
    <div className="space-y-3">
      <textarea
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={4000}
        className="input"
        placeholder="Masalan: Hurmatli mijozlar! Endi konditsioner tozalash xizmati ham mavjud ❄️"
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-slate-400">{text.length}/4000 · {clients} ta qabul qiluvchi</span>
        <button onClick={run} disabled={busy || !text.trim() || !clients} className="btn-primary">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />} Hammaga yuborish
        </button>
      </div>
      {error && <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>}
      {progress && (
        <div className="rounded-xl bg-slate-50 p-4">
          <div className="mb-2 flex justify-between text-xs font-semibold">
            <span>{busy ? 'Yuborilmoqda...' : 'Tugadi ✅'}</span>
            <span>{done}/{progress.total}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-all" style={{ width: `${progress.total ? (done / progress.total) * 100 : 100}%` }} />
          </div>
          <div className="mt-2 text-xs text-slate-500">✅ {progress.sent} yetkazildi · ⚠️ {progress.failed} yetkazilmadi (botni bloklagan)</div>
        </div>
      )}
    </div>
  );
}
