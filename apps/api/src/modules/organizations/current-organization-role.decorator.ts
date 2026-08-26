import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { OrganizationRole } from '@mailforge/shared';
import type { OrganizationScopedRequest } from './organization.guard';

/** Only valid behind @UseGuards(JwtAuthGuard, OrganizationGuard). */
export const CurrentOrganizationRole = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): OrganizationRole => {
    const request = ctx.switchToHttp().getRequest<OrganizationScopedRequest>();
    return request.organizationRole as OrganizationRole;
  },
);
