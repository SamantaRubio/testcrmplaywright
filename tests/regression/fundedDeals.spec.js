import { test, expect } from '@playwright/test';
import { FundedDealsPage } from '../pages/FundedDealsPage.js';

test('Search Funded Deal', async ({ page }) => {
    const dealsPage = new FundedDealsPage(page);
    await dealsPage.open();
    const searchTerm = 'UpdatedPlayCompany1764872373596';

    await dealsPage.dealsSearch(searchTerm);
    await dealsPage.verifySearch(searchTerm);
});