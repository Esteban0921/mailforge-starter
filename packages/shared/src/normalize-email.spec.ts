import { describe, expect, it } from 'vitest';
import { isValidEmail, normalizeEmail } from './normalize-email';

describe('normalizeEmail', () => {
  it('trims and lowercases a valid email', () => {
    expect(normalizeEmail('  Ana.Perez@Example.COM ')).toEqual({
      ok: true,
      value: 'ana.perez@example.com',
    });
  });

  it('accepts simple addresses with subdomains', () => {
    expect(normalizeEmail('user@mail.example.org').ok).toBe(true);
  });

  it('rejects an empty address', () => {
    expect(normalizeEmail('   ')).toEqual({ ok: false, error: 'empty' });
    expect(normalizeEmail('')).toEqual({ ok: false, error: 'empty' });
  });

  it('rejects addresses without a TLD', () => {
    expect(normalizeEmail('user@localhost')).toEqual({
      ok: false,
      error: 'invalid_format',
    });
  });

  it('rejects addresses containing whitespace', () => {
    expect(normalizeEmail('us er@example.com')).toEqual({
      ok: false,
      error: 'invalid_format',
    });
  });

  it('rejects addresses without @', () => {
    expect(normalizeEmail('not-an-email')).toEqual({
      ok: false,
      error: 'invalid_format',
    });
  });
});

describe('isValidEmail', () => {
  it('returns true only for normalized-valid addresses', () => {
    expect(isValidEmail('Ana@Example.com')).toBe(true);
    expect(isValidEmail('nope')).toBe(false);
  });
});
