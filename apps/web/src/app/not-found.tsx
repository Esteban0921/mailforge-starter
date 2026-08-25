import type { Metadata } from 'next';
import { APP_ROUTES } from '@mailforge/shared';
import { LinkButton } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Página no encontrada · MailForge',
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <p className="text-sm font-medium text-muted-foreground">Error 404</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
        No encontramos esta página
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Puede que la URL esté mal escrita o que la página todavía no exista.
      </p>
      <LinkButton href={APP_ROUTES.home} className="mt-6">
        Volver al inicio
      </LinkButton>
    </main>
  );
}
