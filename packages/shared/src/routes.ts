/**
 * Single source of truth for route contracts.
 * The API exposes these paths; the Web app navigates to them.
 * Keep both sides importing from here instead of hardcoding strings.
 */
export const API_ROUTES = {
  health: '/health',
} as const;

/**
 * Frontend routes. `login`, `register` and `dashboard` are Phase 1 targets —
 * declared now so both apps agree on the contract before implementation.
 */
export const APP_ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  profile: '/dashboard/profile',
  audiences: '/dashboard/audiences',
} as const;

/** `/dashboard/audiences/:id` — not in APP_ROUTES since it needs an id. */
export function audienceDetailRoute(audienceId: string): string {
  return `${APP_ROUTES.audiences}/${audienceId}`;
}

export type AppRoute = (typeof APP_ROUTES)[keyof typeof APP_ROUTES];
