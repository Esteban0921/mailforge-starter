import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@mailforge/database';

/**
 * Connection is lazy (Prisma's default, no eager $connect() here): boot
 * must succeed even without a reachable database, since `pnpm test` and CI
 * run with no Docker. HealthService is where connectivity actually gets
 * exercised, and it treats a failure as a reportable state, not a crash.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
