import { describe, expect, it } from 'vitest';
import { MIN_PASSWORD_LENGTH, validatePassword } from './auth';

describe('validatePassword', () => {
  it('rejects passwords shorter than the minimum length', () => {
    expect(validatePassword('a'.repeat(MIN_PASSWORD_LENGTH - 1))).toBe(false);
  });

  it('accepts a password exactly at the minimum length', () => {
    expect(validatePassword('a'.repeat(MIN_PASSWORD_LENGTH))).toBe(true);
  });

  it('accepts passwords longer than the minimum length', () => {
    expect(validatePassword('a'.repeat(MIN_PASSWORD_LENGTH + 10))).toBe(true);
  });

  it('rejects an empty password', () => {
    expect(validatePassword('')).toBe(false);
  });
});
