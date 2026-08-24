import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { HealthModule } from './modules/health/health.module';

/**
 * Root module. Phase 0 intentionally wires no database/queue modules —
 * PrismaModule and BullMQ land in Phase 1 (see ISSUES.md TASK-0016/0017).
 *
 * ThrottlerGuard applies globally: generous enough not to bother a real
 * user, tight enough to blunt naive brute-force once TASK-0018 lands login.
 */
@Module({
  imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]), HealthModule],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
