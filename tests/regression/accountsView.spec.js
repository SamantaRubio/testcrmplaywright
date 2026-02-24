import { test } from '@playwright/test';
import { AccountsPage } from '../pages/AccountsPage.js';
//import accountsFixture from '../fixtures/accounts-data.json' assert { type: 'json' };

test.describe.serial('Accounts', () => {

    test('Create and search account', async ({ page }) => {
        const accountsPage = new AccountsPage(page);
        await accountsPage.open();
    })
});