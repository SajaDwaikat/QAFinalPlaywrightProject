import { expect, type Locator, type Page } from '@playwright/test';

export class CartPage {
  readonly page: Page;

  readonly cartLink: Locator;
  readonly cartTitle: Locator;

  readonly cartItemRows: Locator;
  readonly emptyCartText: Locator;
  readonly removeButtons: Locator;
  readonly cartBadgeQty: Locator;

  constructor(page: Page) {
    this.page = page;

    // Cart icon/link in header
    this.cartLink = page.locator(
      [
        'a[href="/cart"]',
        'a[href$="/cart"]',
        'a[aria-label*="cart" i]',
        'button[aria-label*="cart" i]',
        '[data-test="nav-cart"]',
        '[data-test="cart"]',
        // fallback: icon container near header
        'header a:has(svg)',
        'header button:has(svg)',
      ].join(', ')
    ).first();

    // Headings on cart page (Toolshop demo varies)
    this.cartTitle = page.locator(
      [
        'h1:has-text("Shopping cart")',
        'h1:has-text("Shopping Cart")',
        'h2:has-text("Shopping cart")',
        'h2:has-text("Shopping Cart")',
        'h1:has-text("Cart")',
        '[data-test="cart-title"]',
        'main h1',
      ].join(', ')
    ).first();

    // Rows/items (table or list)
    this.cartItemRows = page.locator(
  [
    // ✅ Toolshop checkout: count ONLY product rows (rows that have the remove X button)
    'table tbody tr:has(a.btn.btn-danger)',

    // fallbacks
    '[data-test="cart-item"]',
    '[data-test="cart-item-row"]',
    '.cart-item',
    '.shopping-cart-item',
    'app-cart-item',
  ].join(', ')
);
    // Cart badge quantity (red circle)
this.cartBadgeQty = page.locator(
  [
    '[data-test="cart-quantity"]',
    '[data-test="cart-count"]',
    '.cart-quantity',
    '.badge:visible',
    'a[aria-label*="cart" i] .badge',
    'a[href="/checkout"] .badge',
    'a[href="/checkout"] span',
  ].join(', ')
).first();


    // Empty state
   this.emptyCartText = page.locator(
  [
    '[data-test="cart-empty"]',
    ':has-text("The cart is empty")',
    ':has-text("Nothing to display")',
    ':has-text("Your cart is empty")',
    ':has-text("your cart is empty")',
    ':has-text("Cart is empty")',
    ':has-text("No items")',
    ':has-text("no items")',
    '.alert:has-text("empty")',
  ].join(', ')
).first();


    // Remove buttons
    this.removeButtons = page.locator(
  [
    // Toolshop checkout remove (anchor button)
    'a.btn.btn-danger',

    // existing fallbacks
    '[data-test="remove"]',
    '[data-test="delete"]',
    'button:has-text("Remove")',
    'button:has-text("Delete")',
    'button[aria-label*="remove" i]',
    'button[aria-label*="delete" i]',
    'a[aria-label*="remove" i]',
    'a[aria-label*="delete" i]',
  ].join(', ')
);

  }

