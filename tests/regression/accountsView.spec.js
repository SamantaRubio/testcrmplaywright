import { test } from '@playwright/test';
import { AccountsPage } from '../pages/AccountsPage.js';
import accountFixture from '../fixtures/accounts-data.json' assert { type: 'json' };

test.describe.serial('Accounts', () => {

    const ts = Date.now();
    const last10 = String(ts).slice(-10);
    const accountData = {
    ...accountFixture,
    name: accountFixture.name.replace('{{timestamp}}', ts),
    dba: accountFixture.dba.replace('{{timestamp}}', ts),
    taxId: accountFixture.taxId.replace('{{timestamp}}', ts),
    phone: last10,
    fax: last10
    };

    test('Create and search account', async ({ page }) => {
        const accountsView = new AccountsPage(page);
    
        await accountsView.openCreateAccount();
        await accountsView.fillForm(accountData);
        await accountsView.submitForm();
    
        await accountsView.open();
        await accountsView.accountSearch(accountData.name);
        await accountsView.expectAccountExistsInTable(accountData.name);
    })

    test('Validate new account', async ({ page }) => {
        const accountsView = new AccountsPage(page);
    
        await accountsView.open();
        await accountsView.accountSearch(accountData.name);
        await accountsView.expectAccountExistsInTable(accountData.name);
        await accountsView.openAccountFromTable(accountData.name);
        await accountsView.expectAccountDetails(accountData);
    })

    test('Deactivate Account', async ({ page }) => {
        const accountsView = new AccountsPage(page);
        await accountsView.open();
        await accountsView.accountSearch(accountData.name);
        await accountsView.expectAccountExistsInTable(accountData.name);
        await accountsView.clickDeactivateInRow(accountData.name);
        await accountsView.accountSearch(accountData.name);
        await accountsView.expectActivateButtonInRow(accountData.name);
    })

    test('Activate Account', async ({ page }) => {
        const accountsView = new AccountsPage(page);
        await accountsView.open();
        await accountsView.accountSearch(accountData.name);
        await accountsView.expectAccountExistsInTable(accountData.name);
        await accountsView.clickActivateInRow(accountData.name);
        await accountsView.accountSearch(accountData.name);
        await accountsView.expectDeactivateButtonInRow(accountData.name);
    })

});