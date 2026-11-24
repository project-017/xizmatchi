import { STATUS } from '@/lib/format';
import type { BookingStatus } from '@/lib/types';

export function StatusBadge({ status }: { status: BookingStatus }) {
  const s = STATUS[status];
  return (
    <span className={`badge ${s.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
