import type { BookingStatus } from './types';

/** Toshkent vaqti: UTC+5 (yozgi vaqt yo'q) */
const OFFSET_MS = 5 * 60 * 60 * 1000;
const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
const WEEKDAYS = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
const WD_SHORT = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];

const pad = (n: number) => String(n).padStart(2, '0');
const local = (d: string | Date) => new Date(new Date(d).getTime() + OFFSET_MS);

export const fmtTime = (d: string | Date) => {
  const x = local(d);
  return `${pad(x.getUTCHours())}:${pad(x.getUTCMinutes())}`;
};
export const fmtDate = (d: string | Date) => {
  const x = local(d);
  return `${x.getUTCDate()}-${MONTHS[x.getUTCMonth()]}`;
};
export const fmtDateTime = (d: string | Date) => `${fmtDate(d)}, ${fmtTime(d)}`;

/** YYYY-MM-DD (Toshkent bo'yicha) */
export const dayKey = (d: string | Date) => {
  const x = local(d);
  return `${x.getUTCFullYear()}-${pad(x.getUTCMonth() + 1)}-${pad(x.getUTCDate())}`;
};
export const todayKey = () => dayKey(new Date());
export const addDays = (key: string, n: number) => {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export function dayParts(key: string) {
  const d = new Date(`${key}T00:00:00Z`);
  const today = todayKey();
  const label = key === today ? 'Bugun' : key === addDays(today, 1) ? 'Ertaga' : WEEKDAYS[d.getUTCDay()];
  return { label, short: WD_SHORT[d.getUTCDay()], day: d.getUTCDate(), month: MONTHS[d.getUTCMonth()] };
}

/** "2026-11-24" + "09:30" (Toshkent) → ISO UTC */
export const toUtcIso = (date: string, time: string) => new Date(`${date}T${time}:00+05:00`).toISOString();

export const money = (n: number) => `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} so'm`;

export function timeAgo(d: string | Date) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'hozirgina';
  if (s < 3600) return `${Math.floor(s / 60)} daqiqa oldin`;
  if (s < 86400) return `${Math.floor(s / 3600)} soat oldin`;
  return fmtDate(d);
}

export const STATUS: Record<BookingStatus, { label: string; cls: string; dot: string }> = {
  pending:   { label: 'Kutilmoqda',    cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',     dot: 'bg-amber-500' },
  accepted:  { label: 'Qabul qilindi', cls: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',             dot: 'bg-sky-500' },
  on_way:    { label: "Usta yo'lda",   cls: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300', dot: 'bg-violet-500' },
  completed: { label: 'Bajarildi',     cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300', dot: 'bg-emerald-500' },
  cancelled: { label: 'Bekor qilindi', cls: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300',         dot: 'bg-slate-400' },
  rejected:  { label: 'Rad etildi',    cls: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',         dot: 'bg-rose-500' },
};

export const initials = (name?: string | null) =>
  (name || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');

const GRADIENTS = [
  'from-indigo-500 to-violet-500', 'from-sky-500 to-cyan-400', 'from-rose-500 to-orange-400',
  'from-emerald-500 to-teal-400', 'from-fuchsia-500 to-pink-500', 'from-amber-500 to-orange-500',
];
export function gradientFor(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return GRADIENTS[Math.abs(h) % GRADIENTS.length];
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[ʻʼ'`‘’]/g, '')
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || `xizmat-${Date.now().toString(36)}`;
}
