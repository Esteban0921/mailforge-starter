/**
 * Converts a human name into a URL-safe slug.
 * Used for Organization slugs (see docs/DATA_MODEL.md).
 *
 * - Folds diacritics (á -> a, ñ -> n)
 * - Lowercases
 * - Collapses any run of non-alphanumeric characters into a single hyphen
 * - Trims leading/trailing hyphens
 */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
