'use client';
import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';

export function SubmitButton({
  children,
  className = 'btn-primary',
  confirm,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { confirm?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      {...rest}
      type="submit"
      disabled={pending || rest.disabled}
      className={className}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
        rest.onClick?.(e);
      }}
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
