/**
 * Low-level fetch wrapper for apps/api. No auth-awareness here on purpose —
 * http-store.ts attaches tokens itself, since it's the one place that knows
 * about refresh-on-401 (nothing else calls a protected endpoint yet; see
 * that file's docstring for why the retry logic isn't generalized here too).
 */

const DEFAULT_API_URL = 'http://localhost:3001';

export function apiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;
}

export interface ApiResponse<T> {
  status: number;
  body: T;
}

export async function apiRequest<T = unknown>(
  path: string,
  options: { method: 'GET' | 'POST' | 'PATCH'; body?: unknown; accessToken?: string },
): Promise<ApiResponse<T>> {
  let res: Response;
  try {
    res = await fetch(`${apiBaseUrl()}${path}`, {
      method: options.method,
      headers: {
        'Content-Type': 'application/json',
        ...(options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    // API unreachable (offline, wrong URL, server down): status 0 so callers
    // treat it as a normal failed response instead of an unhandled rejection.
    return { status: 0, body: {} as T };
  }

  const body = (await res.json().catch(() => ({}))) as T;
  return { status: res.status, body };
}
