import { tgApi, esc } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

/** Bot webhook: /start → mini app tugmasi + foydalanuvchining Telegram ID'si */
export async function POST(req: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret && req.headers.get('x-telegram-bot-api-secret-token') !== secret) {
    return new Response('forbidden', { status: 403 });
  }
  const update = await req.json().catch(() => null);
  const msg = update?.message;
  if (!msg?.chat?.id) return Response.json({ ok: true });

  const url = process.env.NEXT_PUBLIC_APP_URL;
  const text: string = msg.text || '';

  if (text.startsWith('/start') || text.startsWith('/app')) {
    await tgApi('sendMessage', {
      chat_id: msg.chat.id,
      parse_mode: 'HTML',
      text:
        `Assalomu alaykum, <b>${esc(msg.from?.first_name)}</b>! 👋\n\n` +
        `<b>Xizmatchi</b> — uyingizga kerakli ustani bir necha bosishda chaqiring:\n` +
        `🚰 santexnik, ⚡ elektrik, ❄️ konditsioner, 🎨 molyar va boshqalar.\n\n` +
        `Quyidagi tugmani bosing 👇`,
      reply_markup: url ? { inline_keyboard: [[{ text: '🛠 Usta topish', web_app: { url: `${url}/app` } }]] } : undefined,
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
    });
  }
  return Response.json({ ok: true });
}
