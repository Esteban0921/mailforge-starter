import { cn } from '@/lib/utils';
import type { SubscriberStatus } from '@/lib/audiences';

const STATUS_LABEL: Record<SubscriberStatus, string> = {
  pending: 'Pendiente',
  subscribed: 'Suscrito',
  unsubscribed: 'Dado de baja',
  bounced: 'Rebotado',
  complained: 'Marcó como spam',
};

const STATUS_CLASSES: Record<SubscriberStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  subscribed: 'bg-emerald-100 text-emerald-800',
  unsubscribed: 'bg-muted text-muted-foreground',
  bounced: 'bg-red-100 text-red-800',
  complained: 'bg-red-100 text-red-800',
};

export function SubscriberStatusBadge({ status }: { status: SubscriberStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        STATUS_CLASSES[status],
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export const SUBSCRIBER_STATUS_LABEL = STATUS_LABEL;
