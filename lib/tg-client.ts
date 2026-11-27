import 'server-only';
import { db } from './supabase';
import { validateInitData, type TgUser } from './telegram';
import { botToken } from './settings';
import type { Client } from './types';

/** Mini app so'rovidan Telegram foydalanuvchini aniqlaydi va mijozni bazada yangilaydi */
export async function getTgClient(req: Request): Promise<Client | null> {
  const initData = req.headers.get('x-telegram-init-data') || '';
  const token = await botToken();
  let user: TgUser | null = null;
  if (initData && token) user = validateInitData(initData, token);
  if (!user && process.env.ALLOW_DEV_USER === 'true') {
    user = { id: 1000001, first_name: 'Test', last_name: 'Mijoz', username: 'test_user' };
  }
  if (!user) return null;

  const { data, error } = await db()
    .from('clients')
    .upsert(
      {
        telegram_id: user.id,
        first_name: user.first_name ?? null,
        last_name: user.last_name ?? null,
        username: user.username ?? null,
        photo_url: user.photo_url ?? null,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'telegram_id' },
    )
    .select('*')
    .single();
  if (error) {
    console.error(error);
    return null;
  }
  return data as Client;
}

export const json = (data: unknown, status = 200) => Response.json(data, { status });
export const unauthorized = () => json({ error: 'Telegram orqali kiring' }, 401);
