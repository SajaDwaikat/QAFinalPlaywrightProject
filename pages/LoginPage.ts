import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly errorMsg: Locator;

  constructor(page: Page) {
    this.page = page;
    this.email = page.locator('[data-test="email"]');
    this.password = page.locator('[data-test="password"]');
    this.submit = page.locator('[data-test="login-submit"]');
    this.errorMsg = page.getByText(/invalid email or password/i);
  }

  async goto() {
    await this.page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
    await expect(this.email).toBeVisible({ timeout: 60000 });
  }

  async login(email: string, password: string) {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }

  async assertInvalidLogin() {
    await expect(this.errorMsg).toBeVisible({ timeout: 60000 });
  }
}
