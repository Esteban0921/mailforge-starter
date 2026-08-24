import type { Metadata } from 'next';
import { APP_ROUTES } from '@mailforge/shared';

export const metadata: Metadata = {
  title: 'Página no encontrada · MailForge',
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-hierro px-4 text-center text-papel">
      <p className="font-mono text-xs tracking-[0.25em] text-ceniza uppercase">Error 404</p>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Esta página se enfrió</h1>
      <p className="mt-3 max-w-sm text-sm text-ceniza">
        No encontramos lo que buscas. Puede que la URL esté mal escrita o que el módulo todavía no
        exista.
      </p>
      <a
        href={APP_ROUTES.home}
        className="mt-8 rounded-md bg-brasa px-4 py-2 font-mono text-sm font-semibold tracking-wider text-hierro uppercase transition-colors hover:bg-calor focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brasa"
      >
        Volver al taller
      </a>
    </main>
  );
}
