import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { AudiencesController } from './audiences.controller';
import { AudiencesService } from './audiences.service';

@Module({
  imports: [AuthModule, OrganizationsModule],
  controllers: [AudiencesController],
  providers: [AudiencesService],
})
export class AudiencesModule {}
