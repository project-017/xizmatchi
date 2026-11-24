import { toggleAvailable } from '@/app/panel/actions';
import { SubmitButton } from './SubmitButton';

export function AvailabilityToggle({ available }: { available: boolean }) {
  return (
    <form action={toggleAvailable}>
      <SubmitButton
        className={`btn rounded-full px-4 ${available ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100' : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-200'}`}
      >
        <span className={`relative flex h-2.5 w-2.5`}>
          {available && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
          <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${available ? 'bg-emerald-500' : 'bg-slate-400'}`} />
        </span>
        {available ? "Bo'shman — buyurtma olaman" : 'Bandman'}
      </SubmitButton>
    </form>
  );
}
