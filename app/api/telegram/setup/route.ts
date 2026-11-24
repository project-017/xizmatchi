import { getSession } from '@/lib/auth';
import { tgApi } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

/** Faqat admin: webhook, menyu tugmasi va buyruqlarni o'rnatadi */
export async function POST() {
  const s = await getSession();
  if (s?.role !== 'admin') return Response.json({ error: 'Ruxsat yo\'q' }, { status: 403 });
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (!url || !process.env.TELEGRAM_BOT_TOKEN) {
    return Response.json({ error: 'NEXT_PUBLIC_APP_URL yoki TELEGRAM_BOT_TOKEN sozlanmagan' }, { status: 400 });
  }
  const results = {
    webhook: await tgApi('setWebhook', {
      url: `${url}/api/telegram/webhook`,
      secret_token: process.env.TELEGRAM_WEBHOOK_SECRET || undefined,
      allowed_updates: ['message'],
    }),
    menu: await tgApi('setChatMenuButton', {
      menu_button: { type: 'web_app', text: 'Usta topish', web_app: { url: `${url}/app` } },
    }),
    commands: await tgApi('setMyCommands', {
      commands: [
        { command: 'start', description: 'Ilovani ochish' },
        { command: 'id', description: 'Telegram ID raqamim' },
      ],
    }),
  };
  return Response.json(results);
}
