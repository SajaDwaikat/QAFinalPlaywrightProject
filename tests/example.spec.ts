import { test, expect } from '@playwright/test';

test('open homepage', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Practice Software Testing/i);
});
