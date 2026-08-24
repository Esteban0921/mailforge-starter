'use client';

import { useId, type ComponentPropsWithoutRef, type ReactNode } from 'react';

/**
 * Shared forge-styled primitives for the auth forms.
 * Errors render in brasa; focus states are always visible.
 */

// No focus:outline-none here: in this Tailwind v4 build, :focus and
// :focus-visible utilities have equal specificity and :focus-visible does
// NOT reliably win the cascade, so pairing them silently cancels the ring.
// Text inputs match :focus-visible on click too, so this alone is enough.
const inputClasses =
  'w-full rounded-md border border-hierro-2 bg-hierro px-3 py-2 text-sm text-papel ' +
  'placeholder:text-ceniza/60 transition-colors focus:border-brasa ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brasa';

export function AuthField({
  label,
  error,
  ...inputProps
}: { label: string; error?: string } & ComponentPropsWithoutRef<'input'>) {
  const errorId = useId();
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-xs tracking-[0.15em] text-ceniza uppercase">{label}</span>
      <input
        className={inputClasses}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...inputProps}
      />
      {error ? (
        <span id={errorId} role="alert" className="text-xs text-brasa">
          {error}
        </span>
      ) : null}
    </label>
  );
}

export function AuthButton({ children, busy }: { children: ReactNode; busy?: boolean }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="mt-2 w-full rounded-md bg-brasa px-3 py-2 font-mono text-sm font-semibold tracking-wider text-hierro uppercase transition-colors hover:bg-calor focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brasa disabled:cursor-not-allowed disabled:opacity-60"
    >
      {busy ? 'Forjando…' : children}
    </button>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-md border border-brasa/40 bg-brasa/10 px-3 py-2 text-sm text-brasa"
    >
      {message}
    </p>
  );
}
