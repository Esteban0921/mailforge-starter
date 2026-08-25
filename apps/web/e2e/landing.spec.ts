import { expect, test } from '@playwright/test';

/**
 * Smoke coverage for the landing page. The page must render with zero
 * backend dependency: no API call, no database, nothing.
 */
test.describe('landing', () => {
  test('renders the hero and core copy', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/MailForge/);

    const hero = page.getByTestId('hero-title');
    await expect(hero).toBeVisible();
    await expect(hero).toContainText('email marketing');

    await expect(page.getByText('Estado del sistema')).toBeVisible();
    await expect(
      page.getByText('Desarrollado por Esteban y Joseph', { exact: false }),
    ).toBeVisible();
  });

  test('shows the honest system status readout', async ({ page }) => {
    await page.goto('/');

    const status = page.getByRole('list').filter({ hasText: 'api' });
    await expect(status).toBeVisible();
    await expect(status).toContainText('operativo');
    await expect(status).toContainText('fase 1');
  });
});
