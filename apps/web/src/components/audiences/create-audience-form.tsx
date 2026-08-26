'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/form-field';
import { useToast } from '@/components/ui/toast';
import { getAudienceStore } from '@/lib/audiences';
import { useAuthSubmit } from '@/lib/auth/use-auth-submit';

export function CreateAudienceForm({ onCreated }: { onCreated: () => void }) {
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  const { busy, handleSubmit } = useAuthSubmit(async (data) => {
    setError(null);
    const name = String(data.get('name') ?? '');
    const description = String(data.get('description') ?? '');
    const result = await getAudienceStore().createAudience({ name, description });
    if (result.ok) {
      toast(`Audiencia "${result.value.name}" creada.`);
      onCreated();
    } else {
      setError('Ponle un nombre a la audiencia.');
    }
  });

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="flex-1">
        <FormField label="Nombre" name="name" type="text" required error={error ?? undefined} />
      </div>
      <div className="flex-1">
        <FormField label="Descripción (opcional)" name="description" type="text" />
      </div>
      <Button type="submit" busy={busy}>
        {busy ? 'Creando…' : 'Nueva audiencia'}
      </Button>
    </form>
  );
}
