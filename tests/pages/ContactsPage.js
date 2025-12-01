import { BasePage } from './BasePage.js';
import { expect } from '@playwright/test';

export class ContactsPage extends BasePage {
    constructor(page) {
        super(page);
        this.contactsTable = this.page.locator('#contacts-table');
        this.searchInput = this.page.locator('#search-contacts');
    }

    async open() {
        await this.goto('/contacts');
    }

    async contactsSearch(value){
        await this.searchInput.fill('');
        await this.searchInput.type(value, { delay: 120 });
        await this.page.waitForTimeout(600);
        await this.page.waitForLoadState('networkidle');
    }

    async verifyConvertedLead(phone, firstname){
        await this.goto('/contacts');
        await this.contactsSearch(phone);
        const row = this.contactsTable.getByText(phone, { exact: false });
        await expect(
          row,
          `The Contact with name: ${firstname} was not found`
        ).toBeVisible();
    }

}