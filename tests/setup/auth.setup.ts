import { test as setup, expect } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

setup('create auth storage state', async ({ page, context }) => {
  setup.setTimeout(120_000);

  const email = process.env.USER_EMAIL!;
  const password = process.env.USER_PASSWORD!;

  if (!email || !password) {
    throw new Error('Missing USER_EMAIL or USER_PASSWORD in .env');
  }

  await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });

  await page.getByLabel('Email address').fill(email);
  await page.locator('[data-test="password"]').fill(password);

  await page.getByRole('button', { name: /^login$/i }).click();

  await Promise.race([
    page.waitForURL(/\/account/i, { timeout: 60_000 }).catch(() => null),
    page.waitForURL(/\/$/i, { timeout: 60_000 }).catch(() => null),
    page
      .locator('a:has-text("My account"), a:has-text("Account")')
      .first()
      .waitFor({ state: 'visible', timeout: 60_000 })
      .catch(() => null),
    page
      .locator('[data-test="nav-account"], [data-test="nav-user"]')
      .first()
      .waitFor({ state: 'visible', timeout: 60_000 })
      .catch(() => null),
  ]);

  await context.storageState({ path: 'utils/storageState.json' });

  const state = await context.storageState();
  expect(state.cookies.length + state.origins.length).toBeGreaterThan(0);
});