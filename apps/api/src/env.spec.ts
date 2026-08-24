import { describe, expect, it } from 'vitest';
import { DEFAULT_API_PORT, readApiPort, readCorsOrigins } from './env';

describe('readApiPort', () => {
  it('falls back to the default when unset', () => {
    expect(readApiPort({})).toBe(DEFAULT_API_PORT);
  });

  it('parses a valid port', () => {
    expect(readApiPort({ API_PORT: '4000' })).toBe(4000);
  });

  it('falls back to the default for a non-numeric value', () => {
    expect(readApiPort({ API_PORT: 'nope' })).toBe(DEFAULT_API_PORT);
  });

  it('falls back to the default for a non-positive value', () => {
    expect(readApiPort({ API_PORT: '0' })).toBe(DEFAULT_API_PORT);
    expect(readApiPort({ API_PORT: '-5' })).toBe(DEFAULT_API_PORT);
  });
});

describe('readCorsOrigins', () => {
  it('reflects any origin when unset', () => {
    expect(readCorsOrigins({})).toBe(true);
  });

  it('parses a single origin', () => {
    expect(readCorsOrigins({ CORS_ORIGIN: 'https://app.mailforge.dev' })).toEqual([
      'https://app.mailforge.dev',
    ]);
  });

  it('parses a comma-separated list, trimming whitespace', () => {
    expect(readCorsOrigins({ CORS_ORIGIN: 'https://a.dev, https://b.dev ,https://c.dev' })).toEqual(
      ['https://a.dev', 'https://b.dev', 'https://c.dev'],
    );
  });

  it('drops empty entries from a trailing comma', () => {
    expect(readCorsOrigins({ CORS_ORIGIN: 'https://a.dev,' })).toEqual(['https://a.dev']);
  });
});
