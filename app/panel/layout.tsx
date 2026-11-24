import { CalendarClock, ClipboardList, UserRound } from 'lucide-react';
import { requireProvider } from '@/lib/auth';
import { Shell } from '@/components/Shell';

export const dynamic = 'force-dynamic';

const I = 'h-4 w-4';
const nav = [
  { href: '/panel', label: 'Buyurtmalar', icon: <ClipboardList className={I} />, exact: true },
  { href: '/panel/schedule', label: "Ish jadvali", icon: <CalendarClock className={I} /> },
  { href: '/panel/profile', label: 'Profilim', icon: <UserRound className={I} /> },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const s = await requireProvider();
  return <Shell nav={nav} user={s.name} role="Usta">{children}</Shell>;
}
