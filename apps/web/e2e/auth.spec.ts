import { expect, test } from '@playwright/test';

/**
 * Full mock-auth journey: register -> dashboard -> logout -> login.
 * Runs entirely against the browser localStorage mock; no backend needed.
 */
test.describe('auth flow (mock)', () => {
  const EMAIL = 'ana@example.com';
  const PASSWORD = 'contraseña-segura-123';

  async function fillRegister(page: import('@playwright/test').Page): Promise<void> {
    await page.goto('/register');
    await page.getByLabel('Nombre').fill('Ana Pérez');
    await page.getByLabel('Email').fill(EMAIL);
    await page.getByLabel('Contraseña').fill(PASSWORD);
    await page.getByRole('button', { name: 'Crear cuenta' }).click();
  }

  test('register lands on the protected dashboard', async ({ page }) => {
    await fillRegister(page);

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByTestId('dashboard-title')).toBeVisible();
    await expect(page.getByTestId('dashboard-nav')).toBeVisible();
    await expect(page.getByTestId('dashboard-user')).toHaveText('Ana Pérez');
  });

  test('dashboard redirects anonymous visitors to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('wrong password shows a friendly error and stays on login', async ({ page }) => {
    await fillRegister(page);
    await page.getByTestId('logout-button').click();
    await expect(page).toHaveURL(/\/login$/);

    await page.goto('/login');
    await page.getByLabel('Email').fill(EMAIL);
    await page.getByLabel('Contraseña').fill('contraseña-incorrecta');
    await page.getByRole('button', { name: 'Entrar' }).click();

    // Scoped to the form: Next's route announcer is also role="alert" and would
    // make a bare getByRole('alert') ambiguous under strict mode.
    await expect(page.locator('form').getByRole('alert')).toContainText('incorrectos');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('register -> logout -> login round trip works', async ({ page }) => {
    await fillRegister(page);
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.getByTestId('logout-button').click();
    await expect(page).toHaveURL(/\/login$/);

    await page.getByLabel('Email').fill(EMAIL.toUpperCase());
    await page.getByLabel('Contraseña').fill(PASSWORD);
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByTestId('dashboard-user')).toHaveText('Ana Pérez');
  });

  test('dashboard shows the real module cards, not a placeholder', async ({ page }) => {
    await fillRegister(page);
    await expect(page).toHaveURL(/\/dashboard$/);

    for (const name of ['Audiencias', 'Campañas', 'Automatizaciones', 'Tracking']) {
      await expect(page.getByTestId(`module-card-${name}`)).toBeVisible();
    }
  });

  test('disabled nav items are inert, not fake links', async ({ page }) => {
    await fillRegister(page);
    await expect(page).toHaveURL(/\/dashboard$/);

    for (const label of ['Audiencias', 'Campañas', 'Automatizaciones']) {
      const item = page.getByTestId(`nav-${label}`);
      await expect(item).toHaveAttribute('aria-disabled', 'true');
      await expect(item).not.toHaveAttribute('href', /.+/);
    }
  });

  test('duplicate email is flagged on the email field, not as a generic error', async ({
    page,
  }) => {
    await fillRegister(page);
    await page.getByTestId('logout-button').click();
    await expect(page).toHaveURL(/\/login$/);

    await fillRegister(page);
    await expect(page).toHaveURL(/\/register$/);
    await expect(page.getByLabel('Email')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByText('ya tiene cuenta')).toBeVisible();
  });
});
