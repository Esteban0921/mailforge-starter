'use client';

import { useState } from 'react';

/**
 * Shared submit plumbing for the auth forms: busy state, preventDefault,
 * FormData collection. Error-to-field mapping stays in each form — login
 * and register attribute errors differently (see login-form.tsx for why).
 */
export function useAuthSubmit(onSubmit: (data: FormData) => Promise<void>) {
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setBusy(true);
    await onSubmit(new FormData(event.currentTarget));
    setBusy(false);
  }

  return { busy, handleSubmit };
}
