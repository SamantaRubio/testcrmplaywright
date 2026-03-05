import { BasePage } from './BasePage.js';
import { expect } from '@playwright/test';

export class AccountsPage extends BasePage {
    constructor(page) {
        super(page);

        // Index
        this.createAccountBtn = page.locator('#create-account-button');
        this.searchInput = page.locator('#search-accounts');
        this.tableBody = page.locator('#accounts-container'); 

        // Create Account Form
        this.form = page.locator('form#new_account');
        this.name = page.locator('#account_name');
        this.industry = page.locator('#account_industry_id');
        this.dba = page.locator('#account_dba');
        this.entityType = page.locator('#account_entity_type_id');
        this.businessStartDate = page.locator('#account_business_start_date');
        this.annualRevenue = page.locator('#account_annual_revenue');
        this.taxId = page.locator('#account_tax_id');
        this.source = page.locator('#account_source_id');
        this.bankAccounts = page.locator('#account_bank_accounts');
        this.avgMonthlyDeposits = page.locator('#account_avg_monthly_deposits');
        this.website = page.locator('#account_website');
        this.assignedTo = page.locator('#lead-assigned-to-input');

        this.seasonalRevenue = page.locator('#account_seasonal_revenue');
        this.isActive = page.locator('#account_is_active');

        this.businessDescription = page.locator('#account_business_description');
        this.notes = page.locator('#account_background_info');

        this.phone = page.locator('#account_phone');
        this.fax = page.locator('#account_fax');

        this.billingStreet1 = page.locator('#account_billing_address_attributes_street1');
        this.billingStreet2 = page.locator('#account_billing_address_attributes_street2');
        this.billingCity = page.locator('#account_billing_address_attributes_city');
        this.billingState = page.locator('#account_billing_address_attributes_state');
        this.billingZip = page.locator('#account_billing_address_attributes_zipcode');

        this.submit = page.locator('input[type="submit"][value="Create Account"]');

        // Show
        this.accountShowRoot = page.locator('[data-controller="account-show"]');
    }

    async open() {
        await this.goto('/accounts');
    }

    async openCreateAccount() {
        await this.goto('/accounts/new');
        await expect(this.form).toBeVisible();
    }

    // Search account
    async accountSearch(value){
        await this.searchInput.fill('');
        await this.searchInput.type(value, { delay: 120 });
        await this.page.waitForTimeout(600);
        await this.page.waitForLoadState('networkidle');
    }

    async expectAccountExistsInTable(name) {
        const rowLinkByName = this.tableBody.locator('a', { hasText: name }).first();
        await expect(rowLinkByName).toBeVisible({ timeout: 15000 });
    }

    // Create account
    async fillForm(data) {
        await this.name.fill(data.name);
        if (data.industry) await this.industry.selectOption({ label: data.industry });
        if (data.dba) await this.dba.fill(data.dba);
        if (data.entityType) await this.entityType.selectOption({ label: data.entityType });
        if (data.businessStartDate) await this.businessStartDate.fill(data.businessStartDate);
        if (data.annualRevenue) await this.annualRevenue.fill(data.annualRevenue);
        if (data.taxId) await this.taxId.fill(data.taxId);
        if (data.source) await this.source.selectOption({ label: data.source });
        if (data.bankAccounts) await this.bankAccounts.fill(data.bankAccounts);
        if (data.avgMonthlyDeposits) await this.avgMonthlyDeposits.fill(data.avgMonthlyDeposits);
        if (data.website) await this.website.fill(data.website);
        if (data.assignedTo) await this.assignedTo.selectOption({ label: data.assignedTo });
    
        if (typeof data.seasonalRevenue === 'boolean') {
          if (data.seasonalRevenue) await this.seasonalRevenue.check();
          else await this.seasonalRevenue.uncheck();
        }
    
        if (typeof data.isActive === 'boolean') {
          if (data.isActive) await this.isActive.check();
          else await this.isActive.uncheck();
        }
    
        if (data.businessDescription) await this.businessDescription.fill(data.businessDescription);
        if (data.notes) await this.notes.fill(data.notes);
    
        if (data.phone) await this.phone.fill(data.phone);
        if (data.fax) await this.fax.fill(data.fax);
    
        if (data.billing?.street1) await this.billingStreet1.fill(data.billing.street1);
        if (data.billing?.street2) await this.billingStreet2.fill(data.billing.street2);
        if (data.billing?.city) await this.billingCity.fill(data.billing.city);
        if (data.billing?.state) await this.billingState.selectOption({ label: data.billing.state });
        if (data.billing?.zipcode) await this.billingZip.fill(data.billing.zipcode);
    }

