import { redirect } from 'next/navigation';
import { ShieldCheck, Wrench } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { Logo } from '@/components/Logo';
import { LoginForm } from './LoginForm';

export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const s = await getSession();
  if (s && !error) redirect(s.role === 'admin' ? '/admin' : '/panel');

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-400/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-fuchsia-400/25 blur-3xl" />

      <div className="relative w-full max-w-md animate-fade-up">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="card p-7 sm:p-8">
          <h1 className="text-2xl font-extrabold tracking-tight">Xush kelibsiz 👋</h1>
          <p className="mb-6 mt-1 text-sm text-slate-500">Admin yoki usta profilingizga kiring</p>
          <LoginForm initialError={error} />
          <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3"><ShieldCheck className="h-4 w-4 text-indigo-500" /> Admin panel</div>
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3"><Wrench className="h-4 w-4 text-fuchsia-500" /> Usta kabineti</div>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">Usta profili faqat admin tomonidan yaratiladi</p>
      </div>
    </main>
  );
}
