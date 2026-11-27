'use server';
import crypto from 'crypto';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/supabase';
import { tgApi, esc } from '@/lib/telegram';
import { DEFAULT_TEXTS, getSettings, saveSettings } from '@/lib/settings';

const PATH = '/admin/bot';
const str = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
const back = (kind: 'ok' | 'error', msg: string): never => redirect(`${PATH}?${kind}=${encodeURIComponent(msg)}`);

/** Joriy sayt manzilini so'rov sarlavhalaridan aniqlaydi */
async function detectAppUrl() {
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host');
  const proto = h.get('x-forwarded-proto') || 'https';
  return host ? `${proto}://${host}` : process.env.NEXT_PUBLIC_APP_URL || '';
}

type BotTexts = { menu: string; description: string; short: string };

/** Webhook, menyu tugmasi, buyruqlar va tavsiflarni Telegram'ga o'rnatadi */
async function applyBotConfig(token: string, url: string, secret: string, t: BotTexts) {
  const errors: string[] = [];
  const check = (name: string, r: { ok: boolean; description?: string }) => {
    if (!r.ok) errors.push(`${name}: ${r.description ?? 'xato'}`);
  };
  check('Webhook', await tgApi('setWebhook', {
    url: `${url}/api/telegram/webhook`,
    secret_token: secret,
    allowed_updates: ['message'],
    drop_pending_updates: true,
  }, token));
  check('Menyu tugmasi', await tgApi('setChatMenuButton', {
    menu_button: { type: 'web_app', text: t.menu.slice(0, 64), web_app: { url: `${url}/app` } },
  }, token));
  check('Buyruqlar', await tgApi('setMyCommands', {
    commands: [
      { command: 'start', description: 'Ilovani ochish' },
      { command: 'id', description: 'Telegram ID raqamim' },
    ],
  }, token));
  check('Tavsif', await tgApi('setMyDescription', { description: t.description.slice(0, 512) }, token));
  check('Qisqa tavsif', await tgApi('setMyShortDescription', { short_description: t.short.slice(0, 120) }, token));
  return errors;
}

async function currentTexts(): Promise<BotTexts> {
  const s = await getSettings(true);
  return {
    menu: s.bot_menu_text || DEFAULT_TEXTS.menu,
    description: s.bot_description || DEFAULT_TEXTS.description,
    short: s.bot_short_description || DEFAULT_TEXTS.short,
  };
}

export async function connectBot(fd: FormData) {
  await requireAdmin();
  const token = str(fd, 'token').replace(/\s+/g, '');
  if (!/^\d{5,}:[A-Za-z0-9_-]{30,}$/.test(token)) back('error', "Token formati noto'g'ri. Masalan: 123456789:AAF...");

  const me = await tgApi<{ id: number; username: string; first_name: string; is_bot: boolean }>('getMe', {}, token);
  if (!me.ok || !me.result) back('error', "Telegram bu tokenni tanimadi. @BotFather'dan to'g'ri nusxalaganingizni tekshiring.");

  const url = await detectAppUrl();
  if (!url.startsWith('https://')) {
    back('error', `Telegram faqat HTTPS manzilni qabul qiladi. Hozirgi manzil: ${url || "noma'lum"}. Saytni Netlify'dagi https manzil orqali oching.`);
  }

  const secret = crypto.randomBytes(24).toString('hex');
  try {
    await saveSettings({
      bot_token: token,
      bot_webhook_secret: secret,
      bot_id: String(me.result!.id),
      bot_username: me.result!.username,
      bot_name: me.result!.first_name,
      bot_connected_at: new Date().toISOString(),
      app_url: url,
    });
  } catch (e) {
    back('error', `Sozlamani saqlab bo'lmadi: ${(e as Error).message}. supabase/migrations/002_app_settings.sql ni ishga tushirganmisiz?`);
  }

  const errors = await applyBotConfig(token, url, secret, await currentTexts());
  revalidatePath(PATH);
  if (errors.length) back('error', `Bot saqlandi, lekin ba'zi sozlamalar o'rnatilmadi: ${errors.join('; ')}`);
  back('ok', `@${me.result!.username} muvaffaqiyatli ulandi! Botga kirib /start bosib ko'ring.`);
}

