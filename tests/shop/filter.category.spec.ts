import { test, expect } from '@playwright/test';
import { ProductsPage } from '../../pages/products.page';

test.describe('Catalog - Filter By Category', () => {
  test('Scenario 1: filter by a valid category slug', async ({ page }) => {
    const products = new ProductsPage(page);

    const slug = process.env.CATEGORY_SLUG || 'hand-tools';
    await products.filterByCategorySlug(slug);

    await expect(products.productCards.first(), 'Expected products to be visible for a valid category').toBeVisible({ timeout: 60_000 });
    await expect(page, 'URL should include the category slug').toHaveURL(new RegExp(`/category/${slug}`));
  });

  test('Scenario 2: invalid category slug shows empty / not-found state', async ({ page }) => {
    const products = new ProductsPage(page);

    const invalidSlug = 'non-existing-category-xyz';
    await products.filterByCategorySlug(invalidSlug);

    await products.expectNoResults();
  });
});
