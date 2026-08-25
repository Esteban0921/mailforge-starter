'use client';

import { useRef, useState } from 'react';
import type { AuthError } from '@mailforge/shared';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/form-field';
import { useToast } from '@/components/ui/toast';
import { getAuthStore } from '@/lib/auth';
import { useAuthSubmit } from '@/lib/auth/use-auth-submit';

const ERROR_MESSAGES: Partial<Record<AuthError, string>> = {
  invalid_credentials: 'La contraseña actual no es correcta.',
  weak_password: 'La contraseña nueva debe tener al menos 8 caracteres.',
};

export function PasswordForm() {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [fieldErrors, setFieldErrors] = useState<{ current?: string; next?: string }>({});

  const { busy, handleSubmit } = useAuthSubmit(async (data) => {
    setFieldErrors({});
    const currentPassword = String(data.get('current') ?? '');
    const newPassword = String(data.get('next') ?? '');
    const result = await getAuthStore().updatePassword(currentPassword, newPassword);
    if (result.ok) {
      toast('Contraseña actualizada.');
      formRef.current?.reset();
      return;
    }
    if (result.error === 'invalid_credentials') {
      setFieldErrors({ current: ERROR_MESSAGES.invalid_credentials });
    } else if (result.error === 'weak_password') {
      setFieldErrors({ next: ERROR_MESSAGES.weak_password });
    }
  });

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormField
        label="Contraseña actual"
        name="current"
        type="password"
        autoComplete="current-password"
        required
        error={fieldErrors.current}
      />
      <FormField
        label="Contraseña nueva"
        name="next"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        error={fieldErrors.next}
      />
      <Button type="submit" busy={busy} className="self-start">
        {busy ? 'Actualizando…' : 'Cambiar contraseña'}
      </Button>
    </form>
  );
}
