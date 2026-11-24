import { KeyRound, Send } from 'lucide-react';
import { requireProvider } from '@/lib/auth';
import { db } from '@/lib/supabase';
import { PageHeader } from '@/components/Shell';
import { Flash } from '@/components/Flash';
import { Avatar } from '@/components/Avatar';
import { SubmitButton } from '@/components/SubmitButton';
import { changePassword, updateProfile } from '../actions';

export default async function Profile({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const s = await requireProvider();
  const { ok, error } = await searchParams;
  const { data: p } = await db().from('providers').select('*, category:categories(name,icon)').eq('id', s.id).single();
  if (!p) return null;

  return (
    <>
      <PageHeader title="Profilim" subtitle="Mijozlar mini appda shu ma'lumotlarni ko'radi" />
      <Flash ok={ok} error={error} />
      <div className="grid gap-6 lg:grid-cols-3">
        <form action={updateProfile} className="card space-y-4 p-6 lg:col-span-2">
          <div className="mb-2 flex items-center gap-4">
            <Avatar name={p.full_name} url={p.avatar_url} size={64} />
            <div>
              <div className="text-lg font-extrabold">{p.full_name}</div>
              <div className="text-sm text-slate-500">{p.category?.icon} {p.category?.name ?? 'Kategoriya belgilanmagan'} · login: <code>{p.login}</code></div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label">Telefon</label><input name="phone" defaultValue={p.phone ?? ''} className="input" /></div>
            <div><label className="label">Hudud</label><input name="district" defaultValue={p.district ?? ''} className="input" /></div>
            <div><label className="label">Narx (dan)</label><input name="price_from" type="number" step={1000} defaultValue={p.price_from} className="input" /></div>
            <div><label className="label">Birlik</label><input name="price_unit" defaultValue={p.price_unit} className="input" /></div>
            <div><label className="label">Tajriba (yil)</label><input name="experience_years" type="number" defaultValue={p.experience_years} className="input" /></div>
            <div>
              <label className="label">Telegram chat ID</label>
              <input name="telegram_chat_id" defaultValue={p.telegram_chat_id ?? ''} className="input font-mono" placeholder="botga /id yozing" />
            </div>
            <div className="sm:col-span-2"><label className="label">O'zim haqimda</label><textarea name="bio" rows={4} defaultValue={p.bio ?? ''} className="input" /></div>
          </div>
          <SubmitButton className="btn-primary">Saqlash</SubmitButton>
        </form>

        <div className="space-y-6">
          <form action={changePassword} className="card space-y-4 p-6">
            <h2 className="flex items-center gap-2 font-bold"><KeyRound className="h-4 w-4 text-indigo-500" /> Parolni o'zgartirish</h2>
            <div><label className="label">Joriy parol</label><input name="current" type="password" required className="input" /></div>
            <div><label className="label">Yangi parol</label><input name="next" type="password" required minLength={6} className="input" /></div>
            <SubmitButton className="btn-dark w-full">O'zgartirish</SubmitButton>
          </form>
          <div className="card p-6 text-sm text-slate-600">
            <h2 className="mb-2 flex items-center gap-2 font-bold text-slate-900"><Send className="h-4 w-4 text-sky-500" /> Telegram xabarnomalar</h2>
            Botga <b>/id</b> deb yozing, kelgan raqamni &quot;Telegram chat ID&quot; maydoniga kiriting. Yangi buyurtmalar darhol Telegramga keladi.
          </div>
        </div>
      </div>
    </>
  );
}
