'use client';

import { useId, type ComponentPropsWithoutRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function FormField({
  label,
  error,
  ...inputProps
}: { label: string; error?: string } & ComponentPropsWithoutRef<'input'>) {
  const id = useId();
  const errorId = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...inputProps}
      />
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
