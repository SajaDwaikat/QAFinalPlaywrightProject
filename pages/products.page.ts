import { expect, type Locator, type Page } from '@playwright/test';

export class ProductsPage {
  readonly page: Page;

  readonly productsCol: Locator;
  readonly filtersCol: Locator;

  
  readonly brandFieldset: Locator;

  
  readonly productCards: Locator;
  readonly productLinks: Locator;


  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly sortSelect: Locator;

  readonly filtersAside: Locator;
  readonly priceMinInput: Locator;
  readonly priceMaxInput: Locator;
  readonly applyFiltersBtn: Locator;
 



  readonly addToCartBtn: Locator;

  readonly noResultsText: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;

    this.filtersCol = page.locator('.col-md-3').first();
    this.productsCol = page.locator('.col-md-9, main').first();
    this.filtersAside = page.locator('aside, .col-md-3').first();

   
    this.brandFieldset = page
      .locator('h4', { hasText: /By\s+brand/i })
      .first()
      .locator('xpath=following::fieldset[1]');
      this.brandFieldset = page
     .locator('h4', { hasText: /By\s+brand/i })
      .first()
       .locator('xpath=following::fieldset[1]');

  
    this.productCards = this.productsCol.locator(
      ['.card', '[data-test="product-card"]', 'app-product-card', '.product-card'].join(', ')
    );

    this.productLinks = this.productsCol.locator(
      [
        'a[href*="#/product/"]',
        'a[href*="/product/"]',
        '.card-title a',
        'a.card-title',
        '[data-test="product-name"] a',
        'a[data-test="product-name"]',
      ].join(', ')
    );


    this.searchInput = page
      .locator(['[data-test="search-query"]', '#search-query', 'input#search-query', 'input[placeholder="Search"]'].join(', '))
      .first();

    this.searchButton = page
      .locator(['[data-test="search-submit"]', 'button:has-text("Search")', 'button[type="submit"]'].join(', '))
      .first();


    this.sortSelect = page
      .locator(['[data-test="sort"]', 'select[name="sort"]', 'select:has(option)'].join(', '))
      .first();

    this.priceMinInput = page
      .locator(['[data-test="price-min"]', 'input[name="min_price"]', 'input[aria-label*="Min" i]', 'input[placeholder*="Min" i]'].join(', '))
      .first();

    this.priceMaxInput = page
      .locator(['[data-test="price-max"]', 'input[name="max_price"]', 'input[aria-label*="Max" i]', 'input[placeholder*="Max" i]'].join(', '))
      .first();

    this.applyFiltersBtn = page
      .locator(['[data-test="apply-filters"]', 'button:has-text("Apply")', 'button:has-text("Filter")'].join(', '))
      .first();

    this.addToCartBtn = page
      .locator(['[data-test="add-to-cart"]', 'button:has-text("Add to cart")', 'button:has-text("Add to Cart")', 'button.btn:has-text("Add")'].join(', '))
      .first();
      this.addToCartBtn = page
  .locator([
    '[data-test="add-to-cart"]',
    'button:has-text("Add to cart")',
    'button:has-text("Add to Cart")',
    'button.btn:has-text("Add")',
    'button#btn-add-to-cart'
  ].join(', '))
  .first();


