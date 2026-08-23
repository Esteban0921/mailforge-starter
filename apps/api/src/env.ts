/** Port the HTTP server binds to. Mirrors API_PORT in .env.example. */
export const DEFAULT_API_PORT = 3001;

/**
 * Reads the API port from the environment, falling back to the documented
 * default. An invalid value is treated as absent rather than crashing boot.
 */
export function readApiPort(env: NodeJS.ProcessEnv = process.env): number {
  const raw = env.API_PORT;
  if (!raw) {
    return DEFAULT_API_PORT;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_API_PORT;
}
