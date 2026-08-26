import Papa from 'papaparse';
import { normalizeEmail } from './normalize-email';

/**
 * CSV import for Subscriber (TASK-0023). Pure parsing + validation, no I/O
 * and no Prisma — the future API endpoint calls this, and the frontend can
 * reuse it to preview/validate a file client-side before upload.
 *
 * Expected headers (case-insensitive): email (required), firstName,
 * lastName. Column-alias guessing (e.g. "Nombre", "first_name") is
 * deliberately out of scope until a real export format proves it's needed.
 */

export interface ParsedSubscriberRow {
  /** 1-based, matching the line a user would count opening the file (header = line 1). */
  line: number;
  email: string;
  firstName?: string;
  lastName?: string;
}

export type SubscriberCsvRowErrorReason = 'missing_email' | 'invalid_email' | 'duplicate_email';

export interface SubscriberCsvRowError {
  line: number;
  reason: SubscriberCsvRowErrorReason;
  /** The raw, unvalidated email value that caused the error, if any. */
  value?: string;
}

export interface ParseSubscriberCsvResult {
  rows: ParsedSubscriberRow[];
  errors: SubscriberCsvRowError[];
}

function findHeaderKey(headers: string[], ...candidates: string[]): string | undefined {
  const lower = new Map(headers.map((h) => [h.trim().toLowerCase(), h]));
  for (const candidate of candidates) {
    const match = lower.get(candidate);
    if (match) return match;
  }
  return undefined;
}

function cleanOptional(value: unknown): string | undefined {
  const trimmed = String(value ?? '').trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function parseSubscriberCsv(csvText: string): ParseSubscriberCsvResult {
  const parsed = Papa.parse<Record<string, unknown>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const headers = parsed.meta.fields ?? [];
  const emailKey = findHeaderKey(headers, 'email');
  const firstNameKey = findHeaderKey(headers, 'firstname', 'first name');
  const lastNameKey = findHeaderKey(headers, 'lastname', 'last name');

  const rows: ParsedSubscriberRow[] = [];
  const errors: SubscriberCsvRowError[] = [];
  const seenEmails = new Set<string>();

  parsed.data.forEach((record, index) => {
    const line = index + 2; // +1 for 1-based, +1 for the header row itself
    const rawEmail = emailKey ? String(record[emailKey] ?? '').trim() : '';

    if (rawEmail.length === 0) {
      errors.push({ line, reason: 'missing_email' });
      return;
    }

    const email = normalizeEmail(rawEmail);
    if (!email.ok) {
      errors.push({ line, reason: 'invalid_email', value: rawEmail });
      return;
    }

    if (seenEmails.has(email.value)) {
      errors.push({ line, reason: 'duplicate_email', value: email.value });
      return;
    }
    seenEmails.add(email.value);

    rows.push({
      line,
      email: email.value,
      firstName: firstNameKey ? cleanOptional(record[firstNameKey]) : undefined,
      lastName: lastNameKey ? cleanOptional(record[lastNameKey]) : undefined,
    });
  });

  return { rows, errors };
}
