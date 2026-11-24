import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { db } from '@/lib/supabase';
import { PageHeader } from '@/components/Shell';
import { Flash } from '@/components/Flash';
import { ProviderForm } from '../ProviderForm';
import { createProvider } from '../../actions';

export default async function NewProvider({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const { data: categories } = await db().from('categories').select('*').order('sort');
  return (
    <>
      <Link href="/admin/providers" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4" /> Ustalar</Link>
      <PageHeader title="Yangi usta" subtitle="Usta uchun profil va login-parol yarating" />
      <Flash error={error} />
      <ProviderForm action={createProvider} categories={categories ?? []} />
    </>
  );
}
