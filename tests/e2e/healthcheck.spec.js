import { test, expect } from '@playwright/test';

test.use({ storageState: 'storage/anon.json' });

test.describe('Healthcheck', () => {
  test('App renders and shows main container', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('new_user')).toBeVisible();
  });
});