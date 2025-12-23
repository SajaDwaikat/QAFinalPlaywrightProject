import { test, expect } from '@playwright/test';
import { ProductsPage } from '../../pages/products.page';

test.describe('Catalog - Search', () => {
  test('Scenario 1: search returns results', async ({ page }) => {
    const products = new ProductsPage(page);

    await products.search(process.env.SEARCH_TERM || 'pliers');
    await expect(products.productCards.first(), 'No search results visible').toBeVisible({ timeout: 60_000 });
  });

  test('Scenario 2: search with gibberish returns no results (or empty state)', async ({ page }) => {
    const products = new ProductsPage(page);

    await products.search('zzzzzzzzzzzzzzzz');
    await products.expectNoResults();
  });
});
