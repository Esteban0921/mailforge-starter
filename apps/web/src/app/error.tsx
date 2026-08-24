'use client';

import { useEffect } from 'react';
import { APP_ROUTES } from '@mailforge/shared';

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
    <main className="flex min-h-screen flex-col items-center justify-center bg-hierro px-4 text-center text-papel">
      <p className="font-mono text-xs tracking-[0.25em] text-ceniza uppercase">Error</p>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Algo se rompió en el taller</h1>
      <p className="mt-3 max-w-sm text-sm text-ceniza">
        El error ha quedado registrado. Puedes intentar de nuevo o volver al inicio.
      </p>
      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md border border-hierro-2 px-4 py-2 font-mono text-sm font-semibold tracking-wider text-papel uppercase transition-colors hover:bg-hierro-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brasa"
        >
          Reintentar
        </button>
        <a
          href={APP_ROUTES.home}
          className="rounded-md bg-brasa px-4 py-2 font-mono text-sm font-semibold tracking-wider text-hierro uppercase transition-colors hover:bg-calor focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brasa"
        >
          Ir al inicio
        </a>
      </div>
    </main>
  );
}
