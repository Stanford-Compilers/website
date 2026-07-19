import { test, expect } from '@playwright/test';

test('desktop navigation marks the current page', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'desktop-only layout');
  await page.goto('/join');
  const current = page.locator('.primary-nav__link[aria-current="page"]');
  await expect(current).toHaveText('Research');
  await page
    .getByRole('navigation', { name: 'Primary' })
    .getByRole('link', { name: 'Software' })
    .click();
  await expect(page).toHaveURL(/\/software$/);
  await expect(page.locator('.primary-nav__link[aria-current="page"]')).toHaveText('Software');
});

test('mobile navigation is keyboard operable and closes on Escape', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile-only');
  await page.goto('/');
  const toggle = page.locator('[data-nav-toggle]');
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');

  // Open via keyboard.
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  const menuLink = page
    .getByRole('navigation', { name: 'Primary' })
    .getByRole('link', { name: 'Publications' });
  await expect(menuLink).toBeVisible();

  // Escape closes and returns focus to the toggle.
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toBeFocused();

  // Reopen and navigate.
  await toggle.click();
  await menuLink.click();
  await expect(page).toHaveURL(/\/publications$/);
});
