'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, LogOut, Megaphone, Users, Zap } from 'lucide-react';
import { APP_ROUTES } from '@mailforge/shared';
import { getAuthStore } from '@/lib/auth';
import { Wordmark } from '@/components/wordmark';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: APP_ROUTES.dashboard, label: 'Dashboard', icon: LayoutDashboard, enabled: true },
  { href: APP_ROUTES.dashboard, label: 'Audiencias', icon: Users, enabled: false },
  { href: APP_ROUTES.dashboard, label: 'Campañas', icon: Megaphone, enabled: false },
  { href: APP_ROUTES.dashboard, label: 'Automatizaciones', icon: Zap, enabled: false },
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
      <main className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <p className="text-sm">Cargando…</p>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/40 md:flex-row">
      <aside className="flex w-full flex-col border-b border-border bg-card px-4 py-6 md:w-60 md:border-r md:border-b-0">
        <Wordmark href={APP_ROUTES.home} />
        <nav className="mt-8 flex flex-col gap-1" data-testid="dashboard-nav">
          {NAV_ITEMS.map((item) =>
            item.enabled ? (
              <a
                key={item.label}
                href={item.href}
                data-testid={`nav-${item.label}`}
                aria-current={pathname === item.href ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent',
                  pathname === item.href
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <item.icon className="size-4" aria-hidden="true" />
                {item.label}
              </a>
            ) : (
              <span
                key={item.label}
                data-testid={`nav-${item.label}`}
                aria-disabled="true"
                title="Disponible próximamente"
                className="flex cursor-not-allowed items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground/60"
              >
                <item.icon className="size-4" aria-hidden="true" />
                {item.label}
                <span className="sr-only"> (disponible próximamente)</span>
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
    <div className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
      <p className="truncate px-3 text-sm text-muted-foreground" data-testid="dashboard-user">
        {user.name ?? user.email}
      </p>
      <button
        type="button"
        onClick={handleLogout}
        data-testid="logout-button"
        className="flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <LogOut className="size-4" aria-hidden="true" />
        Cerrar sesión
      </button>
    </div>
  );
}
