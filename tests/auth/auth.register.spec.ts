import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

test.use({ storageState: { cookies: [], origins: [] } }); 

function uniqueEmail(prefix = 'qa'): string {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}@test.com`;
}

async function gotoRegister(page: any) {

  const routes = ['/auth/register', '/register', '/signup'];
  for (const r of routes) {
    await page.goto(r, { waitUntil: 'domcontentloaded' }).catch(() => null);
    if (!/404/.test(await page.title().catch(() => ''))) return;
  }
}

test.describe('Auth - Register', () => {
  test('register new account (happy path)', async ({ page }) => {
    test.setTimeout(120_000);

    await gotoRegister(page);


    const firstName = page.getByLabel(/first name/i).or(page.locator('input[name="first_name"], input[name="firstName"]'));
    const lastName = page.getByLabel(/last name/i).or(page.locator('input[name="last_name"], input[name="lastName"]'));
    const dob = page.getByLabel(/date of birth/i).or(page.locator('input[name="dob"], input[type="date"]'));
    const email = page.getByLabel(/^email$/i).or(page.locator('input[name="email"], input[type="email"]'));
    const password = page.getByLabel(/^password$/i).or(page.locator('input[name="password"][type="password"]'));
    const submit = page.getByRole('button', { name: /register|sign up|create account/i }).first();

    await expect(email).toBeVisible({ timeout: 60_000 });

    await firstName.fill('QA');
    await lastName.fill('Student');
    if (await dob.isVisible().catch(() => false)) {

      await dob.fill('1999-01-01');
    }

    const newEmail = uniqueEmail('qa');
    await email.fill(newEmail);
    await password.fill('Test@12345');

    const registerApi = page.waitForResponse((r: any) => /register|signup/i.test(r.url()) && r.request().method() === 'POST', { timeout: 60_000 }).catch(() => null);

    await submit.click();

 
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    const res = await registerApi;
    const apiOk = res ? res.ok() : false;

    const successSignals = [
      page.locator('.alert-success, [role="alert"]:has-text("success"), .toast-success').first(),
      page.getByText(/account created|registered successfully|welcome/i).first(),
    ];

    let anySuccess = false;
    for (const loc of successSignals) {
      if (await loc.isVisible().catch(() => false)) {
        anySuccess = true;
        break;
      }
    }

    const url = page.url();
    const redirected = /login/i.test(url) || /account|profile/i.test(url);

    expect(anySuccess || redirected || apiOk).toBeTruthy();
  });

  test('register validation: submitting empty form shows errors', async ({ page }) => {
    await gotoRegister(page);

    const submit = page.getByRole('button', { name: /register|sign up|create account/i }).first();
    await expect(submit).toBeVisible({ timeout: 60_000 });

    await submit.click();

    const errorNodes = page.locator('.invalid-feedback, .text-danger, [role="alert"], .alert-danger');
    await expect(errorNodes.first()).toBeVisible({ timeout: 60_000 });

    
    const all = (await errorNodes.allTextContents().catch(() => [])).map((t: string) => t.trim()).filter(Boolean);
    expect(all.length).toBeGreaterThan(0);
  });
});
