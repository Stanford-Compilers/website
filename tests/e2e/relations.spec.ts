import { test, expect } from '@playwright/test';

test('software detail links to its publications and back', async ({ page }) => {
  await page.goto('/software/taco');
  // Key publications section links to a publication detail page.
  const pubLink = page.locator('a[href^="/publications/"]').first();
  await expect(pubLink).toBeVisible();
  await pubLink.click();
  await expect(page).toHaveURL(/\/publications\//);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('publication detail links to related software', async ({ page }) => {
  await page.goto('/publications/pldi22-distal');
  const swLink = page.locator('a[href="/software/distal"]').first();
  await expect(swLink).toBeVisible();
  await swLink.click();
  await expect(page).toHaveURL(/\/software\/distal$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/DISTAL/);
});

test('author byline links to a lab-member profile', async ({ page }) => {
  await page.goto('/publications/copy-and-patch');
  const author = page.getByRole('link', { name: 'Fredrik Kjolstad' }).first();
  await author.click();
  await expect(page).toHaveURL(/\/people\/fredrik-kjolstad$/);
});

test('person page deep-links to their filtered publications', async ({ page }) => {
  await page.goto('/people/fredrik-kjolstad');
  const all = page.locator('a[href*="/publications?member=fredrik-kjolstad"]').first();
  await expect(all).toBeVisible();
  await all.click();
  await expect(page).toHaveURL(/member=fredrik-kjolstad/);
  // The filter is applied.
  await expect(page.locator('[data-member]')).toHaveValue('fredrik-kjolstad');
});
