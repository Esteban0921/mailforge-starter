'use client';

import { useEffect, useState } from 'react';
import { APP_ROUTES, type SessionUser } from '@mailforge/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PasswordForm } from '@/components/password-form';
import { ProfileForm } from '@/components/profile-form';
import { getAuthStore } from '@/lib/auth';

/**
 * Client-only: the layout above already guarantees a session exists before
 * rendering children, but session data itself only lives in localStorage.
 */
export function ProfileContent() {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    setUser(getAuthStore().getSession()?.user ?? null);
  }, []);

  if (user === null) return null;

  return (
    <section className="max-w-lg">
      <a
        href={APP_ROUTES.dashboard}
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Volver al panel
      </a>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">Tu perfil</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Gestiona tu nombre y tu contraseña de acceso.
      </p>

      <div className="mt-8 flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Datos personales</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm initialName={user.name ?? ''} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contraseña</CardTitle>
            <CardDescription>Elige una contraseña de al menos 8 caracteres.</CardDescription>
          </CardHeader>
          <CardContent>
            <PasswordForm />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
