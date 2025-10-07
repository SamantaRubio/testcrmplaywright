import { test as setup, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';

setup('save authenticated storage', async ({ page }) => {
  const login = new LoginPage(page);
  await login.open();
  await login.login(process.env.ADMIN_USERNAME, process.env.ADMIN_PSW);

  // Guarda la sesión para el resto de proyectos
  await page.context().storageState({ path: 'storage/auth.json' });
});
