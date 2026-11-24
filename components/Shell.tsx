import { LogOut } from 'lucide-react';
import { Logo } from './Logo';
import { NavLink } from './NavLink';
import { logout } from '@/app/actions';

export type NavItem = { href: string; label: string; icon: React.ReactNode; exact?: boolean };

/** Admin va usta kabineti uchun umumiy karkas: desktopda sidebar, mobilda yuqori menyu */
export function Shell({ nav, user, role, children }: { nav: NavItem[]; user: string; role: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh lg:flex">
      <aside className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur lg:h-dvh lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-4 py-3 lg:px-5 lg:py-6">
          <Logo />
          <form action={logout} className="lg:hidden">
            <button className="btn-ghost btn-sm"><LogOut className="h-3.5 w-3.5" /> Chiqish</button>
          </form>
        </div>
        <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-3">
          {nav.map((n) => (
            <NavLink key={n.href} href={n.href} exact={n.exact}>{n.icon}{n.label}</NavLink>
          ))}
        </nav>
        <div className="absolute inset-x-3 bottom-4 hidden lg:block">
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-bold">{user}</div>
              <div className="text-xs text-slate-500">{role}</div>
            </div>
            <form action={logout}>
              <button title="Chiqish" className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 transition hover:bg-rose-50 hover:text-rose-600">
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-6xl animate-fade-up">{children}</div>
      </main>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Empty({ icon, title, text }: { icon: React.ReactNode; title: string; text?: string }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-500">{icon}</div>
      <div className="font-bold">{title}</div>
      {text && <div className="mt-1 max-w-sm text-sm text-slate-500">{text}</div>}
    </div>
  );
}
