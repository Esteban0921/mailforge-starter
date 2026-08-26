/**
 * Organization contracts shared between the API and the Web app, same
 * pattern as auth.ts: the frontend can build against this shape before or
 * after the real endpoints exist.
 */

export type OrganizationRole = 'owner' | 'admin' | 'member';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

/** An organization plus the current user's role in it — what the switcher needs. */
export interface OrganizationMembership {
  organization: Organization;
  role: OrganizationRole;
}

export interface OrganizationMemberSummary {
  userId: string;
  email: string;
  name: string | null;
  role: OrganizationRole;
}

export type OrganizationError = 'invalid_input' | 'not_a_member' | 'insufficient_role';
