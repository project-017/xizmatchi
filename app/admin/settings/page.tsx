import Link from 'next/link';
import { Bot, CheckCircle2, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/Shell';
import { getSettings } from '@/lib/settings';

export default async function Settings() {
  const s = await getSettings(true);
  const env = [
    ['SUPABASE_URL', !!process.env.SUPABASE_URL],
    ['SUPABASE_SERVICE_ROLE_KEY', !!process.env.SUPABASE_SERVICE_ROLE_KEY],
    ['AUTH_SECRET', !!process.env.AUTH_SECRET],
    ['ADMIN_LOGIN / ADMIN_PASSWORD', !!process.env.ADMIN_LOGIN && !!process.env.ADMIN_PASSWORD],
  ] as const;
  const devMode = process.env.ALLOW_DEV_USER === 'true';
  const botOk = !!(s.bot_token || process.env.TELEGRAM_BOT_TOKEN);
  return (
    <>
      <PageHeader title="Sozlamalar" subtitle="Tizim holati" />
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
            <li className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5 text-sm">
              <code className="font-mono text-xs">app_settings jadvali</code>
              {!s._missingTable ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-rose-500" />}
            </li>
          </ul>
          {devMode && <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">⚠️ ALLOW_DEV_USER=true — productionda o'chiring!</p>}
        </div>
        <div className="card flex flex-col p-6">
          <h2 className="mb-1 flex items-center gap-2 font-bold"><Bot className="h-4 w-4 text-indigo-500" /> Telegram bot</h2>
          <p className="mb-5 text-sm text-slate-500">
            {botOk ? `Ulangan${s.bot_username ? `: @${s.bot_username}` : ''}` : 'Bot hali ulanmagan'}
          </p>
          <Link href="/admin/bot" className="btn-primary mt-auto">Bot nazoratiga o'tish</Link>
        </div>
      </div>
    </>
  );
}
