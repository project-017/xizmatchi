'use client';
import { useState } from 'react';
import { Loader2, Send } from 'lucide-react';

export function TelegramSetup() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  return (
    <div>
      <button
        className="btn-primary"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          const r = await fetch('/api/telegram/setup', { method: 'POST' }).then((r) => r.json()).catch((e) => ({ error: String(e) }));
          setResult(JSON.stringify(r, null, 2));
          setLoading(false);
        }}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Botni ulash (webhook + menyu)
      </button>
      {result && <pre className="mt-4 max-h-72 overflow-auto rounded-xl bg-slate-900 p-4 text-xs text-emerald-300">{result}</pre>}
    </div>
  );
}
