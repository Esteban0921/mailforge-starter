import type { PrismaService } from './prisma.service';

interface FakeUser {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string;
}

interface FakeOrganization {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

interface FakeMembership {
  organizationId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * In-memory stand-in for the slice of PrismaService that AuthService and
 * OrganizationsService call, including `$transaction` (just runs the
 * callback against the same in-memory tables — no isolation/rollback, no
 * test here needs it). Keeps auth/org tests real without needing Docker,
 * per the "pnpm test works with no database" invariant (see health.service.ts).
 */
export function createFakePrismaService(): PrismaService {
  const users: FakeUser[] = [];
  const organizations: FakeOrganization[] = [];
  const memberships: FakeMembership[] = [];
  let nextUserId = 1;
  let nextOrgId = 1;

  function throwUniqueViolation(field: string): never {
    const error = new Error(`Unique constraint failed on the fields: (\`${field}\`)`) as Error & {
      code: string;
      meta: { target: string[] };
    };
    error.code = 'P2002';
    error.meta = { target: [field] };
    throw error;
  }

  const delegates = {
    user: {
      async findUnique({ where }: { where: { email?: string; id?: string } }) {
        if (where.email !== undefined) return users.find((u) => u.email === where.email) ?? null;
        if (where.id !== undefined) return users.find((u) => u.id === where.id) ?? null;
        return null;
      },
      async create({
        data,
      }: {
        data: { email: string; name: string; passwordHash: string };
      }): Promise<FakeUser> {
        if (users.some((u) => u.email === data.email)) throwUniqueViolation('email');
        const user: FakeUser = { id: `usr_${nextUserId++}`, ...data };
        users.push(user);
        return user;
      },
    },
    organization: {
      async findUnique({ where }: { where: { id?: string; slug?: string } }) {
        if (where.id !== undefined) return organizations.find((o) => o.id === where.id) ?? null;
        if (where.slug !== undefined) {
          return organizations.find((o) => o.slug === where.slug) ?? null;
        }
        return null;
      },
      async create({ data }: { data: { name: string; slug: string } }): Promise<FakeOrganization> {
        if (organizations.some((o) => o.slug === data.slug)) throwUniqueViolation('slug');
        const now = new Date();
        const org: FakeOrganization = {
          id: `org_${nextOrgId++}`,
          ...data,
          createdAt: now,
          updatedAt: now,
        };
        organizations.push(org);
        return org;
      },
      async update({
        where,
        data,
      }: {
        where: { id: string };
        data: { name?: string };
      }): Promise<FakeOrganization> {
        const org = organizations.find((o) => o.id === where.id);
        if (!org) throw new Error(`No Organization found for id ${where.id}`);
        Object.assign(org, data, { updatedAt: new Date() });
        return org;
      },
    },
    organizationMember: {
      async findUnique({
        where,
      }: {
        where: { organizationId_userId: { organizationId: string; userId: string } };
      }) {
        const { organizationId, userId } = where.organizationId_userId;
        return (
          memberships.find((m) => m.organizationId === organizationId && m.userId === userId) ??
          null
        );
      },
      async findMany({
        where,
        include,
      }: {
        where: { userId?: string; organizationId?: string };
        include?: { organization?: boolean; user?: boolean };
      }) {
        const matches = memberships.filter(
          (m) =>
            (where.userId === undefined || m.userId === where.userId) &&
            (where.organizationId === undefined || m.organizationId === where.organizationId),
        );
        return matches.map((m) => ({
          ...m,
          ...(include?.organization
            ? { organization: organizations.find((o) => o.id === m.organizationId) }
            : {}),
          ...(include?.user ? { user: users.find((u) => u.id === m.userId) } : {}),
        }));
      },
      async create({
        data,
      }: {
        data: { organizationId: string; userId: string; role: 'owner' | 'admin' | 'member' };
      }): Promise<FakeMembership> {
        const now = new Date();
        const membership: FakeMembership = { ...data, createdAt: now, updatedAt: now };
        memberships.push(membership);
        return membership;
      },
    },
  };

  return {
    ...delegates,
    async $transaction<T>(fn: (tx: typeof delegates) => Promise<T>): Promise<T> {
      return fn(delegates);
    },
  } as unknown as PrismaService;
}
