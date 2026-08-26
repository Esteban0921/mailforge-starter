import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { HealthModule } from './modules/health/health.module';
import { PrismaModule } from './prisma/prisma.module';

/**
 * Root module. BullMQ still isn't wired (no queue work exists yet).
 *
 * ThrottlerGuard applies globally: generous enough not to bother a real
 * user, tight enough to blunt naive brute-force once TASK-0018 lands login.
 */
@Module({
  imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]), PrismaModule, HealthModule],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
