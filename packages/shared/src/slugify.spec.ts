import { describe, expect, it } from 'vitest';
import { slugify } from './slugify';

describe('slugify', () => {
  it('lowercases and hyphenates a plain name', () => {
    expect(slugify('Acme Marketing')).toBe('acme-marketing');
  });

  it('folds Spanish diacritics', () => {
    expect(slugify('Taller Ñandú Ávila')).toBe('taller-nandu-avila');
  });

  it('collapses runs of punctuation and spaces into one hyphen', () => {
    expect(slugify('  Acme -- Co.  (EU) ')).toBe('acme-co-eu');
  });

  it('keeps digits', () => {
    expect(slugify('Equipo 2026')).toBe('equipo-2026');
  });

  it('returns an empty string for symbol-only input', () => {
    expect(slugify('*** --- ***')).toBe('');
  });
});