    async submitForm() {
        await this.submit.click();
        // await expect(this.submit).toBeDisabled({ timeout: 10000 });
        await this.page.waitForURL(/\/accounts(\/\d+)?$/, { timeout: 15000 });
    }


    // Validate Created Account
    async openAccountFromTable(name) {
        const rowLinkByName = this.tableBody.locator('a', { hasText: name }).first();
        await expect(rowLinkByName).toBeVisible({ timeout: 15000 });
        await rowLinkByName.click();
        await this.page.waitForURL(/\/accounts\/\d+/, { timeout: 15000 });
        await expect(this.accountShowRoot).toBeVisible({ timeout: 15000 });
    }

    _showFieldValueLocator(labelText) {
        const label = this.accountShowRoot.locator('label', { hasText: labelText }).first();
        const wrapper = label.locator('xpath=..');
        return wrapper.locator('> div.bg-gray-100').first();
      }

    async _readShowFieldText(labelText) {
        const locator = this._showFieldValueLocator(labelText);
        await expect(locator).toBeVisible({ timeout: 15000 });
        return (await locator.innerText()).trim().replace(/\s+/g, ' ');
    }
    
    _toNumber(value) {
        if (value === null || value === undefined) return null;
        const cleaned = String(value).replace(/[^\d.-]/g, '');
        if (!cleaned) return null;
        const num = Number(cleaned);
        return Number.isFinite(num) ? num : null;
    }

