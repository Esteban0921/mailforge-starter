'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, LogOut, Megaphone, Menu, Users, X, Zap } from 'lucide-react';
import { APP_ROUTES } from '@mailforge/shared';
import { getAuthStore, SESSION_CHANGE_EVENT } from '@/lib/auth';
import { Wordmark } from '@/components/wordmark';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: APP_ROUTES.dashboard, label: 'Panel', icon: LayoutDashboard, enabled: true },
  { href: APP_ROUTES.dashboard, label: 'Audiencias', icon: Users, enabled: false },
  { href: APP_ROUTES.dashboard, label: 'Campañas', icon: Megaphone, enabled: false },
  { href: APP_ROUTES.dashboard, label: 'Automatizaciones', icon: Zap, enabled: false },
] as const;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<'checking' | 'ok'>('checking');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const session = getAuthStore().getSession();
    if (session === null) {
      router.replace(APP_ROUTES.login);
      return;
    }
    setStatus('ok');
  }, [router]);

  // Escape closes the mobile drawer; irrelevant on desktop where it's always open.
  useEffect(() => {
    if (!mobileNavOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMobileNavOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mobileNavOpen]);

  if (status === 'checking') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <p className="text-sm">Cargando…</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40 md:flex">
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
        <Wordmark href={APP_ROUTES.home} />
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Abrir navegación"
          aria-expanded={mobileNavOpen}
          aria-controls="dashboard-sidebar"
          className="rounded-md p-2 text-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
      </header>

      {mobileNavOpen ? (
        <div
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
          data-testid="mobile-nav-backdrop"
          // left-72 matches the drawer's own w-72: the backdrop only covers
          // what's actually visible behind it. Spanning the full viewport
          // (inset-0) put its hit-region partly *under* the higher z-index
          // drawer, where clicks silently never reach it.
          className="fixed inset-y-0 right-0 left-72 z-40 bg-foreground/20 md:hidden"
        />
      ) : null}

      <aside
        id="dashboard-sidebar"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-card px-4 py-6 transition-transform duration-200 ease-out',
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full',
          'md:static md:z-auto md:w-60 md:translate-x-0 md:transition-none',
        )}
      >
        <div className="flex items-center justify-between">
          <Wordmark href={APP_ROUTES.home} className="hidden md:flex" />
          <span className="font-medium text-foreground md:hidden">Menú</span>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Cerrar navegación"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:hidden"
          >
            <X className="size-4.5" aria-hidden="true" />
          </button>
        </div>
        <nav className="mt-8 flex flex-col gap-1" data-testid="dashboard-nav">
          {NAV_ITEMS.map((item) =>
            item.enabled ? (
              <a
                key={item.label}
                href={item.href}
                data-testid={`nav-${item.label}`}
                aria-current={pathname === item.href ? 'page' : undefined}
                onClick={() => setMobileNavOpen(false)}
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
  const { toast } = useToast();
  const [user, setUser] = useState<{ email: string; name: string | null } | null>(null);

  useEffect(() => {
    function syncSession() {
      setUser(getAuthStore().getSession()?.user ?? null);
    }
    syncSession();
    window.addEventListener(SESSION_CHANGE_EVENT, syncSession);
    return () => window.removeEventListener(SESSION_CHANGE_EVENT, syncSession);
  }, []);

  async function handleLogout() {
    await getAuthStore().logout();
    toast('Sesión cerrada.');
    router.replace(APP_ROUTES.login);
  }

  if (user === null) return null;

  return (
    <div className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
      <a
        href={APP_ROUTES.profile}
        className="truncate rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        data-testid="dashboard-user"
      >
        {user.name ?? user.email}
      </a>
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
