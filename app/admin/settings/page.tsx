import { CheckCircle2, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/Shell';
import { TelegramSetup } from './TelegramSetup';

export default function Settings() {
  const env = [
    ['SUPABASE_URL', !!process.env.SUPABASE_URL],
    ['SUPABASE_SERVICE_ROLE_KEY', !!process.env.SUPABASE_SERVICE_ROLE_KEY],
    ['AUTH_SECRET', !!process.env.AUTH_SECRET],
    ['TELEGRAM_BOT_TOKEN', !!process.env.TELEGRAM_BOT_TOKEN],
    ['TELEGRAM_WEBHOOK_SECRET', !!process.env.TELEGRAM_WEBHOOK_SECRET],
    ['NEXT_PUBLIC_APP_URL', !!process.env.NEXT_PUBLIC_APP_URL],
  ] as const;
  const devMode = process.env.ALLOW_DEV_USER === 'true';
  return (
    <>
      <PageHeader title="Sozlamalar" subtitle="Tizim holati va Telegram bot" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="mb-4 font-bold">Muhit o'zgaruvchilari</h2>
          <ul className="space-y-2.5">
            {env.map(([k, v]) => (
              <li key={k} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5 text-sm">
                <code className="font-mono text-xs">{k}</code>
                {v ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-rose-500" />}
              </li>
            ))}
          </ul>
          {devMode && <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">⚠️ ALLOW_DEV_USER=true — productionda o'chiring!</p>}
        </div>
        <div className="card p-6">
          <h2 className="mb-1 font-bold">Telegram bot</h2>
          <p className="mb-5 text-sm text-slate-500">
            Netlify'ga deploy qilgandan so'ng bir marta bosing: webhook, &quot;Usta topish&quot; menyu tugmasi va buyruqlar o'rnatiladi.
          </p>
          <TelegramSetup />
          <div className="mt-6 text-sm text-slate-500">
            Mini app manzili: <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{process.env.NEXT_PUBLIC_APP_URL ?? '…'}/app</code>
          </div>
        </div>
      </div>
    </>
  );
}
