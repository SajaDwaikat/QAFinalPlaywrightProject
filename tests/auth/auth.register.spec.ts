async function gotoRegister(page: any) {
  const routes = ['/auth/register', '/register', '/signup'];

  for (const r of routes) {
    await page.goto(r, { waitUntil: 'domcontentloaded' }).catch(() => null);

    const email = page
      .getByLabel(/^email$/i)
      .or(page.locator('input[name="email"], input[type="email"]'));
    const submit = page.getByRole('button', { name: /register|sign up|create account/i }).first();

    // اعتبريه نجح لو واحد من هدول ظهر
    const ok =
      (await email.isVisible().catch(() => false)) ||
      (await submit.isVisible().catch(() => false));

    if (ok) return;
  }

  // إذا ما وصلنا لصفحة register بأي route، نفشل فورًا بدل ما نكمل على صفحة غلط
  throw new Error('Could not navigate to a Register page (no email field / register button found).');
}
