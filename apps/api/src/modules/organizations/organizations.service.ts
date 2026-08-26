import { ForbiddenException, Injectable } from '@nestjs/common';
import type {
  Organization,
  OrganizationMemberSummary,
  OrganizationMembership,
  OrganizationRole,
} from '@mailforge/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { generateOrganizationSlug } from './organization-slug';

interface OrganizationRecord {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
}

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listMine(userId: string): Promise<OrganizationMembership[]> {
    const memberships = await this.prisma.organizationMember.findMany({
      where: { userId },
      include: { organization: true },
      orderBy: { createdAt: 'asc' },
    });
    return memberships.map((m) => ({
      organization: toOrganization(m.organization),
      role: m.role,
    }));
  }

  async create(userId: string, name: string): Promise<OrganizationMembership> {
    const trimmed = name.trim();
    const organization = await this.prisma.$transaction(async (tx) => {
      const created = await tx.organization.create({
        data: { name: trimmed, slug: generateOrganizationSlug(trimmed) },
      });
      await tx.organizationMember.create({
        data: { organizationId: created.id, userId, role: 'owner' },
      });
      return created;
    });

    return { organization: toOrganization(organization), role: 'owner' };
  }

  async getOne(organizationId: string, role: OrganizationRole): Promise<OrganizationMembership> {
    // OrganizationGuard already confirmed membership, so this row exists.
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });
    return { organization: toOrganization(organization as OrganizationRecord), role };
  }

  async update(
    organizationId: string,
    role: OrganizationRole,
    name: string,
  ): Promise<Organization> {
    requireOwnerOrAdmin(role);
    const organization = await this.prisma.organization.update({
      where: { id: organizationId },
      data: { name: name.trim() },
    });
    return toOrganization(organization);
  }

  async listMembers(organizationId: string): Promise<OrganizationMemberSummary[]> {
    const memberships = await this.prisma.organizationMember.findMany({
      where: { organizationId },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });
    return memberships.map((m) => ({
      userId: m.user.id,
      email: m.user.email,
      name: m.user.name,
      role: m.role,
    }));
  }
}

function toOrganization(record: OrganizationRecord): Organization {
  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    createdAt: record.createdAt.toISOString(),
  };
}

function requireOwnerOrAdmin(role: OrganizationRole): void {
  if (role !== 'owner' && role !== 'admin') {
    throw new ForbiddenException({
      error: 'insufficient_role',
      message: 'Solo el dueño o un admin puede hacer esto.',
    });
  }
}