    _formatDateToUS(isoDate) {
        // fixture: YYYY-MM-DD -> UI: MM/DD/YYYY (como 01/15/2020)
        const d = new Date(`${isoDate}T00:00:00`);
        if (Number.isNaN(d.getTime())) return isoDate;
        return new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          timeZone: 'UTC',
        }).format(d);
    }

    async expectAccountDetails(data) {
        // Strings directos
        await expect(await this._readShowFieldText('Account Name')).toBe(data.name);
        await expect(await this._readShowFieldText('Industry')).toBe(data.industry);
        await expect(await this._readShowFieldText('Doing Business As name')).toBe(data.dba);
        await expect(await this._readShowFieldText('Entity Type')).toBe(data.entityType);
        await expect(await this._readShowFieldText('Tax ID')).toBe(data.taxId);
        await expect(await this._readShowFieldText('Website')).toBe(data.website);
        await expect(await this._readShowFieldText('Source')).toBe(data.source);
    

        if (data.businessStartDate) {
          const uiDate = await this._readShowFieldText('Business Start');
          await expect(uiDate).toBe(this._formatDateToUS(data.businessStartDate));
        }
    
        if (data.annualRevenue) {
          const uiAnnual = await this._readShowFieldText('Annual revenue');
          await expect(this._toNumber(uiAnnual)).toBe(this._toNumber(data.annualRevenue));
        }
    
        if (data.avgMonthlyDeposits) {
          const uiAvg = await this._readShowFieldText('Avg Monthly Deposits');
          await expect(this._toNumber(uiAvg)).toBe(this._toNumber(data.avgMonthlyDeposits));
        }
    
        if (data.bankAccounts) {
          const uiBank = await this._readShowFieldText('Bank accounts');
          await expect(this._toNumber(uiBank)).toBe(this._toNumber(data.bankAccounts));
        }
    
        // Phone/Fax (tus dinámicos last10)
        if (data.phone) {
          await expect(await this._readShowFieldText('Business Phone')).toBe(String(data.phone));
        }
    
        // if (data.fax) {
        //   const faxLocator = this._showFieldValueLocator('Fax');
        //   if (await faxLocator.count()) {
        //     const faxText = (await faxLocator.first().innerText()).trim();
        //     await expect(faxText).toBe(String(data.fax));
        //   }
        // }
    
        // Billing
        if (data.billing?.street1) await expect(await this._readShowFieldText('Street Address 1')).toBe(data.billing.street1);
        if (data.billing?.street2) await expect(await this._readShowFieldText('Street Address 2')).toBe(data.billing.street2);
        if (data.billing?.city) await expect(await this._readShowFieldText('City')).toBe(data.billing.city);
        if (data.billing?.state) await expect(await this._readShowFieldText('State')).toBe(data.billing.state);
        if (data.billing?.zipcode) await expect(await this._readShowFieldText('Zip')).toBe(data.billing.zipcode);
    
        // Seasonal revenue (UI: "yes")
        if (typeof data.seasonalRevenue === 'boolean') {
          const seasonalText = (await this._readShowFieldText('Seasonal revenue')).toLowerCase();
          if (data.seasonalRevenue) await expect(seasonalText).toContain('yes');
          else await expect(seasonalText).toContain('no');
        }
    
        // Status (Admin Only) (UI: "Active")
        if (typeof data.isActive === 'boolean') {
          const statusText = (await this._readShowFieldText('Status (Admin Only)')).toLowerCase();
          if (data.isActive) await expect(statusText).toContain('active');
          else await expect(statusText).not.toContain('active');
        }
    
        // Textareas
        if (data.businessDescription) await expect(await this._readShowFieldText('Business Description')).toBe(data.businessDescription);
        if (data.notes) await expect(await this._readShowFieldText('Notes')).toBe(data.notes);
    
        // Assigned To (tu fixture trae "Myself" pero el show suele mostrar el nombre real (ej. "Guy J."))
        // Entonces: si es "Myself", solo validamos que NO esté vacío / Unassigned.
        if (data.assignedTo) {
          const assignedCard = this.accountShowRoot.locator('[id$="-assigned_to"] span.text-sm.text-gray-900').first();
          if (await assignedCard.count()) {
            const assignedText = (await assignedCard.innerText()).trim();
            if (data.assignedTo === 'Myself') {
              await expect(assignedText).not.toBe('');
              await expect(assignedText.toLowerCase()).not.toContain('unassigned');
            } else {
              await expect(assignedText).toBe(data.assignedTo);
            }
          }
        }
    }

    // Deactivate/Activate Account
    _rowByAccountName(accountName) {
      // Each row has <a href="/accounts/:id"> ... <div>Account Name</div>
      return this.tableBody.locator('tr', { has: this.page.locator('a', { hasText: accountName }) }).first();
    }

    async clickDeactivateInRow(accountName) {
        const row = this._rowByAccountName(accountName);
        await expect(row).toBeVisible({ timeout: 15000 });

        const deactivateBtn = row.locator('form[action$="/deactivate"] button').first();
        await expect(deactivateBtn).toBeVisible({ timeout: 15000 });

        // Deactivate triggers a confirm dialog via data-turbo-confirm
        this.page.once('dialog', async (dialog) => {
            await dialog.accept();
        });

        const respPromise = this.page
            .waitForResponse((r) => r.url().includes('/deactivate') && r.request().method() === 'POST', { timeout: 15000 })
            .catch(() => null);

        await deactivateBtn.click();
        await respPromise;
        await this.page.waitForLoadState('networkidle');
    }

    async expectActivateButtonInRow(accountName) {
        const row = this._rowByAccountName(accountName);
        await expect(row).toBeVisible({ timeout: 15000 });

        const activateBtn = row.locator('form[action$="/activate"] button' ).first();
        await expect(activateBtn).toBeVisible({ timeout: 15000 });
    }

    async clickActivateInRow(accountName) {
      const row = this._rowByAccountName(accountName);
      await expect(row).toBeVisible({ timeout: 15000 });

      const activateBtn = row.locator('form[action$="/activate"] button').first();
      await expect(activateBtn).toBeVisible({ timeout: 15000 });

      // Deactivate triggers a confirm dialog via data-turbo-confirm
      this.page.once('dialog', async (dialog) => {
          await dialog.accept();
      });

      const respPromise = this.page
          .waitForResponse((r) => r.url().includes('/activate') && r.request().method() === 'POST', { timeout: 15000 })
          .catch(() => null);

      await activateBtn.click();
      await respPromise;
      await this.page.waitForLoadState('networkidle');
    }

    async expectDeactivateButtonInRow(accountName) {
      const row = this._rowByAccountName(accountName);
      await expect(row).toBeVisible({ timeout: 15000 });

      const deactivateBtn = row.locator('form[action$="/deactivate"] button' ).first();
      await expect(deactivateBtn).toBeVisible({ timeout: 15000 });
  }

}