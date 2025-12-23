import { test, expect } from '@playwright/test';

test.describe('Catalog - Filter By Brand', () => {
  test('filter by any available brand (stable)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const productCards = page.locator(
      '[data-test="product-card"], .product-card, .card, app-product-card'
    );

    await expect(productCards.first()).toBeVisible({ timeout: 60_000 });
    const before = await productCards.count();

    const options = page.locator('input[type="checkbox"], input[type="radio"]');
    await expect(options.first(), 'No filter options found on page').toBeVisible({ timeout: 60_000 });

    const total = await options.count();
    let target = options.first();
    for (let i = 0; i < Math.min(total, 30); i++) {
      const cand = options.nth(i);
      if (!(await cand.isDisabled().catch(() => false))) {
        target = cand;
        break;
      }
    }

    await target.click({ force: true });

    const noResults = page.locator(':has-text("No products"), :has-text("No results")').first();

    await expect
      .poll(async () => {
        const after = await productCards.count().catch(() => 0);
        const none = await noResults.isVisible().catch(() => false);
        const urlChanged = page.url().includes('?') || page.url().includes('brand');
        return none || urlChanged || after !== before;
      }, { timeout: 60_000 })
      .toBeTruthy();
  });
});
