import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { AudiencesService } from './audiences.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createFakePrismaService } from '../../prisma/prisma.fake';

const ORG_A = 'org_a';
const ORG_B = 'org_b';

describe('AudiencesService (unit)', () => {
  let service: AudiencesService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AudiencesService,
        { provide: PrismaService, useValue: createFakePrismaService() },
      ],
    }).compile();
    service = moduleRef.get(AudiencesService);
  });

  describe('createAudience + listAudiences', () => {
    it('creates an audience with zero subscribers', async () => {
      const audience = await service.createAudience(ORG_A, 'Clientes VIP', 'Top 10% por gasto');
      expect(audience).toMatchObject({
        name: 'Clientes VIP',
        description: 'Top 10% por gasto',
        subscriberCount: 0,
      });
    });

    it('rejects a blank name', async () => {
      await expect(service.createAudience(ORG_A, '   ')).rejects.toMatchObject({
        response: { error: 'invalid_input' },
      });
    });

    it('only lists audiences belonging to the given organization', async () => {
      await service.createAudience(ORG_A, 'Audiencia de A');
      await service.createAudience(ORG_B, 'Audiencia de B');

      const mine = await service.listAudiences(ORG_A);
      expect(mine).toHaveLength(1);
      expect(mine[0].name).toBe('Audiencia de A');
    });
  });

  describe('getAudience', () => {
    it('404s for an audience id from a different organization', async () => {
      const audience = await service.createAudience(ORG_A, 'Solo de A');
      await expect(service.getAudience(ORG_B, audience.id)).rejects.toMatchObject({
        response: { error: 'not_found' },
      });
    });
  });

  describe('addSubscriber', () => {
    it('adds a subscriber as already subscribed (admin-add asserts consent)', async () => {
      const audience = await service.createAudience(ORG_A, 'Clientes VIP');
      const subscriber = await service.addSubscriber(ORG_A, audience.id, {
        email: 'Ana@Example.COM',
        firstName: 'Ana',
      });

      expect(subscriber).toMatchObject({
        email: 'ana@example.com',
        firstName: 'Ana',
        status: 'subscribed',
        consentSource: 'manual_admin_add',
      });
    });

    it('rejects an invalid email', async () => {
      const audience = await service.createAudience(ORG_A, 'Clientes VIP');
      await expect(
        service.addSubscriber(ORG_A, audience.id, { email: 'not-an-email' }),
      ).rejects.toMatchObject({ response: { error: 'invalid_email' } });
    });

    it('rejects a duplicate within the same audience', async () => {
      const audience = await service.createAudience(ORG_A, 'Clientes VIP');
      await service.addSubscriber(ORG_A, audience.id, { email: 'ana@example.com' });

      await expect(
        service.addSubscriber(ORG_A, audience.id, { email: 'ana@example.com' }),
      ).rejects.toMatchObject({ response: { error: 'duplicate_email' } });
    });

    it('allows the same email in two different audiences of the same org, sharing one Subscriber', async () => {
      const audienceA = await service.createAudience(ORG_A, 'Audiencia A');
      const audienceB = await service.createAudience(ORG_A, 'Audiencia B');

      const first = await service.addSubscriber(ORG_A, audienceA.id, { email: 'ana@example.com' });
      const second = await service.addSubscriber(ORG_A, audienceB.id, { email: 'ana@example.com' });

      expect(second.id).toBe(first.id); // same underlying Subscriber row
      expect(await service.listSubscribers(ORG_A, audienceA.id)).toHaveLength(1);
      expect(await service.listSubscribers(ORG_A, audienceB.id)).toHaveLength(1);
    });

    it('404s when the audience belongs to a different organization', async () => {
      const audience = await service.createAudience(ORG_A, 'Solo de A');
      await expect(
        service.addSubscriber(ORG_B, audience.id, { email: 'ana@example.com' }),
      ).rejects.toMatchObject({ response: { error: 'not_found' } });
    });
  });

  describe('listSubscribers', () => {
    it('filters by status', async () => {
      const audience = await service.createAudience(ORG_A, 'Clientes VIP');
      await service.addSubscriber(ORG_A, audience.id, { email: 'ana@example.com' });

      expect(await service.listSubscribers(ORG_A, audience.id, 'subscribed')).toHaveLength(1);
      expect(await service.listSubscribers(ORG_A, audience.id, 'pending')).toHaveLength(0);
    });
  });

  describe('importSubscribersFromCsv', () => {
    it('imports valid rows and reports skipped ones with their reason', async () => {
      const audience = await service.createAudience(ORG_A, 'Clientes VIP');
      await service.addSubscriber(ORG_A, audience.id, { email: 'ana@example.com' });

      const csv = [
        'email,firstName,lastName',
        'luis@example.com,Luis,Gómez',
        'no-es-email,X,Y',
        'ana@example.com,Ana,Duplicada',
      ].join('\n');

      const result = await service.importSubscribersFromCsv(ORG_A, audience.id, csv);

      expect(result.imported).toBe(1);
      expect(result.skipped).toEqual([
        { line: 3, reason: 'invalid_email' },
        { line: 4, reason: 'duplicate_email' },
      ]);
      expect(await service.listSubscribers(ORG_A, audience.id)).toHaveLength(2);
    });

    it('tags the import source with the audience name', async () => {
      const audience = await service.createAudience(ORG_A, 'Clientes VIP');
      await service.importSubscribersFromCsv(ORG_A, audience.id, 'email\nluis@example.com');

      const [subscriber] = await service.listSubscribers(ORG_A, audience.id);
      expect(subscriber.consentSource).toBe('csv_import:Clientes VIP');
    });
  });
});
