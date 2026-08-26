import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OrganizationGuard } from './organization.guard';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';

@Module({
  imports: [AuthModule],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, OrganizationGuard],
})
export class OrganizationsModule {}
