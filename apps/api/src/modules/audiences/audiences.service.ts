import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { normalizeEmail, parseSubscriberCsv } from '@mailforge/shared';
import type { SubscriberStatus } from '@mailforge/database';
import { PrismaService } from '../../prisma/prisma.service';

export interface AudienceSummary {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  subscriberCount: number;
}

export interface SubscriberSummary {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: string;
  consentSource: string | null;
  createdAt: string;
}

export interface ImportSubscribersResult {
  imported: number;
  skipped: { line: number; reason: string }[];
}

interface AudienceRecord {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
}

interface SubscriberRecord {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: string;
  consentSource: string | null;
  createdAt: Date;
}

@Injectable()
export class AudiencesService {
  constructor(private readonly prisma: PrismaService) {}

  async listAudiences(organizationId: string): Promise<AudienceSummary[]> {
    const audiences = await this.prisma.audience.findMany({
      where: { organizationId, deletedAt: null },
      include: { _count: { select: { subscribers: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return audiences.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      createdAt: a.createdAt.toISOString(),
      subscriberCount: a._count.subscribers,
    }));
  }

  async createAudience(
    organizationId: string,
    name: string,
    description?: string,
  ): Promise<AudienceSummary> {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      throw new BadRequestException({
        error: 'invalid_input',
        message: 'Ponle un nombre a la audiencia.',
      });
    }
    const audience = await this.prisma.audience.create({
      data: { organizationId, name: trimmed, description: description?.trim() || null },
    });
    return { ...toAudienceSummary(audience), subscriberCount: 0 };
  }

  async getAudience(organizationId: string, audienceId: string): Promise<AudienceSummary> {
    const audience = await this.getAudienceOrThrow(organizationId, audienceId);
    const subscriberCount = await this.prisma.audienceSubscriber.count({ where: { audienceId } });
    return { ...toAudienceSummary(audience), subscriberCount };
  }

  async listSubscribers(
    organizationId: string,
    audienceId: string,
    statusFilter?: SubscriberStatus,
  ): Promise<SubscriberSummary[]> {
    await this.getAudienceOrThrow(organizationId, audienceId);
    const links = await this.prisma.audienceSubscriber.findMany({
      where: { audienceId, subscriber: statusFilter ? { status: statusFilter } : undefined },
      include: { subscriber: true },
      orderBy: { subscribedAt: 'asc' },
    });
    return links.map((l) => toSubscriberSummary(l.subscriber));
  }

  async addSubscriber(
    organizationId: string,
    audienceId: string,
    input: { email: string; firstName?: string; lastName?: string },
  ): Promise<SubscriberSummary> {
    await this.getAudienceOrThrow(organizationId, audienceId);
    const email = normalizeEmail(input.email);
    if (!email.ok) {
      throw new BadRequestException({
        error: 'invalid_email',
        message: 'Ese email no tiene un formato válido.',
      });
    }

    // Admin-add asserts pre-existing consent (docs/DATA_MODEL.md, TASK-0055):
    // straight to `subscribed`, same as the mock. update:{} on purpose — an
    // existing subscriber's status/consent must not be overwritten just
    // because they're being linked to one more audience (terminal states
    // like unsubscribed/bounced never bounce back automatically).
    const subscriber = await this.prisma.subscriber.upsert({
      where: { organizationId_email: { organizationId, email: email.value } },
      create: {
        organizationId,
        email: email.value,
        firstName: input.firstName?.trim() || null,
        lastName: input.lastName?.trim() || null,
        status: 'subscribed',
        consentSource: 'manual_admin_add',
        consentAt: new Date(),
      },
      update: {},
    });

    const linked = await this.tryLinkSubscriber(audienceId, subscriber.id);
    if (!linked) {
      throw new ConflictException({
        error: 'duplicate_email',
        message: 'Ya hay un suscriptor con ese email en esta audiencia.',
      });
    }

    return toSubscriberSummary(subscriber);
  }

  async importSubscribersFromCsv(
    organizationId: string,
    audienceId: string,
    csvText: string,
  ): Promise<ImportSubscribersResult> {
    const audience = await this.getAudienceOrThrow(organizationId, audienceId);
    const { rows, errors } = parseSubscriberCsv(csvText);
    const skipped: { line: number; reason: string }[] = errors.map((e) => ({
      line: e.line,
      reason: e.reason,
    }));

    let imported = 0;
    for (const row of rows) {
      const subscriber = await this.prisma.subscriber.upsert({
        where: { organizationId_email: { organizationId, email: row.email } },
        create: {
          organizationId,
          email: row.email,
          firstName: row.firstName ?? null,
          lastName: row.lastName ?? null,
          status: 'subscribed',
          consentSource: `csv_import:${audience.name}`,
          consentAt: new Date(),
        },
        update: {},
      });

      const linked = await this.tryLinkSubscriber(audienceId, subscriber.id);
      if (linked) {
        imported++;
      } else {
        skipped.push({ line: row.line, reason: 'duplicate_email' });
      }
    }

    return { imported, skipped };
  }

  private async getAudienceOrThrow(
    organizationId: string,
    audienceId: string,
  ): Promise<AudienceRecord> {
    const audience = await this.prisma.audience.findFirst({
      where: { id: audienceId, organizationId, deletedAt: null },
    });
    if (!audience) {
      // Also covers an audienceId from a different organization: never
      // reveal whether it exists elsewhere, same reasoning as OrganizationGuard.
      throw new NotFoundException({ error: 'not_found', message: 'Esa audiencia no existe.' });
    }
    return audience;
  }

  /** true if newly linked, false if this subscriber was already in this audience. */
  private async tryLinkSubscriber(audienceId: string, subscriberId: string): Promise<boolean> {
    try {
      await this.prisma.audienceSubscriber.create({ data: { audienceId, subscriberId } });
      return true;
    } catch (error) {
      if (isUniqueConstraintViolation(error)) return false;
      throw error;
    }
  }
}

function toAudienceSummary(a: AudienceRecord): Omit<AudienceSummary, 'subscriberCount'> {
  return {
    id: a.id,
    name: a.name,
    description: a.description,
    createdAt: a.createdAt.toISOString(),
  };
}

function toSubscriberSummary(s: SubscriberRecord): SubscriberSummary {
  return {
    id: s.id,
    email: s.email,
    firstName: s.firstName,
    lastName: s.lastName,
    status: s.status,
    consentSource: s.consentSource,
    createdAt: s.createdAt.toISOString(),
  };
}

function isUniqueConstraintViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}
