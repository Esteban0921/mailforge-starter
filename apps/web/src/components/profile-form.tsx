'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/form-field';
import { useToast } from '@/components/ui/toast';
import { getAuthStore } from '@/lib/auth';
import { useAuthSubmit } from '@/lib/auth/use-auth-submit';

export function ProfileForm({ initialName }: { initialName: string }) {
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  const { busy, handleSubmit } = useAuthSubmit(async (data) => {
    setError(null);
    const name = String(data.get('name') ?? '');
    const result = await getAuthStore().updateProfile(name);
    if (result.ok) {
      toast('Perfil actualizado.');
    } else {
      setError('El nombre no puede estar vacío.');
    }
  });

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormField
        label="Nombre"
        name="name"
        type="text"
        autoComplete="name"
        required
        defaultValue={initialName}
        error={error ?? undefined}
      />
      <Button type="submit" busy={busy} className="self-start">
        {busy ? 'Guardando…' : 'Guardar cambios'}
      </Button>
    </form>
  );
}
