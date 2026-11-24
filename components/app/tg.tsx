'use client';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import { LogoMark } from '../Logo';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window { Telegram?: { WebApp: any } }
}

export const tg = (): any => (typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined);

export async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'content-type': 'application/json', 'x-telegram-init-data': tg()?.initData || '', ...(init?.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Xatolik yuz berdi');
  return data as T;
}

export function haptic(kind: 'light' | 'medium' | 'success' | 'error' | 'select' = 'light') {
  const h = tg()?.HapticFeedback;
  if (!h) return;
  try {
    if (kind === 'success' || kind === 'error') h.notificationOccurred(kind);
    else if (kind === 'select') h.selectionChanged();
    else h.impactOccurred(kind);
  } catch {}
}

type TgUser = { id: number; first_name: string; last_name?: string; username?: string; photo_url?: string };
const Ctx = createContext<{ user: TgUser | null; inTelegram: boolean }>({ user: null, inTelegram: false });
export const useTg = () => useContext(Ctx);

function applyTheme() {
  const w = tg();
  const dark = w?.colorScheme === 'dark';
  document.documentElement.classList.toggle('dark', dark);
  try {
    w?.setHeaderColor?.(dark ? '#0b0d17' : '#f8fafc');
    w?.setBackgroundColor?.(dark ? '#0b0d17' : '#f8fafc');
    w?.setBottomBarColor?.(dark ? '#0b0d17' : '#ffffff');
  } catch {}
}

export function TgProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [value, setValue] = useState<{ user: TgUser | null; inTelegram: boolean }>({ user: null, inTelegram: false });

  const init = () => {
    const w = tg();
    if (w) {
      w.ready();
      w.expand();
      try { w.disableVerticalSwipes?.(); } catch {}
      applyTheme();
      w.onEvent?.('themeChanged', applyTheme);
      setValue({ user: w.initDataUnsafe?.user ?? null, inTelegram: !!w.initData });
    }
    setReady(true);
  };

  useEffect(() => {
    if (tg()) init();
    const t = setTimeout(() => setReady(true), 2500); // skript yuklanmasa ham ochilsin
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Ctx.Provider value={value}>
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive" onReady={init} onError={() => setReady(true)} />
      {ready ? (
        children
      ) : (
        <div className="grid min-h-dvh place-items-center">
          <div className="animate-pop"><LogoMark className="h-16 w-16" /></div>
        </div>
      )}
    </Ctx.Provider>
  );
}

/** Telegram'ning tizim "orqaga" tugmasi */
export function useBackButton(fallback = '/app') {
  const router = useRouter();
  useEffect(() => {
    const bb = tg()?.BackButton;
    if (!bb) return;
    const go = () => {
      haptic('light');
      if (window.history.length > 1) router.back();
      else router.push(fallback);
    };
    bb.show();
    bb.onClick(go);
    return () => {
      bb.offClick(go);
      bb.hide();
    };
  }, [router, fallback]);
}
