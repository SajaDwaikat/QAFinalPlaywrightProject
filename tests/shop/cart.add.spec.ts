import { test } from '@playwright/test';
import { ProductsPage } from '../../pages/products.page';
import { CartPage } from '../../pages/CartPage';

test.describe('Cart - Add', () => {
  test('Scenario 1: add first product to cart', async ({ page }) => {
    const products = new ProductsPage(page);
    const cart = new CartPage(page);

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await products.addFirstProductToCart();

    await cart.gotoCart(30_000);
    await cart.expectHasAnyItem(60_000);

    
  });
});
