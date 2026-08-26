import { describe, expect, it } from 'vitest';
import { parseSubscriberCsv } from './subscriber-csv';

describe('parseSubscriberCsv', () => {
  it('parses valid rows with normalized emails', () => {
    const csv = 'email,firstName,lastName\nAna@Example.com,Ana,Pérez\nluis@example.com,Luis,';
    const { rows, errors } = parseSubscriberCsv(csv);

    expect(errors).toEqual([]);
    expect(rows).toEqual([
      { line: 2, email: 'ana@example.com', firstName: 'Ana', lastName: 'Pérez' },
      { line: 3, email: 'luis@example.com', firstName: 'Luis', lastName: undefined },
    ]);
  });

  it('matches headers case-insensitively', () => {
    const csv = 'Email,FirstName,LastName\nana@example.com,Ana,Pérez';
    const { rows } = parseSubscriberCsv(csv);
    expect(rows).toEqual([
      { line: 2, email: 'ana@example.com', firstName: 'Ana', lastName: 'Pérez' },
    ]);
  });

  it('flags a missing email as its own error, not a crash', () => {
    const csv = 'email,firstName\n,Ana';
    const { rows, errors } = parseSubscriberCsv(csv);
    expect(rows).toEqual([]);
    expect(errors).toEqual([{ line: 2, reason: 'missing_email' }]);
  });

  it('flags an invalid email with the offending raw value', () => {
    const csv = 'email\nno-es-un-email';
    const { errors } = parseSubscriberCsv(csv);
    expect(errors).toEqual([{ line: 2, reason: 'invalid_email', value: 'no-es-un-email' }]);
  });

  it('flags duplicate emails within the same file, case/whitespace-insensitively', () => {
    const csv = 'email\nana@example.com\n  ANA@EXAMPLE.COM  ';
    const { rows, errors } = parseSubscriberCsv(csv);
    expect(rows).toHaveLength(1);
    expect(errors).toEqual([{ line: 3, reason: 'duplicate_email', value: 'ana@example.com' }]);
  });

  it('skips blank lines without treating them as errors', () => {
    const csv = 'email,firstName\nana@example.com,Ana\n\nluis@example.com,Luis';
    const { rows, errors } = parseSubscriberCsv(csv);
    expect(rows).toHaveLength(2);
    expect(errors).toEqual([]);
  });

  it('treats every row as missing_email when there is no email column at all', () => {
    const csv = 'firstName,lastName\nAna,Pérez';
    const { rows, errors } = parseSubscriberCsv(csv);
    expect(rows).toEqual([]);
    expect(errors).toEqual([{ line: 2, reason: 'missing_email' }]);
  });
});
