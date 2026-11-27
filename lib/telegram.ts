import 'server-only';
import crypto from 'crypto';
import { appUrl, botToken, getSettings } from './settings';

export type TgUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
};

/** Telegram WebApp initData imzosini tekshiradi (https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app) */
export function validateInitData(initData: string, token: string, maxAgeSec = 60 * 60 * 24): TgUser | null {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');
  const dataCheck = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
  const calc = crypto.createHmac('sha256', secretKey).update(dataCheck).digest('hex');
  if (calc.length !== hash.length || !crypto.timingSafeEqual(Buffer.from(calc), Buffer.from(hash))) return null;
  const authDate = Number(params.get('auth_date'));
  if (!authDate || Date.now() / 1000 - authDate > maxAgeSec) return null;
  try {
    return JSON.parse(params.get('user') || 'null');
  } catch {
    return null;
  }
}

export type TgResult<T = unknown> = { ok: boolean; result?: T; description?: string; error_code?: number };

/** Telegram Bot API chaqiruvi. token berilmasa — saqlangan bot tokeni ishlatiladi. */
export async function tgApi<T = unknown>(method: string, body: Record<string, unknown> = {}, token?: string): Promise<TgResult<T>> {
  const t = token ?? (await botToken());
  if (!t) return { ok: false, description: 'Bot ulanmagan' };
  try {
    const res = await fetch(`${process.env.TELEGRAM_API_BASE || 'https://api.telegram.org'}/bot${t}/${method}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    return (await res.json()) as TgResult<T>;
  } catch (e) {
    console.error('Telegram API xatosi', method, e);
    return { ok: false, description: 'Telegram serveriga ulanib bo\'lmadi' };
  }
}

/** Xabar yuborish. Xato bo'lsa jim o'tadi — asosiy jarayonni to'xtatmaydi. */
export async function notify(chatId: number | string | null | undefined, html: string, withAppButton = false) {
  if (!chatId) return;
  const url = await appUrl();
  const s = await getSettings();
  await tgApi('sendMessage', {
    chat_id: chatId,
    text: html,
    parse_mode: 'HTML',
    link_preview_options: { is_disabled: true },
    ...(withAppButton && url
      ? { reply_markup: { inline_keyboard: [[{ text: `📱 ${s.bot_menu_text || 'Xizmatchini ochish'}`, web_app: { url: `${url}/app` } }]] } }
      : {}),
  });
}

/** Adminga xabar (Bot nazorati bo'limida admin chat ID kiritilgan bo'lsa) */
export async function notifyAdmin(html: string) {
  const s = await getSettings();
  if (s.admin_chat_id) await notify(s.admin_chat_id, html);
}

export const esc = (s: string | null | undefined) =>
  (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
