import { createAudienceStore, type AudienceStore, type StorageLike } from './store';

/** Browser singleton; unit tests never import this file. */
let instance: AudienceStore | null = null;

export function getAudienceStore(): AudienceStore {
  if (instance === null) {
    const storage: StorageLike = {
      getItem: (key) => globalThis.localStorage.getItem(key),
      setItem: (key, value) => globalThis.localStorage.setItem(key, value),
    };
    instance = createAudienceStore(storage);
  }
  return instance;
}
