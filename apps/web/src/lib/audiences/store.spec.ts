import { beforeEach, describe, expect, it } from 'vitest';
import { AUDIENCES_KEY, SUBSCRIBERS_KEY, createAudienceStore, type StorageLike } from './store';

function memoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
  };
}

describe('createAudienceStore (mock)', () => {
  let storage: StorageLike;

  beforeEach(() => {
    storage = memoryStorage();
  });

  describe('createAudience', () => {
    it('creates an audience and lists it', async () => {
      const store = createAudienceStore(storage);
      const result = await store.createAudience({ name: 'Clientes VIP', description: 'Top 10%' });

      expect(result.ok).toBe(true);
      expect(store.listAudiences()).toHaveLength(1);
      expect(store.listAudiences()[0].name).toBe('Clientes VIP');
    });

    it('rejects a blank name', async () => {
      const store = createAudienceStore(storage);
      expect(await store.createAudience({ name: '   ' })).toEqual({
        ok: false,
        error: 'invalid_input',
      });
    });

    it('stores an empty description as null, not an empty string', async () => {
      const store = createAudienceStore(storage);
      const result = await store.createAudience({ name: 'Newsletter', description: '  ' });
      expect(result.ok && result.value.description).toBeNull();
    });
  });

  describe('addSubscriber', () => {
    it('adds a subscriber as already subscribed (admin add asserts consent)', async () => {
      const store = createAudienceStore(storage);
      const audience = await store.createAudience({ name: 'Newsletter' });
      if (!audience.ok) throw new Error('setup failed');

      const result = await store.addSubscriber(audience.value.id, {
        email: 'Ana@Example.com',
        firstName: 'Ana',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.email).toBe('ana@example.com');
        expect(result.value.status).toBe('subscribed');
        expect(result.value.consentSource).toBe('manual_admin_add');
      }
    });

    it('rejects an invalid email', async () => {
      const store = createAudienceStore(storage);
      const audience = await store.createAudience({ name: 'Newsletter' });
      if (!audience.ok) throw new Error('setup failed');

      expect(await store.addSubscriber(audience.value.id, { email: 'no-es-email' })).toEqual({
        ok: false,
        error: 'invalid_email',
      });
    });

    it('rejects a duplicate email within the same audience, case-insensitively', async () => {
      const store = createAudienceStore(storage);
      const audience = await store.createAudience({ name: 'Newsletter' });
      if (!audience.ok) throw new Error('setup failed');

      await store.addSubscriber(audience.value.id, { email: 'ana@example.com' });
      expect(await store.addSubscriber(audience.value.id, { email: 'ANA@example.com' })).toEqual({
        ok: false,
        error: 'duplicate_email',
      });
    });

    it('allows the same email in two different audiences', async () => {
      const store = createAudienceStore(storage);
      const a = await store.createAudience({ name: 'A' });
      const b = await store.createAudience({ name: 'B' });
      if (!a.ok || !b.ok) throw new Error('setup failed');

      await store.addSubscriber(a.value.id, { email: 'ana@example.com' });
      const result = await store.addSubscriber(b.value.id, { email: 'ana@example.com' });
      expect(result.ok).toBe(true);
    });
  });

  describe('listSubscribers', () => {
    it('only returns subscribers of the requested audience', async () => {
      const store = createAudienceStore(storage);
      const a = await store.createAudience({ name: 'A' });
      const b = await store.createAudience({ name: 'B' });
      if (!a.ok || !b.ok) throw new Error('setup failed');

      await store.addSubscriber(a.value.id, { email: 'in-a@example.com' });
      await store.addSubscriber(b.value.id, { email: 'in-b@example.com' });

      const subscribersOfA = store.listSubscribers(a.value.id);
      expect(subscribersOfA).toHaveLength(1);
      expect(subscribersOfA[0].email).toBe('in-a@example.com');
    });

    it('filters by status when a filter is passed', async () => {
      const store = createAudienceStore(storage);
      const audience = await store.createAudience({ name: 'A' });
      if (!audience.ok) throw new Error('setup failed');
      await store.addSubscriber(audience.value.id, { email: 'ana@example.com' });

      expect(store.listSubscribers(audience.value.id, 'subscribed')).toHaveLength(1);
      expect(store.listSubscribers(audience.value.id, 'bounced')).toHaveLength(0);
    });
  });

  describe('importSubscribersFromCsv', () => {
    it('imports valid rows as subscribed and reports skipped rows', async () => {
      const store = createAudienceStore(storage);
      const audience = await store.createAudience({ name: 'Importada' });
      if (!audience.ok) throw new Error('setup failed');

      const csv = 'email,firstName\nana@example.com,Ana\nno-es-email,X\nluis@example.com,Luis';
      const result = await store.importSubscribersFromCsv(audience.value.id, csv);

      expect(result.imported).toBe(2);
      expect(result.skipped).toEqual([{ line: 3, reason: 'invalid_email' }]);
      expect(store.listSubscribers(audience.value.id)).toHaveLength(2);
      expect(store.listSubscribers(audience.value.id)[0].consentSource).toBe('csv_import');
    });

    it('skips a row that duplicates a subscriber already in the audience', async () => {
      const store = createAudienceStore(storage);
      const audience = await store.createAudience({ name: 'A' });
      if (!audience.ok) throw new Error('setup failed');
      await store.addSubscriber(audience.value.id, { email: 'ana@example.com' });

      const result = await store.importSubscribersFromCsv(
        audience.value.id,
        'email\nana@example.com',
      );

      expect(result.imported).toBe(0);
      expect(result.skipped).toEqual([{ line: 2, reason: 'duplicate_email' }]);
    });
  });

  it('tolerates corrupted storage without crashing', () => {
    storage.setItem(AUDIENCES_KEY, '{not-json');
    storage.setItem(SUBSCRIBERS_KEY, '{not-json');
    const store = createAudienceStore(storage);

    expect(store.listAudiences()).toEqual([]);
    expect(store.listSubscribers('anything')).toEqual([]);
  });
});
