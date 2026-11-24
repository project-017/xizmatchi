import type { Metadata } from 'next';
import { TgProvider } from '@/components/app/tg';

export const metadata: Metadata = { title: 'Xizmatchi' };

export default function MiniAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <TgProvider>
      <div className="mx-auto min-h-dvh max-w-md px-4 pb-28 dark:text-slate-100">{children}</div>
    </TgProvider>
  );
}
