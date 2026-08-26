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

interface FakeAudience {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface FakeSubscriber {
  id: string;
  organizationId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: string;
  consentSource: string | null;
  consentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface FakeAudienceLink {
  audienceId: string;
  subscriberId: string;
  subscribedAt: Date;
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
  const audiences: FakeAudience[] = [];
  const subscribers: FakeSubscriber[] = [];
  const audienceLinks: FakeAudienceLink[] = [];
  let nextUserId = 1;
  let nextOrgId = 1;
  let nextAudienceId = 1;
  let nextSubscriberId = 1;

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
      async update({
        where,
        data,
      }: {
        where: { id: string };
        data: { name?: string; passwordHash?: string };
      }): Promise<FakeUser> {
        const user = users.find((u) => u.id === where.id);
        if (!user) throw new Error(`No User found for id ${where.id}`);
        Object.assign(user, data);
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
    audience: {
      async findMany({
        where,
        include,
      }: {
        where: { organizationId: string; deletedAt: null };
        include?: { _count?: { select: { subscribers: true } } };
      }) {
        const matches = audiences.filter(
          (a) => a.organizationId === where.organizationId && a.deletedAt === null,
        );
        return matches.map((a) => ({
          ...a,
          ...(include?._count
            ? { _count: { subscribers: audienceLinks.filter((l) => l.audienceId === a.id).length } }
            : {}),
        }));
      },
      async create({
        data,
      }: {
        data: { organizationId: string; name: string; description: string | null };
      }): Promise<FakeAudience> {
        const now = new Date();
        const audience: FakeAudience = {
          id: `aud_${nextAudienceId++}`,
          deletedAt: null,
          ...data,
          createdAt: now,
          updatedAt: now,
        };
        audiences.push(audience);
        return audience;
      },
      async findFirst({
        where,
      }: {
        where: { id: string; organizationId: string; deletedAt: null };
      }): Promise<FakeAudience | null> {
        return (
          audiences.find(
            (a) =>
              a.id === where.id &&
              a.organizationId === where.organizationId &&
              a.deletedAt === null,
          ) ?? null
        );
      },
    },
    subscriber: {
      async upsert({
        where,
        create,
        update,
      }: {
        where: { organizationId_email: { organizationId: string; email: string } };
        create: {
          organizationId: string;
          email: string;
          firstName: string | null;
          lastName: string | null;
          status: string;
          consentSource: string;
          consentAt: Date;
        };
        update: Record<string, never>;
      }): Promise<FakeSubscriber> {
        const { organizationId, email } = where.organizationId_email;
        const existing = subscribers.find(
          (s) => s.organizationId === organizationId && s.email === email,
        );
        if (existing) {
          Object.assign(existing, update, { updatedAt: new Date() });
          return existing;
        }
        const now = new Date();
        const subscriber: FakeSubscriber = {
          id: `sub_${nextSubscriberId++}`,
          ...create,
          createdAt: now,
          updatedAt: now,
        };
        subscribers.push(subscriber);
        return subscriber;
      },
    },
    audienceSubscriber: {
      async create({
        data,
      }: {
        data: { audienceId: string; subscriberId: string };
      }): Promise<FakeAudienceLink> {
        if (
          audienceLinks.some(
            (l) => l.audienceId === data.audienceId && l.subscriberId === data.subscriberId,
          )
        ) {
          throwUniqueViolation('audienceId_subscriberId');
        }
        const link: FakeAudienceLink = { ...data, subscribedAt: new Date() };
        audienceLinks.push(link);
        return link;
      },
      async findMany({
        where,
        include,
      }: {
        where: { audienceId: string; subscriber?: { status: string } };
        include?: { subscriber?: boolean };
      }) {
        const matches = audienceLinks.filter((l) => {
          if (l.audienceId !== where.audienceId) return false;
          if (where.subscriber?.status !== undefined) {
            const subscriber = subscribers.find((s) => s.id === l.subscriberId);
            if (subscriber?.status !== where.subscriber.status) return false;
          }
          return true;
        });
        return matches.map((l) => ({
          ...l,
          ...(include?.subscriber
            ? { subscriber: subscribers.find((s) => s.id === l.subscriberId) }
            : {}),
        }));
      },
      async count({ where }: { where: { audienceId: string } }): Promise<number> {
        return audienceLinks.filter((l) => l.audienceId === where.audienceId).length;
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
