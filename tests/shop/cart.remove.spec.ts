import { test, expect } from '@playwright/test';
import { ProductsPage } from '../../pages/products.page';
import { CartPage } from '../../pages/CartPage';

test.describe('Cart - Remove', () => {
  test('Scenario: add one item then remove it', async ({ page }) => {
    const products = new ProductsPage(page);
    const cart = new CartPage(page);

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // ✅ استخدمي نفس الإضافة اللي نجّحت Scenario 1 عندك
    await products.addFirstProductToCart();

    // go to checkout (cart)
    await cart.gotoCart(30_000);

    // confirm it has item (using robust checks now)
    await cart.expectHasAnyItem(60_000);

    const before = await cart.getItemCount();

    // if rows selector didn't match but remove exists, we still remove
    await cart.removeFirstItem(60_000);

    const after = await cart.getItemCount();

    // even if selectors for rows are weak, "after" might still be 0 safely
    expect(after).toBeLessThan(before);
  });
});
