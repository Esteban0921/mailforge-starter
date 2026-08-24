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
  invalid_input: 'Revisa los campos: nombre, email válido y contraseña de 8+ caracteres.',
};

export function RegisterForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  // Unlike login, register can safely point errors at the field that
  // actually caused them: "this email is taken" or "password too short"
  // don't leak anything an attacker doesn't already know from the form.
  const { busy, handleSubmit } = useAuthSubmit(async (data) => {
    setFormError(null);
    setFieldErrors({});
    const result = await getAuthStore().register({
      name: String(data.get('name') ?? ''),
      email: String(data.get('email') ?? ''),
      password: String(data.get('password') ?? ''),
    });
    if (result.ok) {
      router.push(APP_ROUTES.dashboard);
      return;
    }
    if (result.error === 'email_already_registered') {
      setFieldErrors({ email: ERROR_MESSAGES.email_already_registered });
    } else if (result.error === 'weak_password') {
      setFieldErrors({ password: ERROR_MESSAGES.weak_password });
    } else {
      setFormError(ERROR_MESSAGES[result.error]);
    }
  });

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormError message={formError} />
      <AuthField label="Nombre" name="name" type="text" autoComplete="name" required />
      <AuthField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        error={fieldErrors.email}
      />
      <AuthField
        label="Contraseña"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        error={fieldErrors.password}
      />
      <AuthButton busy={busy}>Crear cuenta</AuthButton>
      <p className="mt-2 text-center text-xs text-ceniza">
        ¿Ya tienes cuenta?{' '}
        <a href={APP_ROUTES.login} className="text-brasa hover:text-calor">
          Entra
        </a>
      </p>
    </form>
  );
}
