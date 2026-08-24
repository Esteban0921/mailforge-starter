import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard · MailForge',
};

const MODULES = ['Audiencias', 'Campañas', 'Automatizaciones', 'Tracking'] as const;

export default function DashboardPage() {
  return (
    <section>
      <h1 data-testid="dashboard-title" className="text-2xl font-extrabold tracking-tight">
        Hola de nuevo
      </h1>
      <p className="mt-2 text-sm text-ceniza">
        Tu taller está listo. Las audiencias y campañas llegan en las próximas fases.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {MODULES.map((name) => (
          <div
            key={name}
            data-testid={`module-card-${name}`}
            className="rounded-lg border border-hierro-2 bg-hierro-2/40 p-5"
          >
            <p className="font-mono text-xs tracking-[0.2em] text-brasa uppercase">{name}</p>
            <p className="mt-2 text-sm text-ceniza">Módulo en forja — próxima fase.</p>
          </div>
        ))}
      </div>
    </section>
  );
}
