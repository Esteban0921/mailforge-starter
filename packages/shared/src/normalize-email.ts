import { err, ok, type Result } from './result';

/**
 * Pragmatic email pattern: something@something.tld with no whitespace.
 * Full RFC 5322 validation is intentionally out of scope; deliverability is
 * verified by the sending infrastructure, not by regex.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type EmailValidationError = 'empty' | 'invalid_format';

/**
 * Normalizes an email address for storage and comparison:
 * trims surrounding whitespace and lowercases the local + domain parts.
 * Emails are always stored normalized (see docs/DATA_MODEL.md).
 */
export function normalizeEmail(input: string): Result<string, EmailValidationError> {
  const normalized = input.trim().toLowerCase();
  if (normalized.length === 0) {
    return err('empty');
  }
  if (!EMAIL_PATTERN.test(normalized)) {
    return err('invalid_format');
  }
  return ok(normalized);
}

/** Convenience predicate built on top of {@link normalizeEmail}. */
export function isValidEmail(input: string): boolean {
  return normalizeEmail(input).ok;
}
