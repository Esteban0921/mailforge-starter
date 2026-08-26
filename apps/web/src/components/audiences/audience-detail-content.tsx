'use client';

import { useEffect, useState } from 'react';
import { APP_ROUTES } from '@mailforge/shared';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AddSubscriberForm } from './add-subscriber-form';
import { ImportCsvForm } from './import-csv-form';
import { SubscriberStatusBadge } from './subscriber-status-badge';
import {
  getAudienceStore,
  type Audience,
  type Subscriber,
  type SubscriberStatus,
} from '@/lib/audiences';

const STATUS_FILTERS: { value: SubscriberStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'subscribed', label: 'Suscrito' },
  { value: 'unsubscribed', label: 'Dado de baja' },
  { value: 'bounced', label: 'Rebotado' },
  { value: 'complained', label: 'Marcó como spam' },
];

export function AudienceDetailContent({ audienceId }: { audienceId: string }) {
  const [audience, setAudience] = useState<Audience | null | undefined>(undefined);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [statusFilter, setStatusFilter] = useState<SubscriberStatus | 'all'>('all');

  function reload() {
    const store = getAudienceStore();
    setAudience(store.getAudience(audienceId));
    setSubscribers(
      store.listSubscribers(audienceId, statusFilter === 'all' ? undefined : statusFilter),
    );
  }

  useEffect(reload, [audienceId, statusFilter]);

  if (audience === undefined) return null;

  if (audience === null) {
    return (
      <section>
        <a
          href={APP_ROUTES.audiences}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Volver a audiencias
        </a>
        <p className="mt-4 text-sm text-muted-foreground">Esta audiencia no existe.</p>
      </section>
    );
  }

  return (
    <section>
      <a
        href={APP_ROUTES.audiences}
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Volver a audiencias
      </a>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">{audience.name}</h1>
      {audience.description ? (
        <p className="mt-1.5 text-sm text-muted-foreground">{audience.description}</p>
      ) : null}

      <Card className="mt-6">
        <CardContent className="flex flex-col gap-5 p-5">
          <AddSubscriberForm audienceId={audienceId} onAdded={reload} />
          <ImportCsvForm audienceId={audienceId} onImported={reload} />
        </CardContent>
      </Card>

      <div
        className="mt-6 flex flex-wrap gap-1.5"
        role="group"
        aria-label="Filtrar por estado"
        data-testid="subscriber-status-filter"
      >
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setStatusFilter(filter.value)}
            aria-pressed={statusFilter === filter.value}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              statusFilter === filter.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div
        className="mt-4 overflow-x-auto rounded-lg border border-border"
        data-testid="subscriber-list"
      >
        {subscribers.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">
            Sin suscriptores{statusFilter !== 'all' ? ' con ese estado' : ''} todavía.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Nombre</th>
                <th className="px-4 py-2 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((subscriber) => (
                <tr key={subscriber.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5 text-foreground">{subscriber.email}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {[subscriber.firstName, subscriber.lastName].filter(Boolean).join(' ') || '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <SubscriberStatusBadge status={subscriber.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
