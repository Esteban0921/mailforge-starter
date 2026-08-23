import { Module } from '@nestjs/common';
import { HealthModule } from './modules/health/health.module';

/**
 * Root module. Phase 0 intentionally wires no database/queue modules —
 * PrismaModule and BullMQ land in Phase 1 (see ISSUES.md TASK-0016/0017).
 */
@Module({
  imports: [HealthModule],
})
export class AppModule {}
