import { err, normalizeEmail, ok, parseSubscriberCsv, type Result } from '@mailforge/shared';

/**
 * MOCK audience/subscriber store (Fase 2 interim), same pattern as
 * lib/auth/store.ts: plain localStorage, swapped for an HTTP client once
 * TASK-0022's real endpoints exist. Two simplifications versus the real
 * Prisma schema (packages/database), both worth revisiting once a real
 * organization concept exists in the frontend (TASK-0021):
 *   - No organizationId — there's no org switcher yet, so this mock has a
 *     single implicit tenant, same as the auth mock.
 *   - A Subscriber belongs to exactly one Audience, not the real
 *     many-to-many via AudienceSubscriber — simpler for a first UI pass;
 *     "the same person in two lists" isn't modeled yet.
 */
export const AUDIENCES_KEY = 'mailforge.audiences';
export const SUBSCRIBERS_KEY = 'mailforge.subscribers';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface Audience {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export type SubscriberStatus = 'pending' | 'subscribed' | 'unsubscribed' | 'bounced' | 'complained';

export interface Subscriber {
  id: string;
  audienceId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: SubscriberStatus;
  consentSource: string;
  createdAt: string;
}

export type CreateAudienceError = 'invalid_input';
export type AddSubscriberError = 'invalid_input' | 'invalid_email' | 'duplicate_email';

export interface ImportSubscribersResult {
  imported: number;
  skipped: SubscriberCsvSkip[];
}

export interface SubscriberCsvSkip {
  line: number;
  reason: 'missing_email' | 'invalid_email' | 'duplicate_email';
}

/** Minimal async delay so loading states behave like real network calls. */
const MOCK_LATENCY_MS = 150;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readJson<T>(storage: StorageLike, key: string): T[] {
  const raw = storage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export interface AudienceStore {
  listAudiences(): Audience[];
  getAudience(id: string): Audience | null;
  createAudience(input: {
    name: string;
    description?: string;
  }): Promise<Result<Audience, CreateAudienceError>>;
  listSubscribers(audienceId: string, statusFilter?: SubscriberStatus): Subscriber[];
  addSubscriber(
    audienceId: string,
    input: { email: string; firstName?: string; lastName?: string },
  ): Promise<Result<Subscriber, AddSubscriberError>>;
  /** Admin-add and CSV import both assert pre-existing consent → straight to `subscribed` (see docs/DATA_MODEL.md, TASK-0055). */
  importSubscribersFromCsv(audienceId: string, csvText: string): Promise<ImportSubscribersResult>;
}

export function createAudienceStore(storage: StorageLike): AudienceStore {
  function saveAudiences(audiences: Audience[]): void {
    storage.setItem(AUDIENCES_KEY, JSON.stringify(audiences));
  }

  function saveSubscribers(subscribers: Subscriber[]): void {
    storage.setItem(SUBSCRIBERS_KEY, JSON.stringify(subscribers));
  }

  return {
    listAudiences() {
      return readJson<Audience>(storage, AUDIENCES_KEY);
    },

    getAudience(id) {
      return this.listAudiences().find((a) => a.id === id) ?? null;
    },

    async createAudience(input) {
      const name = input.name.trim();
      if (name.length === 0) {
        return err('invalid_input');
      }

      await sleep(MOCK_LATENCY_MS);

      const audience: Audience = {
        id: makeId('aud'),
        name,
        description: input.description?.trim() || null,
        createdAt: new Date().toISOString(),
      };
      saveAudiences([...readJson<Audience>(storage, AUDIENCES_KEY), audience]);
      return ok(audience);
    },

    listSubscribers(audienceId, statusFilter) {
      const all = readJson<Subscriber>(storage, SUBSCRIBERS_KEY).filter(
        (s) => s.audienceId === audienceId,
      );
      return statusFilter ? all.filter((s) => s.status === statusFilter) : all;
    },

    async addSubscriber(audienceId, input) {
      const email = normalizeEmail(input.email);
      if (!email.ok) {
        return err('invalid_email');
      }

      await sleep(MOCK_LATENCY_MS);

      const subscribers = readJson<Subscriber>(storage, SUBSCRIBERS_KEY);
      const duplicate = subscribers.some(
        (s) => s.audienceId === audienceId && s.email === email.value,
      );
      if (duplicate) {
        return err('duplicate_email');
      }

      const subscriber: Subscriber = {
        id: makeId('sub'),
        audienceId,
        email: email.value,
        firstName: input.firstName?.trim() || null,
        lastName: input.lastName?.trim() || null,
        status: 'subscribed',
        consentSource: 'manual_admin_add',
        createdAt: new Date().toISOString(),
      };
      saveSubscribers([...subscribers, subscriber]);
      return ok(subscriber);
    },

    async importSubscribersFromCsv(audienceId, csvText) {
      await sleep(MOCK_LATENCY_MS);

      const { rows, errors } = parseSubscriberCsv(csvText);
      const subscribers = readJson<Subscriber>(storage, SUBSCRIBERS_KEY);
      const existing = new Set(
        subscribers.filter((s) => s.audienceId === audienceId).map((s) => s.email),
      );

      const skipped: SubscriberCsvSkip[] = errors.map((e) => ({ line: e.line, reason: e.reason }));
      const toAdd: Subscriber[] = [];

      for (const row of rows) {
        if (existing.has(row.email)) {
          skipped.push({ line: row.line, reason: 'duplicate_email' });
          continue;
        }
        existing.add(row.email);
        toAdd.push({
          id: makeId('sub'),
          audienceId,
          email: row.email,
          firstName: row.firstName ?? null,
          lastName: row.lastName ?? null,
          status: 'subscribed',
          consentSource: 'csv_import',
          createdAt: new Date().toISOString(),
        });
      }

      saveSubscribers([...subscribers, ...toAdd]);
      return { imported: toAdd.length, skipped };
    },
  };
}
