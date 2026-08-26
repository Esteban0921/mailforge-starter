'use client';

import { useEffect, useRef, useState } from 'react';
import { Building2, Check, ChevronsUpDown } from 'lucide-react';
import type { OrganizationMembership } from '@mailforge/shared';
import {
  getCurrentOrganizationId,
  listOrganizations,
  setCurrentOrganizationId,
} from '@/lib/organizations';
import { cn } from '@/lib/utils';

/**
 * Picks which of the signed-in user's organizations is "current". Purely a
 * local preference today — nothing else reads it yet (see lib/organizations/
 * current.ts) — but the switcher itself needs to be real for TASK-0021.
 * Every real user has at least one org (register() provisions one), so an
 * empty list only ever happens if the API is unreachable — same rendering
 * path as `loadFailed`, deliberately not distinguished further.
 */
export function OrganizationSwitcher() {
  const [memberships, setMemberships] = useState<OrganizationMembership[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    listOrganizations().then((result) => {
      if (cancelled) return;
      if (result === null || result.length === 0) {
        setLoadFailed(true);
        return;
      }
      const stored = getCurrentOrganizationId();
      const initial =
        stored && result.some((m) => m.organization.id === stored)
          ? stored
          : result[0].organization.id;
      setCurrentOrganizationId(initial);
      setMemberships(result);
      setCurrentId(initial);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function selectOrganization(id: string): void {
    setCurrentOrganizationId(id);
    setCurrentId(id);
    setOpen(false);
  }

  if (loadFailed) {
    return null;
  }

  if (memberships === null) {
    return (
      <div className="flex items-center gap-2 px-2 py-2 text-sm text-muted-foreground">
        <Building2 className="size-4" aria-hidden="true" />
        Cargando…
      </div>
    );
  }

  const current = memberships.find((m) => m.organization.id === currentId) ?? memberships[0];

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="listbox"
        data-testid="organization-switcher-trigger"
        className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span className="flex size-6 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
          <Building2 className="size-3.5" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1 truncate">{current.organization.name}</span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </button>

      {open ? (
        <ul
          role="listbox"
          data-testid="organization-switcher-list"
          className="absolute inset-x-0 top-full z-10 mt-1 max-h-64 overflow-auto rounded-md border border-border bg-card py-1 shadow-lg"
        >
          {memberships.map((m) => (
            <li key={m.organization.id}>
              <button
                type="button"
                role="option"
                aria-selected={m.organization.id === current.organization.id}
                onClick={() => selectOrganization(m.organization.id)}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-accent',
                  m.organization.id === current.organization.id
                    ? 'text-foreground'
                    : 'text-muted-foreground',
                )}
              >
                <span className="min-w-0 flex-1 truncate">{m.organization.name}</span>
                {m.organization.id === current.organization.id ? (
                  <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
