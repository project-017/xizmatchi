import Link from 'next/link';
import { ArrowRight, CalendarCheck, MapPin, ShieldCheck, Star, Zap } from 'lucide-react';
import { Logo } from '@/components/Logo';

const SERVICES = ['🚰 Santexnik', '⚡ Elektrik', '❄️ Konditsioner', '🎨 Molyar', '🧱 Beton', '🏠 Tom ustasi', '🔲 Kafel', '🔥 Payvandchi', '🪚 Duradgor', '🧹 Tozalash'];

export default function Home() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-ink text-white">
      <div className="pointer-events-none absolute -left-40 top-0 h-[34rem] w-[34rem] rounded-full bg-indigo-600/40 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 top-40 h-[30rem] w-[30rem] rounded-full bg-fuchsia-600/30 blur-[120px]" />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo light />
        <Link href="/login" className="btn border border-white/15 bg-white/5 text-white backdrop-blur hover:bg-white/10">Kirish</Link>
      </header>

      <section className="relative mx-auto max-w-6xl px-5 pb-20 pt-12 text-center sm:pt-20">
        <span className="badge mx-auto border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-indigo-200">
          <Zap className="h-3.5 w-3.5" /> Telegram Mini App
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl">
          Kerakli ustani{' '}
          <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">bir necha bosishda</span>{' '}
          uyingizga chaqiring
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-slate-300 sm:text-lg">
          Usta qidirib yurmang. Xizmatni tanlang, bo'sh vaqtdagi ustani ko'ring va band qiling.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/app" className="btn-primary btn-lg">Mini appni ochish <ArrowRight className="h-4 w-4" /></Link>
          <Link href="/login" className="btn btn-lg border border-white/15 bg-white/5 text-white hover:bg-white/10">Usta / Admin kabineti</Link>
        </div>

        <div className="no-scrollbar mx-auto mt-14 flex max-w-4xl flex-wrap justify-center gap-2">
          {SERVICES.map((s) => (
            <span key={s} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 backdrop-blur">{s}</span>
          ))}
        </div>

        <div className="mx-auto mt-16 grid max-w-4xl gap-4 text-left sm:grid-cols-3">
          {[
            { i: MapPin, t: 'Xizmatni tanlang', d: '14+ turdagi ustalar bir joyda' },
            { i: CalendarCheck, t: "Bo'sh vaqtni band qiling", d: "Ustaning jadvalidan qulay vaqtni tanlang" },
            { i: Star, t: 'Baholang', d: 'Reyting orqali eng yaxshisini toping' },
          ].map(({ i: Icon, t, d }) => (
            <div key={t} className="rounded-2xl border border-white/10 bg-white/[.04] p-5 backdrop-blur">
              <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500"><Icon className="h-5 w-5" /></div>
              <div className="font-bold">{t}</div>
              <div className="mt-1 text-sm text-slate-400">{d}</div>
            </div>
          ))}
        </div>
        <p className="mt-12 flex items-center justify-center gap-2 text-xs text-slate-500"><ShieldCheck className="h-4 w-4" /> Barcha ustalar admin tomonidan tekshiriladi</p>
      </section>
    </main>
  );
}
