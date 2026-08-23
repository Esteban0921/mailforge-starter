import { describe, expect, it } from 'vitest';
import { clampPageSize, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, paginate } from './pagination';

const range = (n: number): number[] => Array.from({ length: n }, (_, i) => i + 1);

describe('paginate', () => {
  it('returns the requested slice with envelope metadata', () => {
    const result = paginate(range(45), { page: 2, pageSize: 20 });
    expect(result.items).toEqual(Array.from({ length: 20 }, (_, i) => i + 21));
    expect(result.total).toBe(45);
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(20);
    expect(result.hasMore).toBe(true);
  });

  it('marks hasMore=false on the last page', () => {
    const result = paginate(range(45), { page: 3, pageSize: 20 });
    expect(result.items).toEqual([41, 42, 43, 44, 45]);
    expect(result.hasMore).toBe(false);
  });

  it('returns an empty items array for pages beyond the end', () => {
    const result = paginate(range(5), { page: 9, pageSize: 10 });
    expect(result.items).toEqual([]);
    expect(result.hasMore).toBe(false);
  });

  it('treats page < 1 as page 1', () => {
    const result = paginate([1, 2], { page: -3, pageSize: 1 });
    expect(result.page).toBe(1);
    expect(result.items).toEqual([1]);
  });

  it('does not mutate or alias the input collection', () => {
    const source = [1, 2, 3];
    const result = paginate(source, { page: 1, pageSize: 3 });
    result.items.push(99);
    expect(source).toEqual([1, 2, 3]);
  });
});

describe('clampPageSize', () => {
  it('passes through values inside bounds', () => {
    expect(clampPageSize(10)).toBe(10);
  });

  it('caps at MAX_PAGE_SIZE', () => {
    expect(clampPageSize(5000)).toBe(MAX_PAGE_SIZE);
  });

  it('falls back to DEFAULT_PAGE_SIZE for invalid input', () => {
    expect(clampPageSize(0)).toBe(DEFAULT_PAGE_SIZE);
    expect(clampPageSize(-5)).toBe(DEFAULT_PAGE_SIZE);
    expect(clampPageSize(Number.NaN)).toBe(DEFAULT_PAGE_SIZE);
  });

  it('floors fractional sizes', () => {
    expect(clampPageSize(12.9)).toBe(12);
  });
});
