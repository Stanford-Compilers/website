import { test, expect } from '@playwright/test';

const routes = [
  '/',
  '/research',
  '/publications',
  '/software',
  '/software/taco',
  '/people',
  '/people/fredrik-kjolstad',
  '/publications/oopsla17',
  '/join',
  '/about',
];

for (const path of routes) {
  test(`loads ${path} with an h1 and no console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    page.on('pageerror', (e) => errors.push(e.message));

    const resp = await page.goto(path);
    expect(resp?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page).toHaveTitle(/Stanford Compilers Lab/);
    expect(errors, `console errors on ${path}`).toEqual([]);
  });
}

test('serves a custom 404 page with recovery links', async ({ page }) => {
  const resp = await page.goto('/definitely-not-a-real-page');
  expect(resp?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/coordinate is empty/i);
  await expect(page.getByRole('link', { name: 'Home', exact: true })).toBeVisible();
});

test('has a working skip link', async ({ page }, testInfo) => {
  await page.goto('/');
  const skip = page.locator('.skip-link');
  await expect(skip).toHaveAttribute('href', '#main');
  // WebKit (emulating Safari) does not Tab to links unless full keyboard access
  // is enabled; the link is still focusable, so verify focusability directly there.
  if (testInfo.project.name === 'webkit') {
    await skip.focus();
  } else {
    await page.keyboard.press('Tab');
  }
  await expect(skip).toBeFocused();
});
