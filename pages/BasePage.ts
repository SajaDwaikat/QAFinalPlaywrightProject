import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
  protected readonly page: Page;

  readonly navHome: Locator;
  readonly navCategories: Locator;
  readonly navContact: Locator;
  readonly navSignIn: Locator;
  readonly navSignOut: Locator;

  constructor(page: Page) {
    this.page = page;

    this.navHome = page.locator('[data-test="nav-home"]');
    this.navCategories = page.locator('[data-test="nav-categories"]');
    this.navContact = page.locator('[data-test="nav-contact"]');
    this.navSignIn = page.locator('[data-test="nav-sign-in"]');
    this.navSignOut = page.locator('[data-test="nav-sign-out"]');
  }

  async goto(path: string, waitUntil: 'domcontentloaded' | 'load' = 'domcontentloaded') {
    await this.page.goto(path, { waitUntil });
  }

  async expectLoggedIn() {
    await expect(this.navSignOut).toBeVisible({ timeout: 60_000 });
  }

  async expectLoggedOut() {
    await expect(this.navSignIn).toBeVisible({ timeout: 60_000 });
  }
}
