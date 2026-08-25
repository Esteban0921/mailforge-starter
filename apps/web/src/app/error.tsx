'use client';

import { useEffect } from 'react';
import { APP_ROUTES } from '@mailforge/shared';
import { Button, LinkButton } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[web] unhandled render error', error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <p className="text-sm font-medium text-muted-foreground">Error</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
        Algo ha ido mal
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        El error ha quedado registrado. Puedes intentarlo de nuevo o volver al inicio.
      </p>
      <div className="mt-6 flex gap-3">
        <Button variant="outline" onClick={reset}>
          Reintentar
        </Button>
        <LinkButton href={APP_ROUTES.home}>Ir al inicio</LinkButton>
      </div>
    </main>
  );
}
