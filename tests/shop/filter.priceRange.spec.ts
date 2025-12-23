import { test, expect } from '@playwright/test';
import { ProductsPage } from '../../pages/products.page';

test.describe('Catalog - Price Range', () => {
  test('Scenario 1: filter by a price range returns prices within range (best effort)', async ({ page }) => {
    const products = new ProductsPage(page);

    const min = process.env.PRICE_MIN || '1';
    const max = process.env.PRICE_MAX || '50';

    await products.setPriceRange(min, max);

    const prices = await products.getVisibleProductPrices(6);
    if (prices.length > 0) {
      const minN = Number(min);
      const maxN = Number(max);
      for (const p of prices) {
        expect(p, `Price ${p} should be between ${minN} and ${maxN}`).toBeGreaterThanOrEqual(minN);
        expect(p, `Price ${p} should be between ${minN} and ${maxN}`).toBeLessThanOrEqual(maxN);
      }
    } else {
      await products.expectNoResults();
    }
  });

  test('Scenario 2: very high min price should return no results / empty state', async ({ page }) => {
    const products = new ProductsPage(page);

    await products.setPriceRange('9999', '10000');
    await products.expectNoResults();
  });
});
