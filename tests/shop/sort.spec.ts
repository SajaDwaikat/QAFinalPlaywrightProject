import { test, expect } from '@playwright/test';
import { ProductsPage } from '../../pages/products.page';

test.describe('Catalog - Sort', () => {
  test('Scenario 1: sort A-Z (validate titles order)', async ({ page }) => {
    const products = new ProductsPage(page);

    await products.sortBy(process.env.SORT_AZ || 'Name (A - Z)');
    await expect(products.productCards.first()).toBeVisible({ timeout: 60_000 });

    const titles = await products.getVisibleProductTitles(8);
    // Validate only if we have enough data
    if (titles.length >= 2) {
      products.assertSortedTitlesAZ(titles);
    }
  });

  test('Scenario 2: sort Price High to Low (validate prices order)', async ({ page }) => {
    const products = new ProductsPage(page);

    await products.sortBy(process.env.SORT_PRICE_DESC || 'Price (High - Low)');
    await expect(products.productCards.first()).toBeVisible({ timeout: 60_000 });

    const prices = await products.getVisibleProductPrices(8);
    if (prices.length >= 2) {
      products.assertSortedNumbersDesc(prices);
    }
  });
});
