'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/form-field';
import { useToast } from '@/components/ui/toast';
import { getAudienceStore, type AddSubscriberError } from '@/lib/audiences';
import { useAuthSubmit } from '@/lib/auth/use-auth-submit';

const ERROR_MESSAGES: Record<AddSubscriberError, string> = {
  invalid_input: 'Revisa los campos del formulario.',
  invalid_email: 'Ese email no tiene un formato válido.',
  duplicate_email: 'Ya hay un suscriptor con ese email en esta audiencia.',
};

export function AddSubscriberForm({
  audienceId,
  onAdded,
}: {
  audienceId: string;
  onAdded: () => void;
}) {
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  const { busy, handleSubmit } = useAuthSubmit(async (data) => {
    setError(null);
    const result = await getAudienceStore().addSubscriber(audienceId, {
      email: String(data.get('email') ?? ''),
      firstName: String(data.get('firstName') ?? ''),
      lastName: String(data.get('lastName') ?? ''),
    });
    if (result.ok) {
      toast(`${result.value.email} añadido.`);
      onAdded();
    } else {
      setError(ERROR_MESSAGES[result.error]);
    }
  });

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="flex-1">
        <FormField label="Email" name="email" type="email" required error={error ?? undefined} />
      </div>
      <div className="flex-1">
        <FormField label="Nombre" name="firstName" type="text" />
      </div>
      <div className="flex-1">
        <FormField label="Apellido" name="lastName" type="text" />
      </div>
      <Button type="submit" busy={busy}>
        {busy ? 'Añadiendo…' : 'Añadir suscriptor'}
      </Button>
    </form>
  );
}
