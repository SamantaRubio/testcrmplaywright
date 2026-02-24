import { BasePage } from './BasePage.js';
import { expect } from '@playwright/test';

export class AccountsPage extends BasePage {
    constructor(page) {
        super(page);
    }

    async open() {
        await this.goto('/accounts');
    }
}