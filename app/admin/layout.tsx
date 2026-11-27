import { Bot, CalendarDays, FolderKanban, LayoutDashboard, Settings, Users, Wrench } from 'lucide-react';
import { requireAdmin } from '@/lib/auth';
import { Shell } from '@/components/Shell';

export const dynamic = 'force-dynamic';

const I = 'h-4 w-4';
const nav = [
  { href: '/admin', label: 'Boshqaruv', icon: <LayoutDashboard className={I} />, exact: true },
  { href: '/admin/providers', label: 'Ustalar', icon: <Wrench className={I} /> },
  { href: '/admin/categories', label: 'Xizmat turlari', icon: <FolderKanban className={I} /> },
  { href: '/admin/bookings', label: 'Buyurtmalar', icon: <CalendarDays className={I} /> },
  { href: '/admin/clients', label: 'Mijozlar', icon: <Users className={I} /> },
  { href: '/admin/bot', label: 'Bot nazorati', icon: <Bot className={I} /> },
  { href: '/admin/settings', label: 'Sozlamalar', icon: <Settings className={I} /> },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await requireAdmin();
  return <Shell nav={nav} user={s.name} role="Administrator">{children}</Shell>;
}
