import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { OrganizationsService } from './organizations.service';
import { PrismaService } from '../../prisma/prisma.service';
import { createFakePrismaService } from '../../prisma/prisma.fake';

describe('OrganizationsService (unit)', () => {
  let service: OrganizationsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    prisma = createFakePrismaService();
    const moduleRef = await Test.createTestingModule({
      providers: [OrganizationsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(OrganizationsService);
  });

  describe('create + listMine', () => {
    it('creates an organization and makes the creator its owner', async () => {
      const membership = await service.create('usr_1', 'Clientes VIP');

      expect(membership.role).toBe('owner');
      expect(membership.organization).toMatchObject({ name: 'Clientes VIP' });
      expect(membership.organization.slug).toContain('clientes-vip');
    });

    it('lists only the organizations the given user belongs to', async () => {
      await service.create('usr_1', 'Org de Ana');
      await service.create('usr_2', 'Org de Luis');

      const mine = await service.listMine('usr_1');
      expect(mine).toHaveLength(1);
      expect(mine[0].organization.name).toBe('Org de Ana');
    });

    it('gives two same-named organizations different slugs', async () => {
      const a = await service.create('usr_1', 'Acme');
      const b = await service.create('usr_2', 'Acme');
      expect(a.organization.slug).not.toBe(b.organization.slug);
    });
  });

  describe('update', () => {
    it('lets an owner rename the organization', async () => {
      const { organization } = await service.create('usr_1', 'Nombre viejo');
      const updated = await service.update(organization.id, 'owner', 'Nombre nuevo');
      expect(updated.name).toBe('Nombre nuevo');
      expect(updated.slug).toBe(organization.slug);
    });

    it('lets an admin rename the organization', async () => {
      const { organization } = await service.create('usr_1', 'Nombre viejo');
      const updated = await service.update(organization.id, 'admin', 'Nombre nuevo');
      expect(updated.name).toBe('Nombre nuevo');
    });

    it('rejects a plain member trying to rename', async () => {
      const { organization } = await service.create('usr_1', 'Nombre viejo');
      await expect(service.update(organization.id, 'member', 'Nombre nuevo')).rejects.toMatchObject(
        { response: { error: 'insufficient_role' } },
      );
    });
  });

  describe('listMembers', () => {
    it('includes the creator as owner, joined with their user info', async () => {
      const user = await prisma.user.create({
        data: { email: 'ana@example.com', name: 'Ana Pérez', passwordHash: 'irrelevant' },
      });
      const { organization } = await service.create(user.id, 'Clientes VIP');

      const members = await service.listMembers(organization.id);
      expect(members).toHaveLength(1);
      expect(members[0]).toMatchObject({
        userId: user.id,
        email: 'ana@example.com',
        name: 'Ana Pérez',
        role: 'owner',
      });
    });
  });
});
