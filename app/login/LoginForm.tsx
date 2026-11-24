'use client';
import { useActionState, useState } from 'react';
import { Eye, EyeOff, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';
import { login } from '../actions';
import { SubmitButton } from '@/components/SubmitButton';

export function LoginForm({ initialError }: { initialError?: string }) {
  const [state, action] = useActionState(login, initialError ? { error: initialError } : undefined);
  const [show, setShow] = useState(false);
  return (
    <form action={action} className="space-y-4">
      {state?.error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-3.5 py-3 text-sm font-medium text-rose-600">
          <AlertCircle className="h-4 w-4 shrink-0" /> {state.error}
        </div>
      )}
      <div>
        <label className="label">Login</label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input name="login" autoComplete="username" required className="input pl-10" placeholder="masalan: ali_santexnik" />
        </div>
      </div>
      <div>
        <label className="label">Parol</label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input name="password" type={show ? 'text' : 'password'} autoComplete="current-password" required className="input px-10" placeholder="••••••••" />
          <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <SubmitButton className="btn-primary btn-lg w-full">
        Kirish <ArrowRight className="h-4 w-4" />
      </SubmitButton>
    </form>
  );
}
