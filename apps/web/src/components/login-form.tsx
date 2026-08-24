'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { APP_ROUTES, type AuthError } from '@mailforge/shared';
import { AuthButton, AuthField, FormError } from '@/components/auth-field';
import { getAuthStore } from '@/lib/auth';
import { useAuthSubmit } from '@/lib/auth/use-auth-submit';

const ERROR_MESSAGES: Record<AuthError, string> = {
  invalid_credentials: 'Email o contraseña incorrectos.',
  email_already_registered: 'Ese email ya tiene cuenta. Prueba a entrar.',
  weak_password: 'La contraseña debe tener al menos 8 caracteres.',
  invalid_input: 'Revisa los campos del formulario.',
};

export function LoginForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  // Deliberately form-level, never attributed to a field: telling an
  // attacker "email" vs "password" was wrong is exactly what login must
  // not leak (see store.spec.ts: "rejects wrong passwords without leaking
  // which field failed").
  const { busy, handleSubmit } = useAuthSubmit(async (data) => {
    setFormError(null);
    const result = await getAuthStore().login({
      email: String(data.get('email') ?? ''),
      password: String(data.get('password') ?? ''),
    });
    if (result.ok) {
      router.push(APP_ROUTES.dashboard);
    } else {
      setFormError(ERROR_MESSAGES[result.error]);
    }
  });

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={formError} />
      <AuthField label="Email" name="email" type="email" autoComplete="email" required />
      <AuthField
        label="Contraseña"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      <AuthButton busy={busy}>Entrar</AuthButton>
      <p className="mt-2 text-center text-xs text-ceniza">
        ¿Sin cuenta?{' '}
        <a href={APP_ROUTES.register} className="text-brasa hover:text-calor">
          Crea una
        </a>
      </p>
    </form>
  );
}
