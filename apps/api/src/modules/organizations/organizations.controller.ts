import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import type {
  Organization,
  OrganizationMemberSummary,
  OrganizationMembership,
  OrganizationRole,
} from '@mailforge/shared';
import { CurrentUserId } from '../auth/current-user-id.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentOrganizationRole } from './current-organization-role.decorator';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationGuard } from './organization.guard';
import { OrganizationsService } from './organizations.service';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  listMine(@CurrentUserId() userId: string): Promise<OrganizationMembership[]> {
    return this.organizationsService.listMine(userId);
  }

  @Post()
  create(
    @CurrentUserId() userId: string,
    @Body() dto: CreateOrganizationDto,
  ): Promise<OrganizationMembership> {
    return this.organizationsService.create(userId, dto.name);
  }

  @Get(':id')
  @UseGuards(OrganizationGuard)
  getOne(
    @Param('id') id: string,
    @CurrentOrganizationRole() role: OrganizationRole,
  ): Promise<OrganizationMembership> {
    return this.organizationsService.getOne(id, role);
  }

  @Patch(':id')
  @UseGuards(OrganizationGuard)
  update(
    @Param('id') id: string,
    @CurrentOrganizationRole() role: OrganizationRole,
    @Body() dto: UpdateOrganizationDto,
  ): Promise<Organization> {
    return this.organizationsService.update(id, role, dto.name);
  }

  @Get(':id/members')
  @UseGuards(OrganizationGuard)
  listMembers(@Param('id') id: string): Promise<OrganizationMemberSummary[]> {
    return this.organizationsService.listMembers(id);
  }
}
