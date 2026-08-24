import { APP_ROUTES } from '@mailforge/shared';

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brasa rounded-sm';

/** Brand mark. Pass `href` to make it a link back home (sidebar); omit it for a static header (landing). */
export function Wordmark({ href, className = '' }: { href?: string; className?: string }) {
  const classes = `font-mono text-sm tracking-widest ${focusRing} ${className}`;
  if (!href) {
    return <span className={classes}>⬥ MAILFORGE</span>;
  }
  return (
    <a href={href} className={`${classes} transition-colors hover:text-brasa`}>
      ⬥ MAILFORGE
    </a>
  );
}

/** Compact "back home" link used above the auth forms. */
export function BackToHome({ className = '' }: { className?: string }) {
  return (
    <a
      href={APP_ROUTES.home}
      className={`font-mono text-xs tracking-[0.25em] text-ceniza transition-colors hover:text-brasa ${focusRing} ${className}`}
    >
      ← MAILFORGE
    </a>
  );
}
