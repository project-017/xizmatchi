import { gradientFor, initials } from '@/lib/format';

export function Avatar({ name, url, size = 48, className = '' }: { name: string; url?: string | null; size?: number; className?: string }) {
  const style = { width: size, height: size, fontSize: size * 0.36 };
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={name} style={style} className={`shrink-0 rounded-2xl object-cover ${className}`} />;
  }
  return (
    <div style={style} className={`grid shrink-0 place-items-center rounded-2xl bg-gradient-to-br font-extrabold text-white ${gradientFor(name)} ${className}`}>
      {initials(name)}
    </div>
  );
}
