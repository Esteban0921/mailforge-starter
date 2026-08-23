const pillars = [
  {
    title: 'Multi-tenant',
    body: 'Cada organización gestiona sus audiencias, campañas y datos de forma aislada desde el primer commit.',
  },
  {
    title: 'Automatizaciones B2C',
    body: 'Bienvenida, re-engagement o carrito abandonado: flujos simples que se montan en minutos.',
  },
  {
    title: 'Self-hosted',
    body: 'Tu servidor, tus reglas. Código abierto sin dependencias de SaaS de pago ni lock-in.',
  },
];

const workshopStatus = [
  { name: 'api', state: 'operativo' },
  { name: 'web', state: 'operativo' },
  { name: 'postgres', state: 'fase 1' },
  { name: 'redis', state: 'fase 1' },
] as const;

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col bg-hierro font-display text-papel">
      <header className="flex items-center justify-between border-b border-hierro-2 px-6 py-4 sm:px-10">
        <span className="font-mono text-sm tracking-widest">⬥ MAILFORGE</span>
        <nav className="flex gap-6 font-mono text-xs tracking-wider text-ceniza">
          <a
            className="transition-colors hover:text-brasa focus-visible:text-brasa focus-visible:outline-none"
            href="/login"
          >
            ENTRAR
          </a>
          <a
            className="transition-colors hover:text-brasa focus-visible:text-brasa focus-visible:outline-none"
            href="https://github.com/Esteban0921/mailforge-starter"
            target="_blank"
            rel="noreferrer"
          >
            GITHUB
          </a>
          <a
            className="transition-colors hover:text-brasa focus-visible:text-brasa focus-visible:outline-none"
            href="https://github.com/Esteban0921/mailforge-starter/tree/main/docs"
            target="_blank"
            rel="noreferrer"
          >
            DOCS
          </a>
        </nav>
      </header>

      <section className="mx-auto w-full max-w-5xl flex-1 px-6 pt-20 pb-16 sm:px-10 sm:pt-28">
        <p className="font-mono text-xs tracking-[0.25em] text-ceniza">
          FASE 0 · FUNDACIÓN OPERATIVA
        </p>

        <h1
          data-testid="hero-title"
          className="mt-8 max-w-3xl text-6xl leading-[0.95] font-extrabold tracking-tight sm:text-8xl"
        >
          Hello{' '}
          <span className="inline-block">
            MailForge
            <span aria-hidden="true" className="heat-bar mt-3 block h-[6px] w-full rounded-full" />
          </span>
        </h1>

        <p className="mt-10 max-w-xl text-lg text-ceniza">
          Email marketing multi-tenant para equipos que quieren sus datos en casa. Audiencias,
          campañas y automatizaciones B2C, construidos a fuego lento y servidos desde tu propio
          servidor.
        </p>

        {/* Signature element: an honest readout of the monorepo's real state. */}
        <aside className="mt-14 w-full max-w-md border border-hierro-2 bg-hierro-2/40 p-6 font-mono text-sm">
          <p className="tracking-[0.2em] text-ceniza uppercase">estado del taller</p>
          <ul className="mt-3 flex flex-col gap-2">
            {workshopStatus.map(({ name, state }) => {
              const active = state === 'operativo';
              return (
                <li key={name} className="flex items-center justify-between">
                  <span>{name}</span>
                  <span
                    className={
                      active
                        ? 'text-papel before:mr-2 before:inline-block before:h-2 before:w-2 before:rounded-full before:bg-papel'
                        : 'text-ceniza before:mr-2 before:inline-block before:h-2 before:w-2 before:rounded-full before:border before:border-ceniza'
                    }
                  >
                    {state}
                  </span>
                </li>
              );
            })}
          </ul>
        </aside>

        <ul className="mt-16 grid gap-10 sm:grid-cols-3 sm:gap-6">
          {pillars.map((pillar) => (
            <li key={pillar.title} className="border-t border-hierro-2 pt-5">
              <h2 className="font-mono text-xs tracking-[0.2em] text-brasa uppercase">
                {pillar.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ceniza">{pillar.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <footer className="border-t border-hierro-2 px-6 py-5 sm:px-10">
        <p className="font-mono text-xs tracking-wider text-ceniza">
          forjado por Esteban y Joseph · código abierto · licencia MIT
        </p>
      </footer>
    </main>
  );
}
