import 'server-only';
import { db } from './supabase';

export type SettingKey =
  | 'bot_token'
  | 'bot_webhook_secret'
  | 'bot_id'
  | 'bot_username'
  | 'bot_name'
  | 'bot_connected_at'
  | 'app_url'
  | 'admin_chat_id'
  | 'bot_welcome'
  | 'bot_menu_text'
  | 'bot_description'
  | 'bot_short_description';

export type Settings = Partial<Record<SettingKey, string>> & { _missingTable?: boolean };

let cache: { at: number; data: Settings } | null = null;
const TTL = 15_000;

/** Barcha sozlamalar (15 soniya keshlanadi) */
export async function getSettings(fresh = false): Promise<Settings> {
  if (!fresh && cache && Date.now() - cache.at < TTL) return cache.data;
  const { data, error } = await db().from('app_settings').select('key,value');
  if (error) {
    // Jadval hali yaratilmagan bo'lsa ham tizim .env bilan ishlashda davom etadi
    return { _missingTable: error.code === '42P01' || /app_settings/.test(error.message) };
  }
  const out: Settings = {};
  for (const r of data ?? []) out[r.key as SettingKey] = r.value;
  cache = { at: Date.now(), data: out };
  return out;
}

/** Saqlash. null yoki '' qiymat — o'chiradi */
export async function saveSettings(values: Partial<Record<SettingKey, string | null>>) {
  const upserts = Object.entries(values)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([key, value]) => ({ key, value: String(value), updated_at: new Date().toISOString() }));
  const deletes = Object.entries(values).filter(([, v]) => v === null || v === '').map(([k]) => k);
  if (upserts.length) {
    const { error } = await db().from('app_settings').upsert(upserts, { onConflict: 'key' });
    if (error) throw new Error(error.message);
  }
  if (deletes.length) await db().from('app_settings').delete().in('key', deletes);
  cache = null;
}

/** Bot tokeni: avval admin saytda kiritilgani, bo'lmasa .env */
export async function botToken() {
  return (await getSettings()).bot_token || process.env.TELEGRAM_BOT_TOKEN || '';
}

export async function webhookSecret() {
  return (await getSettings()).bot_webhook_secret || process.env.TELEGRAM_WEBHOOK_SECRET || '';
}

/** Saytning ochiq manzili (https://...) */
export async function appUrl() {
  return ((await getSettings()).app_url || process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/+$/, '');
}

export const DEFAULT_TEXTS = {
  welcome:
    'Assalomu alaykum, <b>{name}</b>! 👋\n\n' +
    '<b>Xizmatchi</b> — uyingizga kerakli ustani bir necha bosishda chaqiring:\n' +
    '🚰 santexnik, ⚡ elektrik, ❄️ konditsioner, 🎨 molyar va boshqalar.\n\n' +
    'Quyidagi tugmani bosing 👇',
  menu: 'Usta topish',
  description:
    "Xizmatchi — uyingizga usta chaqirish xizmati. Santexnik, elektrik, konditsioner ustasi, molyar va boshqa ustalarni bo'sh vaqtiga qarab band qiling.",
  short: 'Kerakli ustani uyingizga bir necha bosishda chaqiring 🛠',
};
