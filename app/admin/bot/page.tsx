import { AlertTriangle, Bot, CheckCircle2, ExternalLink, Link2, Megaphone, MessageSquareText, Plug, RefreshCw, Send, Unplug, Users, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/Shell';
import { Flash } from '@/components/Flash';
import { SubmitButton } from '@/components/SubmitButton';
import { db } from '@/lib/supabase';
import { tgApi } from '@/lib/telegram';
import { DEFAULT_TEXTS, getSettings } from '@/lib/settings';
import { fmtDateTime, timeAgo } from '@/lib/format';
import { connectBot, disconnectBot, reapplyBot, saveAdminChat, saveBotTexts, sendTestMessage } from './actions';
import { Broadcast, TokenInput } from './client';

type WebhookInfo = { url: string; pending_update_count: number; last_error_date?: number; last_error_message?: string };

function Row({ ok, label, value }: { ok: boolean | null; label: string; value?: React.ReactNode }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm">
      <span className="flex items-center gap-2.5 font-semibold">
        {ok === null ? <span className="h-5 w-5" /> : ok ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-rose-500" />}
        {label}
      </span>
      <span className="min-w-0 truncate text-right text-xs text-slate-500">{value}</span>
    </li>
  );
}

export default async function BotControl({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { ok, error } = await searchParams;
  const s = await getSettings(true);
  const token = s.bot_token || process.env.TELEGRAM_BOT_TOKEN || '';
  const fromEnv = !s.bot_token && !!process.env.TELEGRAM_BOT_TOKEN;

  const [me, wh, clients] = await Promise.all([
    token ? tgApi<{ username: string; first_name: string }>('getMe', {}, token) : null,
    token ? tgApi<WebhookInfo>('getWebhookInfo', {}, token) : null,
    db().from('clients').select('id', { count: 'exact', head: true }).eq('is_blocked', false),
  ]);
  const connected = !!me?.ok;
  const expectedHook = s.app_url ? `${s.app_url}/api/telegram/webhook` : '';
  const hook = wh?.result;
  const hookOk = !!hook?.url && (!expectedHook || hook.url === expectedHook);
  const recentError = hook?.last_error_date && Date.now() / 1000 - hook.last_error_date < 3600;
  const username = me?.result?.username || s.bot_username;

  return (
    <>
      <PageHeader title="Bot nazorati" subtitle="Mijozlar uchun Telegram botni ulash va boshqarish" />
      <Flash ok={ok} error={error} />

      {s._missingTable && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <b>Sozlamalar jadvali topilmadi.</b> Supabase → SQL Editor da <code className="rounded bg-amber-100 px-1">supabase/migrations/002_app_settings.sql</code> faylini bir marta ishga tushiring, so'ng sahifani yangilang.
          </div>
        </div>
      )}

      {!connected ? (
        /* ───────── Bot ulanmagan ───────── */
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="card relative overflow-hidden p-7 lg:col-span-3">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br from-sky-400/25 to-indigo-500/25 blur-2xl" />
            <div className="relative">
              <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-glow">
                <Bot className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-extrabold tracking-tight">Mijoz botini ulash</h2>
              <p className="mt-1 text-sm text-slate-500">Tokenni qo'ying — qolgan hamma narsa avtomatik sozlanadi.</p>
              {token && !connected && (
                <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
                  Saqlangan token ishlamayapti ({me?.description ?? 'xato'}). Yangi token kiriting.
                </div>
              )}
              <form action={connectBot} className="mt-6 space-y-3">
                <label className="label">Bot tokeni</label>
                <TokenInput />
                <SubmitButton className="btn-primary btn-lg w-full"><Plug className="h-5 w-5" /> Botni ulash</SubmitButton>
              </form>
              <p className="mt-3 text-xs text-slate-400">Token xavfsiz saqlanadi va hech qachon brauzerga ko'rsatilmaydi.</p>
            </div>
          </div>

          <div className="card p-7 lg:col-span-2">
            <h3 className="mb-4 font-bold">Token qanday olinadi?</h3>
            <ol className="space-y-4 text-sm">
              {[
                <>Telegramda <a href="https://t.me/BotFather" target="_blank" className="font-semibold text-indigo-600">@BotFather</a> ni oching</>,
                <><code className="rounded bg-slate-100 px-1.5">/newbot</code> buyrug'ini yuboring</>,
                <>Bot nomini yozing, masalan: <b>Xizmatchi</b></>,
                <>Username yozing (oxiri <b>bot</b> bilan tugashi shart), masalan: <b>xizmatchi_uz_bot</b></>,
                <>BotFather bergan tokenni nusxalab, chapdagi maydonga qo'ying</>,
              ].map((t, i) => (
                <li key={i} className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{i + 1}</span>
                  <span className="pt-0.5 text-slate-600">{t}</span>
                </li>
              ))}
            </ol>
            <div className="mt-6 rounded-xl bg-indigo-50 p-4 text-xs text-indigo-800">
              <b>Ulanganda avtomatik:</b> webhook, chatdagi &quot;{s.bot_menu_text || DEFAULT_TEXTS.menu}&quot; tugmasi, /start va /id buyruqlari, bot tavsifi.
            </div>
          </div>
        </div>
      ) : (
        /* ───────── Bot ulangan ───────── */
        <div className="space-y-6">
          <div className="card relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-500" />
            <div className="relative flex flex-wrap items-end justify-between gap-4 px-6 pb-6 pt-24">
              <div className="flex items-center gap-4">
                <div className="-mt-10 grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-white text-indigo-600 shadow-soft ring-4 ring-white">
                  <Bot className="h-10 w-10" />
                </div>
                <div className="pb-1">
                  <div className="flex items-center gap-2 text-xl font-extrabold">
                    {me?.result?.first_name}
                    <span className="badge bg-emerald-100 text-emerald-700"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Ulangan</span>
                  </div>
                  <div className="text-sm text-slate-500">
                    @{username}
                    {s.bot_connected_at && <> · {timeAgo(s.bot_connected_at)} ulangan</>}
                    {fromEnv && <> · .env dan</>}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <a href={`https://t.me/${username}`} target="_blank" className="btn-dark"><ExternalLink className="h-4 w-4" /> Botni ochish</a>
                <form action={reapplyBot}><SubmitButton className="btn-ghost"><RefreshCw className="h-4 w-4" /> Qayta sozlash</SubmitButton></form>
                {!fromEnv && (
                  <form action={disconnectBot}>
                    <SubmitButton className="btn-danger" confirm="Botni uzasizmi? Mijozlar mini appni ochib bo'lmay qoladi."><Unplug className="h-4 w-4" /> Uzish</SubmitButton>
                  </form>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="card p-6 lg:col-span-2">
              <h2 className="mb-4 flex items-center gap-2 font-bold"><Link2 className="h-4 w-4 text-indigo-500" /> Ulanish holati</h2>
              <ul className="space-y-2">
                <Row ok={connected} label="Token" value="Telegram tasdiqladi" />
                <Row ok={hookOk} label="Webhook" value={hook?.url || "o'rnatilmagan"} />
                <Row ok={!recentError} label="Oxirgi xato" value={hook?.last_error_message ? `${hook.last_error_message} (${fmtDateTime(new Date(hook.last_error_date! * 1000))})` : "yo'q"} />
                <Row ok={(hook?.pending_update_count ?? 0) < 20} label="Navbatdagi xabarlar" value={hook?.pending_update_count ?? 0} />
                <Row ok={!!s.app_url} label="Mini app manzili" value={s.app_url ? `${s.app_url}/app` : '—'} />
              </ul>
              {!hookOk && (
                <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Webhook bu saytga yo'naltirilmagan. &quot;Qayta sozlash&quot; tugmasini bosing.
                </p>
              )}
            </div>
            <div className="card flex flex-col p-6">
              <h2 className="mb-4 flex items-center gap-2 font-bold"><Users className="h-4 w-4 text-indigo-500" /> Bot foydalanuvchilari</h2>
              <div className="text-5xl font-extrabold tracking-tight">{clients.count ?? 0}</div>
              <div className="text-sm text-slate-500">faol mijoz</div>
              <a href="/admin/clients" className="btn-soft mt-auto">Mijozlar ro'yxati</a>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <form action={saveBotTexts} className="card space-y-4 p-6">
              <h2 className="flex items-center gap-2 font-bold"><MessageSquareText className="h-4 w-4 text-indigo-500" /> Bot matnlari</h2>
              <div>
                <label className="label">/start xabari</label>
                <textarea name="welcome" rows={6} defaultValue={s.bot_welcome || DEFAULT_TEXTS.welcome} className="input text-sm" />
                <p className="mt-1 text-xs text-slate-400"><code>{'{name}'}</code> — foydalanuvchi ismi. HTML: <code>&lt;b&gt;</code>, <code>&lt;i&gt;</code></p>
              </div>
              <div>
                <label className="label">Menyu tugmasi matni</label>
                <input name="menu" maxLength={64} defaultValue={s.bot_menu_text || DEFAULT_TEXTS.menu} className="input" />
              </div>
              <div>
                <label className="label">Qisqa tavsif (profilda)</label>
                <input name="short" maxLength={120} defaultValue={s.bot_short_description || DEFAULT_TEXTS.short} className="input" />
              </div>
              <div>
                <label className="label">To'liq tavsif (botni birinchi ochganda)</label>
                <textarea name="description" rows={3} maxLength={512} defaultValue={s.bot_description || DEFAULT_TEXTS.description} className="input text-sm" />
              </div>
              <SubmitButton className="btn-primary">Saqlash va botga qo'llash</SubmitButton>
            </form>

            <div className="space-y-6">
              <div className="card space-y-4 p-6">
                <h2 className="flex items-center gap-2 font-bold"><Send className="h-4 w-4 text-sky-500" /> Admin xabarnomalari</h2>
                <p className="text-sm text-slate-500">
                  Har bir yangi buyurtma haqida sizga ham xabar keladi. Botga <b>/id</b> yozing va kelgan raqamni shu yerga kiriting.
                </p>
                <form action={saveAdminChat} className="flex gap-2">
                  <input name="admin_chat_id" defaultValue={s.admin_chat_id ?? ''} className="input font-mono" placeholder="123456789" />
                  <SubmitButton className="btn-soft">Saqlash</SubmitButton>
                </form>
                {s.admin_chat_id && (
                  <form action={sendTestMessage}><SubmitButton className="btn-ghost w-full"><Send className="h-4 w-4" /> Test xabar yuborish</SubmitButton></form>
                )}
              </div>
              <div className="card p-6">
                <h2 className="mb-1 flex items-center gap-2 font-bold"><Megaphone className="h-4 w-4 text-fuchsia-500" /> Barcha mijozlarga xabar</h2>
                <p className="mb-4 text-sm text-slate-500">Aksiya, yangi xizmat yoki e'lon yuboring.</p>
                <Broadcast clients={clients.count ?? 0} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
