'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { APP_ROUTES } from '@mailforge/shared';
import { getAuthStore } from '@/lib/auth';
import { Wordmark } from '@/components/wordmark';

const NAV_ITEMS = [
  { href: APP_ROUTES.dashboard, label: 'Dashboard', enabled: true },
  { href: APP_ROUTES.dashboard, label: 'Audiencias', enabled: false },
  { href: APP_ROUTES.dashboard, label: 'Campañas', enabled: false },
  { href: APP_ROUTES.dashboard, label: 'Automatizaciones', enabled: false },
] as const;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<'checking' | 'ok'>('checking');

  useEffect(() => {
    const session = getAuthStore().getSession();
    if (session === null) {
      router.replace(APP_ROUTES.login);
      return;
    }
    setStatus('ok');
  }, [router]);

  if (status === 'checking') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-hierro text-ceniza">
        <p className="font-mono text-xs tracking-[0.25em] uppercase">Abriendo el taller…</p>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-hierro text-papel md:flex-row">
      <aside className="flex w-full flex-col border-b border-hierro-2 px-4 py-6 md:w-56 md:border-r md:border-b-0">
        <Wordmark href={APP_ROUTES.home} />
        <nav className="mt-8 flex flex-col gap-1" data-testid="dashboard-nav">
          {NAV_ITEMS.map((item) =>
            item.enabled ? (
              <a
                key={item.label}
                href={item.href}
                data-testid={`nav-${item.label}`}
                aria-current={pathname === item.href ? 'page' : undefined}
                className={`rounded-md px-3 py-2 font-mono text-xs tracking-wider transition-colors hover:bg-hierro-2 ${
                  pathname === item.href ? 'bg-hierro-2 text-brasa' : 'text-papel'
                }`}
              >
                {item.label}
              </a>
            ) : (
              <span
                key={item.label}
                data-testid={`nav-${item.label}`}
                aria-disabled="true"
                className="cursor-not-allowed rounded-md px-3 py-2 font-mono text-xs tracking-wider text-ceniza/70"
                title="Disponible en próximas fases"
              >
                {item.label}
                <span className="sr-only"> (disponible en próximas fases)</span>
              </span>
            ),
          )}
        </nav>
        <UserFooter />
      </aside>
      <div className="flex-1 px-4 py-8 sm:px-8">{children}</div>
    </div>
  );
}

function UserFooter() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; name: string | null } | null>(null);

  useEffect(() => {
    const session = getAuthStore().getSession();
    setUser(session?.user ?? null);
  }, []);

  async function handleLogout() {
    await getAuthStore().logout();
    router.replace(APP_ROUTES.login);
  }

  if (user === null) return null;

  return (
    <div className="mt-auto flex flex-col gap-2 border-t border-hierro-2 pt-4">
      <p className="truncate font-mono text-xs text-ceniza" data-testid="dashboard-user">
        {user.name ?? user.email}
      </p>
      <button
        type="button"
        onClick={handleLogout}
        data-testid="logout-button"
        className="rounded-md px-3 py-2 text-left font-mono text-xs tracking-wider text-ceniza transition-colors hover:bg-hierro-2 hover:text-brasa focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brasa"
      >
        Cerrar sesión
      </button>
    </div>
  );
}
