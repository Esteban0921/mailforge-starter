/** Port the HTTP server binds to. Mirrors API_PORT in .env.example. */
export const DEFAULT_API_PORT = 3001;

/**
 * Reads the API port from the environment, falling back to the documented
 * default. An invalid value is treated as absent rather than crashing boot,
 * but is logged so a typo'd .env doesn't fail silently.
 */
export function readApiPort(env: NodeJS.ProcessEnv = process.env): number {
  const raw = env.API_PORT;
  if (!raw) {
    return DEFAULT_API_PORT;
  }
  const parsed = Number.parseInt(raw, 10);
  if (Number.isInteger(parsed) && parsed > 0) {
    return parsed;
  }
  console.warn(`[api] API_PORT invalido ("${raw}"), usando ${DEFAULT_API_PORT}`);
  return DEFAULT_API_PORT;
}

/**
 * Allowed CORS origins. Unset means "reflect any origin", which is what the
 * local Next.js dev server needs (its port varies with autoPort). Set
 * CORS_ORIGIN to a comma-separated list to lock it down before any public
 * deployment, per the invariant this mirrors in ARCHITECTURE.md.
 */
export function readCorsOrigins(env: NodeJS.ProcessEnv = process.env): true | string[] {
  const raw = env.CORS_ORIGIN;
  if (!raw) {
    return true;
  }
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

/** How long a refresh token stays valid. Mirrors JWT_EXPIRES_IN in .env.example. */
export const DEFAULT_REFRESH_TOKEN_TTL = '7d';

export function readJwtExpiresIn(env: NodeJS.ProcessEnv = process.env): string {
  const raw = env.JWT_EXPIRES_IN?.trim();
  return raw && raw.length > 0 ? raw : DEFAULT_REFRESH_TOKEN_TTL;
}
