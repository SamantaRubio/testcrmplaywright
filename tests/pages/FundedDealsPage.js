import { BasePage } from './BasePage.js';
import { expect } from '@playwright/test';

export class FundedDealsPage extends BasePage {
    constructor(page) {
        super(page);
        this.searchInput = this.getByTestId('search-funded-deals');
        this.dealsTable = page.locator('#funded-deals-table');
        this.dealsRows = this.dealsTable.locator('tbody tr[data-funded-deal-id]');
    }

    async open() {
        await this.goto('/funded_deals');
    }

    async dealsSearch(value){
        await this.searchInput.fill('');
        await this.searchInput.type(value, { delay: 120 });
        await this.page.waitForTimeout(600);
        await this.page.waitForLoadState('networkidle');
    }
    
    async verifySearch(value) {
        await expect(this.dealsTable).toBeVisible();
    
        const rowCount = await this.dealsRows.count();
    
        // Caso 1: no hubo resultados
        if (rowCount === 0) {
        await expect(this.dealsRows).toHaveCount(0);
        return;
        }
    
        // Caso 2: hubo exactamente 1 resultado
        await expect(this.dealsRows).toHaveCount(1);
    
        const row = this.dealsRows.first();
    
        await expect(
        row,
        `Funded deal with value "${value}" was found`
        ).toContainText(value, { ignoreCase: true });
    }
  
}