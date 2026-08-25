import { APP_ROUTES } from '@mailforge/shared';
import { Wordmark } from '@/components/wordmark';
import { LinkButton } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const pillars = [
  {
    title: 'Multi-tenant',
    body: 'Cada organización gestiona sus audiencias, campañas y datos de forma aislada.',
  },
  {
    title: 'Automatizaciones',
    body: 'Bienvenida, reenganche o carrito abandonado: flujos que se configuran en minutos.',
  },
  {
    title: 'Self-hosted',
    body: 'Tu servidor, tus reglas. Código abierto, sin cuotas por contacto ni lock-in.',
  },
];

const systemStatus = [
  { name: 'api', state: 'operativo' },
  { name: 'web', state: 'operativo' },
  { name: 'postgres', state: 'fase 1' },
  { name: 'redis', state: 'fase 1' },
] as const;

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border px-6 py-4 sm:px-10">
        <Wordmark />
        <nav className="flex items-center gap-6">
          <a
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline"
            href="https://github.com/Esteban0921/mailforge-starter"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <a
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline"
            href="https://github.com/Esteban0921/mailforge-starter/tree/main/docs"
            target="_blank"
            rel="noreferrer"
          >
            Docs
          </a>
          <a
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            href={APP_ROUTES.login}
          >
            Entrar
          </a>
          <LinkButton href={APP_ROUTES.register} size="sm" className="px-3.5">
            Crear cuenta
          </LinkButton>
        </nav>
      </header>

      <section className="mx-auto w-full max-w-5xl flex-1 px-6 pt-20 pb-16 sm:px-10 sm:pt-28">
        <Badge variant="muted" className="font-medium">
          Fase 1 · Autenticación y organizaciones
        </Badge>

        <h1
          data-testid="hero-title"
          className="mt-6 max-w-2xl text-5xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl"
        >
          El email marketing que no depende de un tercero.
        </h1>

        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Audiencias, campañas y automatizaciones multi-tenant. Código abierto, alojado en tu propio
          servidor — sin cuotas por contacto ni límites artificiales.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <LinkButton href={APP_ROUTES.register} size="lg">
            Crear cuenta
          </LinkButton>
          <LinkButton
            href="https://github.com/Esteban0921/mailforge-starter"
            target="_blank"
            rel="noreferrer"
            size="lg"
            variant="outline"
          >
            Ver en GitHub
          </LinkButton>
        </div>

        {/* Signature element: an honest readout of the monorepo's real state. */}
        <aside className="mt-16 w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Estado del sistema
          </p>
          <ul className="mt-3 flex flex-col gap-2.5 text-sm">
            {systemStatus.map(({ name, state }) => {
              const active = state === 'operativo';
              return (
                <li key={name} className="flex items-center justify-between">
                  <span className="text-foreground">{name}</span>
                  <span
                    className={
                      active
                        ? 'flex items-center gap-1.5 text-foreground before:size-1.5 before:rounded-full before:bg-emerald-500'
                        : 'flex items-center gap-1.5 text-muted-foreground before:size-1.5 before:rounded-full before:border before:border-muted-foreground'
                    }
                  >
                    {state}
                  </span>
                </li>
              );
            })}
          </ul>
        </aside>

        <ul className="mt-16 grid gap-8 sm:grid-cols-3 sm:gap-6">
          {pillars.map((pillar) => (
            <li key={pillar.title} className="border-t border-border pt-5">
              <h2 className="text-sm font-semibold text-foreground">{pillar.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pillar.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <footer className="border-t border-border px-6 py-5 sm:px-10">
        <p className="text-sm text-muted-foreground">
          Desarrollado por Esteban y Joseph · código abierto · licencia MIT
        </p>
      </footer>
    </main>
  );
}
