import { slugify } from '@mailforge/shared';

/** Organization.slug is globally unique; two orgs named alike must not collide. */
export function generateOrganizationSlug(name: string): string {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${slugify(name)}-${suffix}`;
}
