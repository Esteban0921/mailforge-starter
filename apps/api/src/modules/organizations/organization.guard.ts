import {
  Injectable,
  NotFoundException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import type { OrganizationRole } from '@mailforge/shared';

/** Augmented by OrganizationGuard; read via @CurrentOrganizationRole(). */
export interface OrganizationScopedRequest extends AuthenticatedRequest {
  organizationRole?: OrganizationRole;
}

/**
 * Route must have an :id param naming the organization. Runs after
 * JwtAuthGuard (needs request.userId already set) — always list it second
 * in @UseGuards(JwtAuthGuard, OrganizationGuard).
 */
@Injectable()
export class OrganizationGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<OrganizationScopedRequest>();
    const organizationId = request.params.id as string;
    const userId = request.userId as string;

    const membership = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
    });
    if (!membership) {
      // 404, not 403: confirming an org exists to a non-member would leak
      // its existence. This also naturally covers a genuinely missing id.
      throw new NotFoundException({
        error: 'not_a_member',
        message: 'Esa organización no existe o no perteneces a ella.',
      });
    }

    request.organizationRole = membership.role;
    return true;
  }
}
