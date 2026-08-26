import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrganizationGuard } from '../organizations/organization.guard';
import {
  AudiencesService,
  type AudienceSummary,
  type ImportSubscribersResult,
  type SubscriberSummary,
} from './audiences.service';
import { AddSubscriberDto } from './dto/add-subscriber.dto';
import { CreateAudienceDto } from './dto/create-audience.dto';
import { ImportSubscribersDto } from './dto/import-subscribers.dto';
import { ListSubscribersQueryDto } from './dto/list-subscribers.query.dto';

/**
 * Nested under organizations/:id so the existing OrganizationGuard (which
 * already resolves the :id param to a confirmed membership) protects these
 * routes too, with no changes to that guard.
 */
@Controller('organizations/:id/audiences')
@UseGuards(JwtAuthGuard, OrganizationGuard)
export class AudiencesController {
  constructor(private readonly audiencesService: AudiencesService) {}

  @Get()
  listAudiences(@Param('id') organizationId: string): Promise<AudienceSummary[]> {
    return this.audiencesService.listAudiences(organizationId);
  }

  @Post()
  createAudience(
    @Param('id') organizationId: string,
    @Body() dto: CreateAudienceDto,
  ): Promise<AudienceSummary> {
    return this.audiencesService.createAudience(organizationId, dto.name, dto.description);
  }

  @Get(':audienceId')
  getAudience(
    @Param('id') organizationId: string,
    @Param('audienceId') audienceId: string,
  ): Promise<AudienceSummary> {
    return this.audiencesService.getAudience(organizationId, audienceId);
  }

  @Get(':audienceId/subscribers')
  listSubscribers(
    @Param('id') organizationId: string,
    @Param('audienceId') audienceId: string,
    @Query() query: ListSubscribersQueryDto,
  ): Promise<SubscriberSummary[]> {
    return this.audiencesService.listSubscribers(organizationId, audienceId, query.status);
  }

  @Post(':audienceId/subscribers')
  addSubscriber(
    @Param('id') organizationId: string,
    @Param('audienceId') audienceId: string,
    @Body() dto: AddSubscriberDto,
  ): Promise<SubscriberSummary> {
    return this.audiencesService.addSubscriber(organizationId, audienceId, dto);
  }

  @Post(':audienceId/subscribers/import')
  importSubscribers(
    @Param('id') organizationId: string,
    @Param('audienceId') audienceId: string,
    @Body() dto: ImportSubscribersDto,
  ): Promise<ImportSubscribersResult> {
    return this.audiencesService.importSubscribersFromCsv(organizationId, audienceId, dto.csvText);
  }
}
