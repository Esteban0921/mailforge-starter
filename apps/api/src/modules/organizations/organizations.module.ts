import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OrganizationGuard } from './organization.guard';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';

@Module({
  imports: [AuthModule],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, OrganizationGuard],
  // OrganizationGuard is reused by any module scoping routes under
  // organizations/:id/... (e.g. AudiencesModule) — exported so they don't
  // each redeclare it as their own provider.
  exports: [OrganizationGuard],
})
export class OrganizationsModule {}
