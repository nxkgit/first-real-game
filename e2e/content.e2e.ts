import { expect, test } from '@playwright/test';

// The content site (content.html) shows PATCHNOTES.md first, ahead of the cards.
test('content page: patch notes come first and show the newest entry', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/content.html');
  await expect(page.locator('#nav a').first()).toHaveText('Patch notes');
  await expect(page.locator('#sections section').first()).toHaveAttribute('id', 'patchnotes');
  await expect(page.locator('#patchnotes .patch-entry').first().locator('h3')).toContainText(/^\d{4}-\d{2}-\d{2}/);
  await expect(page.locator('#patchnotes .patch-entry').first()).toContainText('Checked'); // every entry has a Checked section; only fix entries have "Fixed"
  expect(errors).toEqual([]);
});
