import { CheckCircle2, AlertCircle } from 'lucide-react';

/** ?ok=... yoki ?error=... query parametrlaridan xabar ko'rsatadi */
export function Flash({ ok, error }: { ok?: string; error?: string }) {
  if (!ok && !error) return null;
  return error ? (
    <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
    </div>
  ) : (
    <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {ok}
    </div>
  );
}
