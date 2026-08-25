import { Mail } from 'lucide-react';
import { APP_ROUTES } from '@mailforge/shared';
import { cn } from '@/lib/utils';

const focusRing =
  'rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

function Mark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground',
        className,
      )}
    >
      <Mail className="size-4" aria-hidden="true" />
    </span>
  );
}

/** Brand mark. Pass `href` to make it a link back home (sidebar); omit it for a static header (landing). */
export function Wordmark({ href, className = '' }: { href?: string; className?: string }) {
  const inner = (
    <>
      <Mark />
      <span className="text-[15px] font-semibold tracking-tight text-foreground">MailForge</span>
    </>
  );
  if (!href) {
    return <span className={cn('flex items-center gap-2', className)}>{inner}</span>;
  }
  return (
    <a href={href} className={cn('flex items-center gap-2', focusRing, className)}>
      {inner}
    </a>
  );
}

/** Compact "back home" link used above the auth forms. */
export function BackToHome({ className = '' }: { className?: string }) {
  return (
    <a
      href={APP_ROUTES.home}
      className={cn(
        'flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground',
        focusRing,
        className,
      )}
    >
      <Mark className="size-6" />
      MailForge
    </a>
  );
}
