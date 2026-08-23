'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getAuthStore } from '@/lib/auth';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', enabled: true },
  { href: '/dashboard', label: 'Audiencias', enabled: false },
  { href: '/dashboard', label: 'Campañas', enabled: false },
  { href: '/dashboard', label: 'Automatizaciones', enabled: false },
] as const;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<'checking' | 'ok'>('checking');

  useEffect(() => {
    const session = getAuthStore().getSession();
    if (session === null) {
      router.replace('/login');
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
    <div className="flex min-h-screen bg-hierro text-papel">
      <aside className="flex w-56 flex-col border-r border-hierro-2 px-4 py-6">
        <a href="/" className="font-mono text-sm tracking-widest">
          ⬥ MAILFORGE
        </a>
        <nav className="mt-8 flex flex-col gap-1" data-testid="dashboard-nav">
          {NAV_ITEMS.map((item) =>
            item.enabled ? (
              <a
                key={item.label}
                href={item.href}
                className="rounded-md px-3 py-2 font-mono text-xs tracking-wider text-papel hover:bg-hierro-2"
              >
                {item.label}
              </a>
            ) : (
              <span
                key={item.label}
                className="cursor-not-allowed rounded-md px-3 py-2 font-mono text-xs tracking-wider text-ceniza/50"
                title="Disponible en próximas fases"
              >
                {item.label}
              </span>
            ),
          )}
        </nav>
        <UserFooter />
      </aside>
      <div className="flex-1 px-8 py-8">{children}</div>
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
    router.replace('/login');
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
        className="rounded-md px-3 py-2 text-left font-mono text-xs tracking-wider text-ceniza hover:bg-hierro-2 hover:text-brasa"
      >
        Cerrar sesión
      </button>
    </div>
  );
}
