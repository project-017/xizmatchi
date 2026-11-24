import 'server-only';
import crypto from 'crypto';

export type TgUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
};

/** Telegram WebApp initData imzosini tekshiradi (https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app) */
export function validateInitData(initData: string, botToken: string, maxAgeSec = 60 * 60 * 24): TgUser | null {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');
  const dataCheck = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
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

export async function tgApi(method: string, body: Record<string, unknown>) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (e) {
    console.error('Telegram API xatosi', method, e);
    return null;
  }
}

/** Xabar yuborish. Xato bo'lsa jim o'tadi — asosiy jarayonni to'xtatmaydi. */
export async function notify(chatId: number | string | null | undefined, html: string, withAppButton = false) {
  if (!chatId) return;
  const url = process.env.NEXT_PUBLIC_APP_URL;
  await tgApi('sendMessage', {
    chat_id: chatId,
    text: html,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...(withAppButton && url
      ? { reply_markup: { inline_keyboard: [[{ text: '📱 Xizmatchini ochish', web_app: { url: `${url}/app` } }]] } }
      : {}),
  });
}

export const esc = (s: string | null | undefined) =>
  (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
