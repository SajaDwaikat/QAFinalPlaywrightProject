import { test, expect } from '@playwright/test';
import { ProductsPage } from '../../pages/products.page';
import { CartPage } from '../../pages/CartPage';

test.describe('Cart - Remove', () => {
  test('Scenario: add one item then remove it', async ({ page }) => {
    const products = new ProductsPage(page);
    const cart = new CartPage(page);

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await products.addFirstProductToCart();

  
    await cart.gotoCart(30_000);

    await cart.expectHasAnyItem(60_000);

    const before = await cart.getItemCount();

    
    await cart.removeFirstItem(60_000);

    const after = await cart.getItemCount();

    expect(after).toBeLessThan(before);
  });
});
