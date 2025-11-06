// pages/GlobalSearchComponent.js
import { BasePage } from './BasePage.js';
import { expect } from '@playwright/test';

export class GlobalSearch extends BasePage {
  constructor(page) {
    super(page);
    this.page = page;
    this.input = this.page.getByTestId('search_bar');
    this.dropdown = this.page.getByTestId('search_results_dropdown');
    this.items = this.dropdown.locator('a');
    this.emptyState = this.dropdown.getByText(/No results found/i);
  }

  async openAndType(query) {
    await this.goto('/');
    await expect(this.input).toBeVisible();
    await this.input.click();
    await this.input.fill(query);
    await this.dropdown.waitFor({ state: 'visible' });
  }

  /** Happy Paths: ensure that there is at last 1 result */
  async waitForAnyResult() {
    await expect(this.items.first()).toBeVisible();
  }

  async selectFirstResult() {
    const count = await this.items.count();
    if (count === 0) throw new Error('No results found in search dropdown');
    await this.items.first().click();
  }

  async selectSecondResult() {
    const count = await this.items.count();
    if (count < 2) throw new Error('Less than 2 results in search dropdown');
    await this.items.nth(1).click(); // índice 1 = segundo elemento (0-based)
  }

  async selectResultByText(text) {
    await this.items.filter({ hasText: text }).first().click();
  }

  /** Sad Path: ensures 0 results and message for empty result */
  async expectNoResults(query) {
    await expect(this.items).toHaveCount(0);
    await expect(this.emptyState).toBeVisible();
    if (query) {
      await expect(this.emptyState).toContainText(new RegExp(query, 'i'));
    }
  }
}
