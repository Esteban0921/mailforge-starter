'use client';

import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { audienceDetailRoute } from '@mailforge/shared';
import { Card, CardContent } from '@/components/ui/card';
import { CreateAudienceForm } from './create-audience-form';
import { getAudienceStore, type Audience } from '@/lib/audiences';

export function AudiencesContent() {
  const [audiences, setAudiences] = useState<Audience[] | null>(null);

  function reload() {
    setAudiences(getAudienceStore().listAudiences());
  }

  useEffect(reload, []);

  if (audiences === null) return null;

  return (
    <section>
      <h1 className="text-2xl font-semibold tracking-tight">Audiencias</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Listas de suscriptores. Cada audiencia gestiona sus propios contactos y su propio estado de
        consentimiento.
      </p>

      <Card className="mt-6">
        <CardContent className="p-5">
          <CreateAudienceForm onCreated={reload} />
        </CardContent>
      </Card>

      {audiences.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">Todavía no hay ninguna audiencia.</p>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {audiences.map((audience) => (
            <li key={audience.id}>
              <a
                href={audienceDetailRoute(audience.id)}
                data-testid={`audience-card-${audience.name}`}
                className="block rounded-lg border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <div className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Users className="size-4.5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{audience.name}</p>
                    {audience.description ? (
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {audience.description}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {getAudienceStore().listSubscribers(audience.id).length} suscriptores
                    </p>
                  </div>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