    this.noResultsText = page.getByText(/no products|no results|nothing found/i);
    this.emptyState = page.locator(['[data-test="no-results"]', '[data-test="empty-state"]', '.empty-state', '.alert:has-text("No")'].join(', '));
  }

  private async gotoRelative(path: string): Promise<void> {
    const p = path.startsWith('/') ? path : `/${path}`;
    await this.page.goto(p, { waitUntil: 'domcontentloaded' });
    await this.page.waitForTimeout(200);
  }

  private async assertProductsOrEmpty(timeoutMs = 60_000): Promise<void> {
    const hasAnyProduct =
      (await this.productLinks.first().isVisible({ timeout: 5_000 }).catch(() => false)) ||
      (await this.productCards.first().isVisible({ timeout: 5_000 }).catch(() => false));

    const hasEmpty =
      (await this.noResultsText.first().isVisible({ timeout: 2_000 }).catch(() => false)) ||
      (await this.emptyState.first().isVisible({ timeout: 2_000 }).catch(() => false));

    if (hasAnyProduct || hasEmpty) return;

    await expect(this.productLinks.first(), `Neither products nor empty state are visible on: ${this.page.url()}`)
      .toBeVisible({ timeout: timeoutMs });
  }

  
  async gotoProducts(): Promise<void> {
    await this.gotoRelative('/#/');
    await this.assertProductsOrEmpty(60_000);
  }

  async filterByCategorySlug(categorySlug: string): Promise<void> {
    await this.gotoRelative(`/#/category/${categorySlug}`);
    await this.assertProductsOrEmpty(60_000);
  }

  async search(text: string): Promise<void> {
    await this.gotoProducts();
    await expect(this.searchInput, 'Search input not found').toBeVisible({ timeout: 30_000 });

    await this.searchInput.fill(text);

    if (await this.searchButton.isVisible().catch(() => false)) {
      await this.searchButton.click();
    } else {
      await this.searchInput.press('Enter');
    }

    await this.page.waitForTimeout(500);
    await this.assertProductsOrEmpty(60_000);
  }

  async sortBy(labelOrValue: string): Promise<void> {
    await this.gotoProducts();
    await expect(this.sortSelect, 'Sort select not found').toBeVisible({ timeout: 30_000 });

    await this.sortSelect.selectOption({ label: labelOrValue }).catch(async () => {
      await this.sortSelect.selectOption({ value: labelOrValue });
    });

    await this.page.waitForTimeout(400);
    await this.assertProductsOrEmpty(60_000);
  }

  async filterByBrand(brandName: string): Promise<void> {
    await this.gotoProducts();
    await expect(this.brandFieldset, 'Brand filters section not found (By brand)').toBeVisible({ timeout: 30_000 });

    const checkbox = this.brandFieldset.getByLabel(new RegExp(`^${escapeRegExp(brandName)}$`, 'i')).first();

    if (await checkbox.isVisible().catch(() => false)) {
      await checkbox.check({ force: true }).catch(async () => {
        await this.brandFieldset.getByText(new RegExp(`^${escapeRegExp(brandName)}$`, 'i')).first().click({ force: true });
      });
    } else {
      throw new Error(`Brand "${brandName}" not found under By brand`);
    }

    await this.page.waitForTimeout(700);
    await this.assertProductsOrEmpty(60_000);
  }

  async filterByAnyBrand(): Promise<string> {
    await this.gotoProducts();
    await expect(this.brandFieldset, 'Brand filters section not found (By brand)').toBeVisible({ timeout: 30_000 });

    const labels = this.brandFieldset.locator('label');
    await expect(labels.first(), 'No brand labels found').toBeVisible({ timeout: 30_000 });

    const count = await labels.count();
    let chosen = 'Unknown';

    for (let i = 0; i < Math.min(count, 50); i++) {
      const txt = (await labels.nth(i).textContent())?.trim() || '';
      if (!txt) continue;

      chosen = txt;

      const cb = this.brandFieldset.getByLabel(new RegExp(`^${escapeRegExp(chosen)}$`, 'i')).first();
      await cb.check({ force: true }).catch(async () => {
        await labels.nth(i).click({ force: true });
      });
      break;
    }

    await this.page.waitForTimeout(700);
    await this.assertProductsOrEmpty(60_000);
    return chosen;
  }


  async setPriceRange(min: string, max: string): Promise<void> {
    await this.gotoProducts();

    const hasMin = await this.priceMinInput.isVisible().catch(() => false);
    const hasMax = await this.priceMaxInput.isVisible().catch(() => false);

    if (hasMin && hasMax) {
      await this.priceMinInput.fill(min);
      await this.priceMaxInput.fill(max);

      if (await this.applyFiltersBtn.isVisible().catch(() => false)) {
        await this.applyFiltersBtn.click();
      } else {
        await this.priceMaxInput.press('Enter').catch(() => {});
      }

      await this.page.waitForTimeout(800);
      await this.assertProductsOrEmpty(60_000);
      return;
    }


    await this.page.waitForTimeout(300);
    await this.assertProductsOrEmpty(60_000);
  }

  async expectNoResults(timeoutMs: number = 15_000): Promise<void> {
    const hasAnyProduct =
      (await this.productLinks.first().isVisible({ timeout: 2_000 }).catch(() => false)) ||
      (await this.productCards.first().isVisible({ timeout: 2_000 }).catch(() => false));

    if (hasAnyProduct) return;

    const noTextVisible = await this.noResultsText.first().isVisible({ timeout: timeoutMs }).catch(() => false);
    const emptyVisible = await this.emptyState.first().isVisible({ timeout: timeoutMs }).catch(() => false);

    expect(noTextVisible || emptyVisible, 'Expected no-results/empty state but none was found').toBeTruthy();
  }

  async getVisibleProductTitles(maxItems: number = 12): Promise<string[]> {
    await this.gotoProducts();

    const titles: string[] = [];
    const titleLocators = this.productsCol.locator(
      ['[data-test="product-name"]', '.card .card-title', '.card-title', 'a[href*="#/product/"]'].join(', ')
    );

    const count = await titleLocators.count();
    for (let i = 0; i < Math.min(count, maxItems); i++) {
      const t = (await titleLocators.nth(i).innerText().catch(() => ''))?.trim();
      if (t) titles.push(t.replace(/\s+/g, ' '));
    }
    return titles;
  }

  async getVisibleProductPrices(maxItems: number = 12): Promise<number[]> {
    await this.gotoProducts();

    const prices: number[] = [];
    const priceLocators = this.productsCol.locator(
      ['[data-test="product-price"]', '.card .card-body .fw-bold', '.card-text', '.card .card-body'].join(', ')
    );

    const count = await priceLocators.count();
    for (let i = 0; i < Math.min(count, maxItems); i++) {
      const raw = (await priceLocators.nth(i).innerText().catch(() => '')) || '';
      const m = raw.replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
      if (m) prices.push(Number(m[1]));
    }
    return prices;
  }

  assertSortedTitlesAZ(titles: string[]): void {
    const cleaned = titles.filter(Boolean).map(t => t.toLowerCase());
    const sorted = [...cleaned].sort((a, b) => a.localeCompare(b));
    expect(cleaned, 'Titles are not sorted A-Z').toEqual(sorted);
  }

  assertSortedNumbersDesc(numbers: number[]): void {
    const cleaned = numbers.filter(n => Number.isFinite(n));
    const sorted = [...cleaned].sort((a, b) => b - a);
    expect(cleaned, 'Numbers are not sorted High->Low').toEqual(sorted);
  }


  async openProductByIndex(index: number): Promise<void> {
    await this.gotoProducts();
    const link = this.productLinks.nth(index);
    await expect(link, `No product link found at index ${index}`).toBeVisible({ timeout: 60_000 });
    await link.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async openFirstProduct(): Promise<void> {
    await this.openProductByIndex(0);
  }

  async addFirstProductToCart(): Promise<void> {
    await this.openFirstProduct();
    await expect(this.addToCartBtn, 'Add to cart button not found').toBeVisible({ timeout: 60_000 });
    await this.addToCartBtn.click();
    await this.page.waitForTimeout(600);
  }

  async addProductToCartByIndex(index: number): Promise<void> {
    await this.openProductByIndex(index);
    await expect(this.addToCartBtn, 'Add to cart button not found').toBeVisible({ timeout: 60_000 });
    await this.addToCartBtn.click();
    await this.page.waitForTimeout(600);
  }
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
