import type { PrismaService } from './prisma.service';

/**
 * In-memory stand-in for PrismaService's `user` delegate, scoped to exactly
 * what AuthService calls. Keeps auth tests real (actual duplicate-email and
 * not-found logic runs) without needing Docker, per the "pnpm test works
 * with no database" invariant (see health.service.ts).
 */
export function createFakePrismaService(): PrismaService {
  const users: { id: string; email: string; name: string | null; passwordHash: string }[] = [];
  let nextId = 1;

  return {
    user: {
      async findUnique({ where }: { where: { email?: string; id?: string } }) {
        if (where.email !== undefined) {
          return users.find((u) => u.email === where.email) ?? null;
        }
        if (where.id !== undefined) {
          return users.find((u) => u.id === where.id) ?? null;
        }
        return null;
      },
      async create({ data }: { data: { email: string; name: string; passwordHash: string } }) {
        if (users.some((u) => u.email === data.email)) {
          const error = new Error('Unique constraint failed on the fields: (`email`)') as Error & {
            code: string;
          };
          error.code = 'P2002';
          throw error;
        }
        const user = { id: `usr_${nextId++}`, ...data };
        users.push(user);
        return user;
      },
    },
  } as unknown as PrismaService;
}