  private async closeOverlaysIfAny(): Promise<void> {
    const candidates = [
      'button:has-text("Accept")',
      'button:has-text("I agree")',
      'button:has-text("Agree")',
      'button:has-text("OK")',
      'button:has-text("Close")',
      'button[aria-label*="close" i]',
    ];

    for (const sel of candidates) {
      const btn = this.page.locator(sel).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click().catch(() => {});
        await this.page.waitForTimeout(150);
      }
    }
    await this.page.keyboard.press('Escape').catch(() => {});
  }

  private async isCartUIVisible(): Promise<boolean> {
    const url = this.page.url();

    // ✅ إذا وصلنا URL تبع cart/checkout اعتبريه نجاح (حتى لو العنوان تغيّر)
    if (url.includes('/cart') || url.includes('/checkout')) return true;

    const titleOk = await this.cartTitle.isVisible().catch(() => false);
    if (titleOk) return true;

    const hasRow = await this.cartItemRows.first().isVisible().catch(() => false);
    if (hasRow) return true;

    const emptyOk = await this.emptyCartText.isVisible().catch(() => false);
    return emptyOk;
  }

  private async waitForCartUI(timeoutMs = 30_000): Promise<void> {
    await expect.poll(async () => this.isCartUIVisible(), { timeout: timeoutMs }).toBeTruthy();
  }

  async gotoCart(timeoutMs = 30_000): Promise<void> {
    await this.closeOverlaysIfAny();

    // ✅ 1) الأفضل: دخول مباشر على /cart (أكثر استقرارًا من click)
    await this.page.goto('/cart', { waitUntil: 'domcontentloaded' }).catch(() => {});
    await this.page.waitForTimeout(300);
    if (await this.isCartUIVisible()) return;

    // ✅ 2) fallback: بعض النسخ بتودّي على /checkout
    await this.page.goto('/checkout', { waitUntil: 'domcontentloaded' }).catch(() => {});
    await this.page.waitForTimeout(300);
    if (await this.isCartUIVisible()) return;

    // ✅ 3) آخر حل: click على أيقونة الكارت
    if (await this.cartLink.isVisible().catch(() => false)) {
      await this.cartLink.click({ force: true }).catch(() => {});
      await this.page.waitForLoadState('domcontentloaded').catch(() => {});
      await this.page.waitForTimeout(300);
      await this.waitForCartUI(timeoutMs);
      return;
    }

    // Hard fail
    throw new Error(`Could not reach cart UI. Current URL: ${this.page.url()}`);
  }

  async getItemCount(): Promise<number> {
    return await this.cartItemRows.count().catch(() => 0);
  }

 async expectHasAnyItem(timeoutMs = 60_000): Promise<void> {
  await expect
    .poll(async () => {
      // 1) if remove button exists => we definitely have an item
      const hasRemove = await this.removeButtons.first().isVisible().catch(() => false);

      // 2) if cart badge number > 0
      let badgeNum = 0;
      try {
        const txt = (await this.cartBadgeQty.innerText().catch(() => ''))?.trim();
        badgeNum = Number((txt || '').replace(/[^\d]/g, '')) || 0;
      } catch {
        badgeNum = 0;
      }

      // 3) fallback: any cart rows selector
      const rows = await this.getItemCount();

      return { hasRemove, badgeNum, rows, url: this.page.url() };
    }, { timeout: timeoutMs })
    .toMatchObject({
      // نجاح إذا تحقق واحد من الثلاثة
      // (ما بنقدر نحط OR داخل toMatchObject، فبنستخدم شرطنا تحت)
    });

  // الشرط الحقيقي (OR)
  await expect
    .poll(async () => {
      const hasRemove = await this.removeButtons.first().isVisible().catch(() => false);

      let badgeNum = 0;
      try {
        const txt = (await this.cartBadgeQty.innerText().catch(() => ''))?.trim();
        badgeNum = Number((txt || '').replace(/[^\d]/g, '')) || 0;
      } catch {
        badgeNum = 0;
      }

      const rows = await this.getItemCount();
      return hasRemove || badgeNum > 0 || rows > 0;
    }, { timeout: timeoutMs })
    .toBeTruthy();
}


  async expectEmpty(timeoutMs = 60_000): Promise<void> {
    await expect
      .poll(async (): Promise<boolean> => {
        const rows = await this.getItemCount();
        const empty = await this.emptyCartText.isVisible().catch(() => false);
        return rows === 0 || empty === true;
      }, { timeout: timeoutMs })
      .toBeTruthy();
  }

  async removeFirstItem(timeoutMs = 60_000): Promise<void> {
    const before = await this.getItemCount();
    if (before === 0) return;

    const firstRow = this.cartItemRows.first();
 const removeInRow = firstRow.locator(
  [
    'a.btn.btn-danger',          // ✅ this is the real remove on checkout
    '[data-test="remove"]',
    '[data-test="delete"]',
    'button:has-text("Remove")',
    'button:has-text("Delete")',
  ].join(', ')
).first();


    if (await removeInRow.isVisible().catch(() => false)) {
      await removeInRow.click({ force: true });
    } else {
      await this.removeButtons.first().click({ force: true });
    }

    // confirm dialog (if exists)
    const confirm = this.page.locator(
      ['button:has-text("Confirm")', 'button:has-text("Yes")', 'button:has-text("OK")'].join(', ')
    ).first();
    if (await confirm.isVisible().catch(() => false)) {
      await confirm.click().catch(() => {});
    }

    await expect
      .poll(async (): Promise<boolean> => {
        const after = await this.getItemCount();
        const empty = await this.emptyCartText.isVisible().catch(() => false);
        return empty || after < before;
      }, { timeout: timeoutMs })
      .toBeTruthy();
  }
}
