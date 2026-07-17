import { test, expect } from '@playwright/test';

test('theme toggle switches and persists across reload and navigation', async ({ page }) => {
  await page.goto('/');
  const html = page.locator('html');
  const toggle = page.locator('[data-theme-toggle]').first();

  // Default: no explicit theme attribute (follows system).
  const initial = await html.getAttribute('data-theme');

  await toggle.click();
  const afterClick = await html.getAttribute('data-theme');
  expect(['light', 'dark']).toContain(afterClick);
  expect(afterClick).not.toBe(initial === 'dark' ? 'dark' : initial); // it changed

  // Persists across reload.
  await page.reload();
  await expect(html).toHaveAttribute('data-theme', afterClick!);

  // Persists across navigation.
  await page.goto('/software');
  await expect(html).toHaveAttribute('data-theme', afterClick!);

  // Toggling again flips it.
  await page.locator('[data-theme-toggle]').first().click();
  const flipped = afterClick === 'dark' ? 'light' : 'dark';
  await expect(html).toHaveAttribute('data-theme', flipped);
});
