export function LogoMark({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <div className={`relative grid place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 shadow-glow ${className}`}>
      <svg viewBox="0 0 24 24" className="h-1/2 w-1/2 text-white" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    </div>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark className="h-9 w-9" />
      <span className={`text-lg font-extrabold tracking-tight ${light ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
        Xizmat<span className="bg-gradient-to-r from-indigo-500 to-fuchsia-500 bg-clip-text text-transparent">chi</span>
      </span>
    </div>
  );
}
