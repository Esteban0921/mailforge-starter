/**
 * Which organization the switcher last selected. Purely a UI preference for
 * now — no other feature reads it yet (audiences etc. still run on their own
 * mock, unscoped by organization; see TASK-0022/0023). Kept simple on
 * purpose: no change event, since nothing but the switcher itself needs to
 * react when this changes.
 */
const CURRENT_ORGANIZATION_KEY = 'mailforge.current-organization-id';

export function getCurrentOrganizationId(): string | null {
  return globalThis.localStorage.getItem(CURRENT_ORGANIZATION_KEY);
}

export function setCurrentOrganizationId(id: string): void {
  globalThis.localStorage.setItem(CURRENT_ORGANIZATION_KEY, id);
}
