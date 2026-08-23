/** Query params accepted by list endpoints (already validated/coerced upstream). */
export interface PageQuery {
  page: number;
  pageSize: number;
}

/** Envelope returned by every paginated endpoint. */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

/**
 * Clamps a page size to sane bounds. Non-finite or non-positive values fall
 * back to DEFAULT_PAGE_SIZE so a bad client can't request the whole table.
 */
export function clampPageSize(pageSize: number): number {
  if (!Number.isFinite(pageSize) || pageSize <= 0) {
    return DEFAULT_PAGE_SIZE;
  }
  return Math.min(Math.floor(pageSize), MAX_PAGE_SIZE);
}

/**
 * Slices an already-materialized collection into one page.
 * Database-level pagination will reuse the same envelope shape.
 */
export function paginate<T>(items: readonly T[], query: PageQuery): Paginated<T> {
  const page = Math.max(1, Math.floor(query.page) || 1);
  const pageSize = clampPageSize(query.pageSize);
  const start = (page - 1) * pageSize;
  const slice = items.slice(start, start + pageSize);

  return {
    items: [...slice],
    total: items.length,
    page,
    pageSize,
    hasMore: start + pageSize < items.length,
  };
}
