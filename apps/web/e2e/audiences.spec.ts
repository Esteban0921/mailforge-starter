import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

/**
 * Full mock-audiences journey: create audience -> add subscriber -> import
 * CSV -> filter by status. Runs entirely against the browser localStorage
 * mock; no backend needed. Each test registers its own user for isolation.
 */
test.describe('audiences flow (mock)', () => {
  async function registerAndGoToAudiences(page: Page): Promise<void> {
    await page.goto('/register');
    await page.getByLabel('Nombre').fill('Ana Pérez');
    await page
      .getByLabel('Email')
      .fill(`ana-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`);
    await page.getByLabel('Contraseña').fill('contraseña-segura-123');
    await page.getByRole('button', { name: 'Crear cuenta' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.getByTestId('nav-Audiencias').click();
    await expect(page).toHaveURL(/\/dashboard\/audiences$/);
  }

  async function createAudience(page: Page, name: string): Promise<void> {
    await page.getByLabel('Nombre').fill(name);
    await page.getByRole('button', { name: 'Nueva audiencia' }).click();
    await expect(page.getByTestId(`audience-card-${name}`)).toBeVisible();
  }

  test('the dashboard module card links through to audiences', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel('Nombre').fill('Ana Pérez');
    await page.getByLabel('Email').fill(`ana-${Date.now()}@example.com`);
    await page.getByLabel('Contraseña').fill('contraseña-segura-123');
    await page.getByRole('button', { name: 'Crear cuenta' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await expect(page.getByTestId('module-card-Audiencias')).toContainText('Disponible');
    await page.getByTestId('module-card-Audiencias').click();
    await expect(page).toHaveURL(/\/dashboard\/audiences$/);
  });

  test('empty state, then create an audience and open its detail page', async ({ page }) => {
    await registerAndGoToAudiences(page);

    await expect(page.getByText('Todavía no hay ninguna audiencia.')).toBeVisible();

    await createAudience(page, 'Clientes VIP');
    await expect(page.getByTestId('audience-card-Clientes VIP')).toContainText('0 suscriptores');

    await page.getByTestId('audience-card-Clientes VIP').click();
    await expect(page).toHaveURL(/\/dashboard\/audiences\/aud_/);
    await expect(page.getByRole('heading', { name: 'Clientes VIP' })).toBeVisible();
    await expect(page.getByText('Sin suscriptores todavía.')).toBeVisible();
  });

  test('add a subscriber manually, and reject a duplicate email', async ({ page }) => {
    await registerAndGoToAudiences(page);
    await createAudience(page, 'Clientes VIP');
    await page.getByTestId('audience-card-Clientes VIP').click();

    await page.getByLabel('Email').fill('luis@example.com');
    await page.getByLabel('Nombre').fill('Luis');
    await page.getByLabel('Apellido').fill('Gómez');
    await page.getByRole('button', { name: 'Añadir suscriptor' }).click();

    const list = page.getByTestId('subscriber-list');
    await expect(list.getByText('luis@example.com')).toBeVisible();
    await expect(list.getByText('Luis Gómez')).toBeVisible();
    await expect(list.getByText('Suscrito')).toBeVisible();

    // Same email again: rejected inline, not silently duplicated.
    await page.getByLabel('Email').fill('luis@example.com');
    await page.getByRole('button', { name: 'Añadir suscriptor' }).click();
    await expect(
      page.getByText('Ya hay un suscriptor con ese email en esta audiencia.'),
    ).toBeVisible();
  });

  test('import a CSV: valid rows land, invalid/duplicate rows are skipped and reported', async ({
    page,
  }) => {
    await registerAndGoToAudiences(page);
    await createAudience(page, 'Clientes VIP');
    await page.getByTestId('audience-card-Clientes VIP').click();

    // Pre-seed one subscriber so the CSV below has a real duplicate to skip.
    await page.getByLabel('Email').fill('ana@example.com');
    await page.getByRole('button', { name: 'Añadir suscriptor' }).click();
    await expect(page.getByTestId('subscriber-list').getByText('ana@example.com')).toBeVisible();

    const csv = [
      'email,firstName,lastName',
      'luis@example.com,Luis,Gómez',
      'no-es-email,X,Y',
      'ana@example.com,Ana,Duplicada',
    ].join('\n');

    await page.locator('input[type="file"]').setInputFiles({
      name: 'subscribers.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csv, 'utf-8'),
    });

    await expect(page.getByText('1 suscriptor(es) importado(s).')).toBeVisible();
    await expect(page.getByText('2 fila(s) omitida(s)')).toBeVisible();
    await expect(page.getByText('Línea 3: email inválido')).toBeVisible();
    await expect(page.getByText('Línea 4: email duplicado')).toBeVisible();

    const list = page.getByTestId('subscriber-list');
    await expect(list.getByText('luis@example.com')).toBeVisible();
    await expect(list.getByText('ana@example.com')).toBeVisible();
  });

  test('status filters narrow the subscriber list', async ({ page }) => {
    await registerAndGoToAudiences(page);
    await createAudience(page, 'Clientes VIP');
    await page.getByTestId('audience-card-Clientes VIP').click();

    await page.getByLabel('Email').fill('luis@example.com');
    await page.getByRole('button', { name: 'Añadir suscriptor' }).click();
    await expect(page.getByTestId('subscriber-list').getByText('luis@example.com')).toBeVisible();

    const filters = page.getByTestId('subscriber-status-filter');

    // Every subscriber lands as "subscribed" (manual add asserts consent),
    // so the "Pendiente" filter must find nothing.
    await filters.getByRole('button', { name: 'Pendiente' }).click();
    await expect(page.getByText('Sin suscriptores con ese estado todavía.')).toBeVisible();

    await filters.getByRole('button', { name: 'Suscrito' }).click();
    await expect(page.getByTestId('subscriber-list').getByText('luis@example.com')).toBeVisible();

    await filters.getByRole('button', { name: 'Todos', exact: true }).click();
    await expect(page.getByTestId('subscriber-list').getByText('luis@example.com')).toBeVisible();
  });
});
