import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pages = [
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
  '/accessibility',
];

test.describe('axe accessibility scan (WCAG 2.1 A/AA)', () => {
  for (const path of pages) {
    test(`no serious/critical violations on ${path}`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'chromium', 'run axe once, on chromium');
      await page.goto(path);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      const serious = results.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical'
      );
      if (serious.length) {
        console.log(
          `Violations on ${path}:`,
          JSON.stringify(
            serious.map((v) => ({
              id: v.id,
              impact: v.impact,
              nodes: v.nodes.length,
              help: v.help,
            })),
            null,
            2
          )
        );
      }
      expect(serious).toEqual([]);
    });
  }
});

test('dark theme has no serious/critical contrast violations', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'run once');
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('theme', 'dark'));
  await page.reload();
  const results = await new AxeBuilder({ page }).withTags(['wcag2aa', 'wcag21aa']).analyze();
  const serious = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical'
  );
  expect(serious).toEqual([]);
});

test('hero animation is disabled under prefers-reduced-motion', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'run once');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const animName = await page
    .locator('.stage')
    .first()
    .evaluate((el) => getComputedStyle(el).animationName);
  expect(animName).toBe('none');
});

test('no horizontal overflow at 360px', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'run once');
  await page.setViewportSize({ width: 360, height: 780 });
  for (const path of ['/', '/publications', '/software', '/people', '/software/taco', '/join']) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow, `horizontal overflow on ${path}`).toBeLessThanOrEqual(1);
  }
});
