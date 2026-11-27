import { tgApi, esc } from '@/lib/telegram';
import { appUrl, getSettings, webhookSecret, DEFAULT_TEXTS } from '@/lib/settings';

export const dynamic = 'force-dynamic';

/** Mijoz boti webhook: /start → mini app tugmasi, /id → Telegram ID */
export async function POST(req: Request) {
  const secret = await webhookSecret();
  if (secret && req.headers.get('x-telegram-bot-api-secret-token') !== secret) {
    return new Response('forbidden', { status: 403 });
  }
  const update = await req.json().catch(() => null);
  const msg = update?.message;
  if (!msg?.chat?.id) return Response.json({ ok: true });

  const [url, s] = await Promise.all([appUrl(), getSettings()]);
  const text: string = msg.text || '';
  const button = url ? { inline_keyboard: [[{ text: `🛠 ${s.bot_menu_text || DEFAULT_TEXTS.menu}`, web_app: { url: `${url}/app` } }]] } : undefined;

  if (text.startsWith('/start') || text.startsWith('/app')) {
    await tgApi('sendMessage', {
      chat_id: msg.chat.id,
      parse_mode: 'HTML',
      text: (s.bot_welcome || DEFAULT_TEXTS.welcome).replaceAll('{name}', esc(msg.from?.first_name)),
      reply_markup: button,
    });
  } else if (text.startsWith('/id')) {
    await tgApi('sendMessage', {
      chat_id: msg.chat.id,
      parse_mode: 'HTML',
      text: `Sizning Telegram ID: <code>${msg.chat.id}</code>\n\nUsta bo'lsangiz, shu raqamni profilingizga kiriting — yangi buyurtmalar haqida xabar olasiz.`,
    });
  } else {
    await tgApi('sendMessage', {
      chat_id: msg.chat.id,
      text: 'Buyruqlar:\n/start — ilovani ochish\n/id — Telegram ID raqamingiz',
      reply_markup: button,
    });
  }
  return Response.json({ ok: true });
}
