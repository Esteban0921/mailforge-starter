import type { OrganizationMembership } from '@mailforge/shared';
import { authenticatedRequest } from '../authenticated-fetch';

export async function listOrganizations(): Promise<OrganizationMembership[] | null> {
  const res = await authenticatedRequest<OrganizationMembership[]>('/organizations', {
    method: 'GET',
  });
  return res.ok ? res.body : null;
}
