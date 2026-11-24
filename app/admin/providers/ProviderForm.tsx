import { KeyRound } from 'lucide-react';
import type { Category, Provider } from '@/lib/types';
import { SubmitButton } from '@/components/SubmitButton';

export function ProviderForm({ action, categories, p }: { action: (fd: FormData) => Promise<void>; categories: Category[]; p?: Provider }) {
  const genPass = Math.random().toString(36).slice(2, 10);
  return (
    <form action={action} className="grid gap-6 lg:grid-cols-3">
      {p && <input type="hidden" name="id" value={p.id} />}
      <div className="card space-y-5 p-6 lg:col-span-2">
        <h2 className="font-bold">Asosiy ma'lumotlar</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Ism familiya *</label>
            <input name="full_name" required defaultValue={p?.full_name} className="input" placeholder="Aliyev Vali" />
          </div>
          <div>
            <label className="label">Xizmat turi</label>
            <select name="category_id" defaultValue={p?.category_id ?? ''} className="input">
              <option value="">— tanlang —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Telefon</label>
            <input name="phone" defaultValue={p?.phone ?? ''} className="input" placeholder="+998 90 123 45 67" />
          </div>
          <div>
            <label className="label">Tajriba (yil)</label>
            <input name="experience_years" type="number" min={0} defaultValue={p?.experience_years ?? 0} className="input" />
          </div>
          <div>
            <label className="label">Hudud / tuman</label>
            <input name="district" defaultValue={p?.district ?? ''} className="input" placeholder="Chilonzor, Toshkent" />
          </div>
          <div>
            <label className="label">Narx (dan, so'm)</label>
            <input name="price_from" type="number" min={0} step={1000} defaultValue={p?.price_from ?? 0} className="input" />
          </div>
          <div>
            <label className="label">Narx birligi</label>
            <input name="price_unit" defaultValue={p?.price_unit ?? 'xizmat'} className="input" placeholder="xizmat / soat / m²" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Usta haqida</label>
            <textarea name="bio" rows={4} defaultValue={p?.bio ?? ''} className="input" placeholder="Qanday ishlarni bajaradi, kafolat va h.k." />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Rasm URL (ixtiyoriy)</label>
            <input name="avatar_url" defaultValue={p?.avatar_url ?? ''} className="input" placeholder="https://..." />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="card space-y-4 p-6">
          <h2 className="flex items-center gap-2 font-bold"><KeyRound className="h-4 w-4 text-indigo-500" /> Kirish ma'lumotlari</h2>
          <div>
            <label className="label">Login *</label>
            <input name="login" required defaultValue={p?.login} className="input font-mono" placeholder="vali_santexnik" />
          </div>
          <div>
            <label className="label">{p ? "Yangi parol (o'zgartirish uchun)" : 'Parol *'}</label>
            <input name="password" required={!p} defaultValue={p ? '' : genPass} className="input font-mono" placeholder={p ? "bo'sh qoldiring" : ''} />
            {!p && <p className="mt-1.5 text-xs text-slate-400">Avtomatik yaratildi — o'zgartirishingiz mumkin</p>}
          </div>
          <div>
            <label className="label">Telegram chat ID</label>
            <input name="telegram_chat_id" defaultValue={p?.telegram_chat_id ?? ''} className="input font-mono" placeholder="123456789" />
            <p className="mt-1.5 text-xs text-slate-400">Usta botga <b>/id</b> yozsa, raqamini oladi. Yangi buyurtmalar shu yerga keladi.</p>
          </div>
          {p && (
            <label className="flex cursor-pointer items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-sm font-semibold">Profil faol</span>
              <input type="checkbox" name="is_active" defaultChecked={p.is_active} className="h-5 w-5 accent-indigo-600" />
            </label>
          )}
        </div>
        <SubmitButton className="btn-primary btn-lg w-full">{p ? 'Saqlash' : 'Usta yaratish'}</SubmitButton>
      </div>
    </form>
  );
}
