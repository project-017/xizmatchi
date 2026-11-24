'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NavLink({ href, children, exact = false }: { href: string; children: React.ReactNode; exact?: boolean }) {
  const path = usePathname();
  const active = exact ? path === href : path === href || path.startsWith(href + '/');
  return (
    <Link
      href={href}
      className={`flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
        active
          ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-glow'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {children}
    </Link>
  );
}