export async function reapplyBot() {
  await requireAdmin();
  const s = await getSettings(true);
  if (!s.bot_token) back('error', 'Bot ulanmagan');
  const url = await detectAppUrl();
  const secret = s.bot_webhook_secret || crypto.randomBytes(24).toString('hex');
  await saveSettings({ app_url: url, bot_webhook_secret: secret });
  const errors = await applyBotConfig(s.bot_token!, url, secret, await currentTexts());
  revalidatePath(PATH);
  if (errors.length) back('error', errors.join('; '));
  back('ok', 'Bot qayta sozlandi');
}

export async function disconnectBot() {
  await requireAdmin();
  const s = await getSettings(true);
  if (s.bot_token) {
    await tgApi('deleteWebhook', {}, s.bot_token);
    await tgApi('setChatMenuButton', { menu_button: { type: 'default' } }, s.bot_token);
  }
  await saveSettings({ bot_token: null, bot_webhook_secret: null, bot_id: null, bot_username: null, bot_name: null, bot_connected_at: null });
  revalidatePath(PATH);
  back('ok', 'Bot uzildi');
}

export async function saveBotTexts(fd: FormData) {
  await requireAdmin();
  const texts = {
    bot_welcome: str(fd, 'welcome') || null,
    bot_menu_text: str(fd, 'menu').slice(0, 64) || null,
    bot_description: str(fd, 'description').slice(0, 512) || null,
    bot_short_description: str(fd, 'short').slice(0, 120) || null,
  };
  await saveSettings(texts);
  const s = await getSettings(true);
  if (s.bot_token && s.app_url) {
    const errors = await applyBotConfig(s.bot_token, s.app_url, s.bot_webhook_secret || '', await currentTexts());
    if (errors.length) back('error', `Matnlar saqlandi, lekin: ${errors.join('; ')}`);
  }
  revalidatePath(PATH);
  back('ok', 'Matnlar saqlandi va botga qo\'llandi');
}

export async function saveAdminChat(fd: FormData) {
  await requireAdmin();
  const id = str(fd, 'admin_chat_id');
  if (id && !/^-?\d+$/.test(id)) back('error', "Chat ID faqat raqamlardan iborat bo'ladi");
  await saveSettings({ admin_chat_id: id || null });
  revalidatePath(PATH);
  back('ok', id ? 'Admin chat ID saqlandi' : "Admin chat ID o'chirildi");
}

export async function sendTestMessage() {
  await requireAdmin();
  const s = await getSettings(true);
  if (!s.admin_chat_id) back('error', 'Avval admin chat ID ni kiriting');
  const r = await tgApi('sendMessage', {
    chat_id: s.admin_chat_id,
    parse_mode: 'HTML',
    text: `✅ <b>Test xabar</b>\n\nBot ishlayapti! Yangi buyurtmalar haqida shu yerga xabar keladi.`,
  });
  if (!r.ok) back('error', `Yuborilmadi: ${r.description}. Avval botga /start yozganmisiz?`);
  back('ok', 'Test xabar yuborildi — Telegramni tekshiring');
}

/** Barcha mijozlarga xabar — bo'laklab yuboriladi (serverless vaqt chegarasi uchun) */
export async function broadcastBatch(text: string, offset: number) {
  await requireAdmin();
  const body = text.trim().slice(0, 4000);
  if (!body) return { error: "Xabar matni bo'sh" };
  const BATCH = 25;
  const { data, count } = await db()
    .from('clients')
    .select('telegram_id', { count: 'exact' })
    .eq('is_blocked', false)
    .order('created_at')
    .range(offset, offset + BATCH - 1);
  const results = await Promise.all(
    (data ?? []).map((c) => tgApi('sendMessage', { chat_id: c.telegram_id, text: esc(body), parse_mode: 'HTML' })),
  );
  const sent = results.filter((r) => r.ok).length;
  const next = offset + BATCH < (count ?? 0) ? offset + BATCH : null;
  return { sent, failed: results.length - sent, total: count ?? 0, next };
}
