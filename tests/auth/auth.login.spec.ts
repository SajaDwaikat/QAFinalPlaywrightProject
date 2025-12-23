import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import { LoginPage } from '../../pages/LoginPage';

dotenv.config();

test.use({
  storageState: { cookies: [], origins: [] }, // Force logged-out
});

test.describe('Auth - Login', () => {
  test('invalid login shows error', async ({ page }) => {
    const login = new LoginPage(page);

    await login.goto();
    await login.login('test@test.com', '123456');
    await login.assertInvalidLogin();
  });

  test('valid login redirects and shows logged-in UI', async ({ page }) => {
    const email = process.env.USER_EMAIL;
    const password = process.env.USER_PASSWORD;

    test.skip(!email || !password, 'Missing USER_EMAIL/USER_PASSWORD in .env');

    const login = new LoginPage(page);
    await login.goto();
    await login.login(email!, password!);

    // Generic post-login signals (Toolshop demo + common nav patterns)
    const postLoginSignals = [
      page.locator('[data-test="nav-account"], [data-test="nav-user"]').first(),
      page.getByRole('link', { name: /my account|account|profile/i }).first(),
      page.locator('[data-test="logout"]').first(),
    ];

    let anyVisible = false;
    for (const loc of postLoginSignals) {
      if (await loc.isVisible().catch(() => false)) {
        anyVisible = true;
        break;
      }
    }

    // Fallback: URL no longer includes login
    const urlOk = !/login/i.test(page.url());
    expect(anyVisible || urlOk).toBeTruthy();
  });
});
