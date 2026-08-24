'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { AuthError } from '@mailforge/shared';
import { AuthButton, AuthField, FormError } from '@/components/auth-field';
import { getAuthStore } from '@/lib/auth';

const ERROR_MESSAGES: Record<AuthError, string> = {
  invalid_credentials: 'Email o contraseña incorrectos.',
  email_already_registered: 'Ese email ya tiene cuenta. Prueba a entrar.',
  weak_password: `La contraseña debe tener al menos 8 caracteres.`,
  invalid_input: 'Revisa los campos del formulario.',
};

export function LoginForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setFormError(null);

    const data = new FormData(event.currentTarget);
    const result = await getAuthStore().login({
      email: String(data.get('email') ?? ''),
      password: String(data.get('password') ?? ''),
    });

    setBusy(false);
    if (result.ok) {
      router.push('/dashboard');
    } else {
      setFormError(ERROR_MESSAGES[result.error]);
    }
  }

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
        <a href="/register" className="text-brasa hover:text-calor">
          Crea una
        </a>
      </p>
    </form>
  );
}
