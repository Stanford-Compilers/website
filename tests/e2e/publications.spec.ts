import { test, expect } from '@playwright/test';

test.describe('publication explorer (with JavaScript)', () => {
  test('search filters the list and updates the count', async ({ page }) => {
    await page.goto('/publications');
    const items = page.locator('[data-pub-item]');
    const total = await items.count();
    expect(total).toBeGreaterThan(40);

    await page.locator('[data-q]').fill('copy-and-patch');
    await expect(page.locator('[data-count]')).toContainText(/Showing \d+ of/);
    const visible = page.locator('[data-pub-item]:visible');
    await expect(visible).toHaveCount(1);
    await expect(visible.first()).toContainText(/Copy-and-Patch/i);
    // URL reflects the query.
    await expect(page).toHaveURL(/q=copy-and-patch/);
  });

  test('topic facet filters and syncs to the URL; clear resets', async ({ page }) => {
    await page.goto('/publications');
    // Open the Topic dropdown and check "Distributed".
    await page.locator('[data-dd="topic"]').click();
    const distributed = page.locator('input[data-facet="topic"][value="distributed"]');
    await distributed.check();
    await expect(page).toHaveURL(/topic=distributed/);
    const visible = page.locator('[data-pub-item]:visible');
    const n = await visible.count();
    expect(n).toBeGreaterThan(0);
    // Every visible item is tagged distributed.
    for (let i = 0; i < n; i++) {
      await expect(visible.nth(i)).toHaveAttribute('data-topics', /distributed/);
    }
    // Close the open dropdown first (as a user would — its panel overlays the
    // toolbar below it), then Clear all.
    await page.locator('[data-dd="topic"]').click();
    await page.locator('[data-clear]').click();
    await expect(page).toHaveURL(/\/publications$/);
    await expect(page.locator('[data-pub-item]:visible')).toHaveCount(
      await page.locator('[data-pub-item]').count()
    );
  });

  test('search suggests authors; picking one filters, chips it, and bolds bylines', async ({
    page,
  }) => {
    await page.goto('/publications');
    const q = page.locator('[data-q]');
    const total = await page.locator('[data-pub-item]').count();

    // Typing surfaces matching lab members in the autocomplete popup.
    await q.fill('bob');
    const suggest = page.locator('[data-suggest]');
    await expect(suggest).toBeVisible();
    const option = suggest.locator('.suggest__opt', { hasText: 'Bobby Yan' });
    await expect(option).toBeVisible();
    await option.click();

    // Picking an author clears the query, adds a chip, and syncs to the URL.
    await expect(q).toHaveValue('');
    const tag = page.locator('[data-author-tags] .filter-tag', { hasText: 'Bobby Yan' });
    await expect(tag).toBeVisible();
    await expect(page).toHaveURL(/author=bobby-yan/);

    // Only that author's papers remain, and their name is bolded in each byline.
    const visible = page.locator('[data-pub-item]:visible');
    const n = await visible.count();
    expect(n).toBeGreaterThan(0);
    expect(n).toBeLessThan(total);
    for (let i = 0; i < n; i++) {
      await expect(visible.nth(i)).toHaveAttribute('data-members', /bobby-yan/);
    }
    await expect(
      page.locator('.ledger__author.is-filtered[data-author-id="bobby-yan"]')
    ).toHaveCount(n);

    // Removing the chip restores the full list and clears the URL.
    await tag.click();
    await expect(page.locator('[data-author-tags] .filter-tag')).toHaveCount(0);
    await expect(page).toHaveURL(/\/publications$/);
    await expect(page.locator('[data-pub-item]:visible')).toHaveCount(total);
  });

  test('deep-links an author filter from the URL on load', async ({ page }) => {
    await page.goto('/publications?author=bobby-yan');
    await expect(
      page.locator('[data-author-tags] .filter-tag', { hasText: 'Bobby Yan' })
    ).toBeVisible();
    const visible = page.locator('[data-pub-item]:visible');
    const n = await visible.count();
    expect(n).toBeGreaterThan(0);
    for (let i = 0; i < n; i++) {
      await expect(visible.nth(i)).toHaveAttribute('data-members', /bobby-yan/);
    }
  });

  test('deep-links from a URL apply filters on load', async ({ page }) => {
    await page.goto('/publications?award=1');
    const visible = page.locator('[data-pub-item]:visible');
    const n = await visible.count();
    expect(n).toBeGreaterThan(0);
    for (let i = 0; i < n; i++) {
      await expect(visible.nth(i)).toHaveAttribute('data-award', '1');
    }
    await expect(page.locator('[data-award-chip]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('shows an empty state when nothing matches', async ({ page }) => {
    await page.goto('/publications');
    await page.locator('[data-q]').fill('zzzznotarealpaper');
    await expect(page.locator('[data-empty]')).toBeVisible();
    await expect(page.locator('[data-pub-item]:visible')).toHaveCount(0);
    // Recover via the empty-state clear button.
    await page.locator('[data-clear-2]').click();
    await expect(page.locator('[data-empty]')).toBeHidden();
  });

  test('BibTeX disclosure reveals an entry and copy works', async ({ page, context }, testInfo) => {
    test.skip(
      testInfo.project.name === 'mobile',
      'clipboard permissions vary under mobile emulation'
    );
    await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
    await page.goto('/publications/oopsla17');
    const code = page.locator('#bib-oopsla17');
    await expect(code).toContainText('@inproceedings{kjolstad2017tensor');
    await page.getByRole('button', { name: /Copy/ }).first().click();
    await expect(page.locator('[data-copy-live]')).toContainText(/copied/i);
  });
});

test.describe('publication list without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('shows the complete grouped list and hides the filter controls', async ({ page }) => {
    await page.goto('/publications');
    const items = page.locator('[data-pub-item]');
    expect(await items.count()).toBeGreaterThan(40);
    // Year group headings are present (grouped list).
    await expect(page.locator('[data-year-group]').first()).toBeVisible();
    // The interactive filter form is hidden without JS.
    await expect(page.locator('[data-filters]')).toBeHidden();
  });
});
