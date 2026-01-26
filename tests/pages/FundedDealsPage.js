import { BasePage } from './BasePage.js';
import { expect } from '@playwright/test';

export class FundedDealsPage extends BasePage {
    constructor(page) {
        super(page);
        this.searchInput = this.getByTestId('search-funded-deals');
        this.visualizeCommissionIcon = page.locator('[data-stats-cards-target="eyeIcon"]');
        this.hideCommissionIcon = page.locator('[data-stats-cards-target="eyeSlashIcon"]');
        this.commissionsLabel = page.locator('#stats-total-commission-mtd');
        this.actionsMenuButton = this.page.locator('button[data-action="click->dropdown#toggle"]');
        this.deleteButton = this.page.locator('button[type="submit"]', { hasText: 'Delete' });

        // Funded Deals Table
        this.dealsTable = page.locator('#funded-deals-table');
        this.fundedDealsRows = this.dealsTable.locator(
        'tbody tr[data-table-sort-target="row"]'
        );

        // Sorting Headers
        this.sortByDealNameHeader = page.locator('#sort-by-deal-name');
        this.sortByStatusHeader = page.locator('#sort-by-status');
        this.sortByAmountHeader = page.locator('#sort-by-amount');
        this.sortByTermHeader = page.locator('#sort-by-term');
        this.sortBySellRateHeader = page.locator('#sort-by-sell-rate');
        this.sortByCommissionHeader = page.locator('#sort-by-commission');
        this.sortByFeeHeader = page.locator('#sort-by-fee');

        // Filters
        this.filterButton = page.locator('#filter-funded-deals-button');
        this.filterDropdown = page.locator('[data-funded-deals-filter-target="dropdown"]').first();
        this.clearFiltersButton = page.getByRole('button', { name: 'Clear All Filters' });
        this.detailsAdditionalInfoTitle = page.getByRole('heading', {
          name: 'Additional Information',
        });

        // Approve and Reopen
        this.approveBtn = this.page.getByRole('button', { name: 'Approve' });
        this.approvedStatusBadge = this.page.locator('div.bg-green-100:has(span:has-text("Approved"))');
        this.reopenBtn = this.page.getByRole('button', { name: 'Reopen Opportunity' });
        this.pendingApprovalStatusBadge = this.page.locator('div.bg-yellow-100:has(span.text-yellow-600:has-text("Pending Approval"))');
        }

    async open() {
        await this.goto('/funded_deals');
    }

    // Search Funded Deal

    async dealsSearch(value){
        await this.searchInput.fill('');
        await this.searchInput.type(value, { delay: 120 });
        await this.page.waitForTimeout(600);
        await this.page.waitForLoadState('networkidle');
    }

    async chooseFirstPendingApprovalDeal() {
      await expect(this.dealsTable).toBeVisible({ timeout: 20000 });
    
      const rows = this.fundedDealsRows;
      const count = await rows.count();
    
      for (let i = 0; i < count; i++) {
        const row = rows.nth(i);
    
        const statusCell = row.locator('td[data-column="status"]');
        const statusText = (await statusCell.innerText()).toLowerCase();
    
        if (statusText.includes('pending')) {
          const dealCell = row.locator('td[data-column="deal_name"]');
          const fullDealName = (await dealCell.innerText()).trim();
    
          if (!fullDealName) continue;
    
          // 🔥 Tomar solo la parte antes del primer guion
          const accountName = fullDealName.split(' - ')[0].trim();
    
          console.log(`✅ Using Pending Approval deal: ${accountName}`);
          return accountName;
        }
      }
    
      throw new Error('No Funded Deal with status "Pending Approval" found');
    }
    
    async verifySearch(value) {
        await expect(this.dealsTable).toBeVisible();
    
        const rowCount = await this.fundedDealsRows.count();
    
        if (rowCount === 0) {
        await expect(this.fundedDealsRows).toHaveCount(0);
        return;
        }
    
        // await expect(this.fundedDealsRows).toHaveCount(1);
    
        const row = this.fundedDealsRows.first();
    
        await expect(
        row,
        `Funded deal with value "${value}" was found`
        ).toContainText(value, { ignoreCase: true });
    }

    async getFirstDealAccountName() {
      const firstRowLink = this.page
        .locator('#funded-deals-container tr')
        .first()
        .locator('td[data-column="deal_name"] a');
    
      await expect(firstRowLink).toBeVisible();
    
      const fullText = (await firstRowLink.textContent()).trim();
    
      const accountName = fullText.split(' - ')[0];
    
      return accountName;
    }
    

    // Visualize Commissions
    async visualizeTotalCommissions(){
        await expect(this.visualizeCommissionIcon).toBeVisible();
        await this.visualizeCommissionIcon.click();
        await expect(this.commissionsLabel).toBeVisible();
        await this.hideCommissionIcon.click();
        await expect(this.commissionsLabel).toBeHidden();
    }

    // SORTING

    async getFirstNColumnValues(columnName, limit = 10) {
      await expect(this.dealsTable).toBeVisible();
  
      const rowCount = await this.fundedDealsRows.count();
      const max = Math.min(rowCount, limit);
  
      const values = [];
  
      for (let i = 0; i < max; i++) {
        const row = this.fundedDealsRows.nth(i);
        const cell = row.locator(`[data-column="${columnName}"]`);
        const text = (await cell.innerText()).trim();
  
        // Por si hay filas vacías o rarezas
        values.push(text);
      }
  
      return values;
    }
  
    normalizeValueForSorting(value, columnName) {
      if (value === null || value === undefined) return '';
    
      const raw = value.toString().trim();
    
      // 🔹 Columnas numéricas / dinero / porcentaje / términos
      const moneyColumns = ['funded_amount', 'rep_commission'];
      const percentColumns = ['fee_percentage'];
      const numericColumns = ['sell_rate', 'term'];
    
      // 💵 funded_amount / rep_commission → "$23,494.00" → 23494
      if (moneyColumns.includes(columnName)) {
        const numeric = raw.replace(/[^0-9.-]/g, ''); // quita $, comas, etc.
        if (numeric === '') {
          // Ej: "N/A" → sin números → mándalo al final en ASC
          return Number.POSITIVE_INFINITY;
        }
        return Number(numeric);
      }
    
      // 📊 fee_percentage → "1.5%" → 1.5
      if (percentColumns.includes(columnName)) {
        const numeric = raw.replace(/[^0-9.-]/g, '');
        if (numeric === '') {
          // "N/A" u otro texto sin número
          return Number.POSITIVE_INFINITY;
        }
        return Number(numeric);
      }
    
      // 🔢 sell_rate → "4.0", "1.0", "N/A"
      if (columnName === 'sell_rate') {
        const numeric = raw.replace(/[^0-9.-]/g, '');
        if (numeric === '') {
          // "N/A"
          return Number.POSITIVE_INFINITY;
        }
        return Number(numeric);
      }
    
      // ⏳ term → "90 months", "1 months", "N/A"
      if (columnName === 'term') {
        const match = raw.match(/\d+/); // agarra el primer número
        if (!match) {
          // "N/A" u otra cosa sin número
          return Number.POSITIVE_INFINITY;
        }
        return Number(match[0]);
      }
    
      return raw.toLowerCase();
    }

    async verifySortForColumn(headerLocator, columnName, limit = 10) {
      await expect(this.dealsTable).toBeVisible();
    
      await headerLocator.click();
      await this.page.waitForLoadState('networkidle');
    
      const ascValues = await this.getFirstNColumnValues(columnName, limit);
    
      const expectedAsc = [...ascValues].sort((a, b) => {
        const va = this.normalizeValueForSorting(a, columnName);
        const vb = this.normalizeValueForSorting(b, columnName);
    
        if (va < vb) return -1;
        if (va > vb) return 1;
        return 0;
      });
    
      await expect(
        ascValues,
        `ASC sort failed for column ${columnName}`
      ).toEqual(expectedAsc);

      await headerLocator.click();
      await this.page.waitForLoadState('networkidle');
    
      const descValues = await this.getFirstNColumnValues(columnName, limit);
    
      const expectedDesc = [...descValues]
        .sort((a, b) => {
          const va = this.normalizeValueForSorting(a, columnName);
          const vb = this.normalizeValueForSorting(b, columnName);
    
          if (va < vb) return -1;
          if (va > vb) return 1;
          return 0;
        })
        .reverse();
    
      await expect(
        descValues,
        `DESC sort failed for column ${columnName}`
      ).toEqual(expectedDesc);
    }

    async verifySortingForAllColumns(limit = 10) {
          await this.verifySortForColumn(this.sortByDealNameHeader, 'deal_name', limit);
          await this.verifySortForColumn(this.sortByStatusHeader, 'status', limit);
          await this.verifySortForColumn(
            this.sortByAmountHeader,
            'funded_amount',
            limit
          );
          await this.verifySortForColumn(this.sortByTermHeader, 'term', limit);
          await this.verifySortForColumn(this.sortBySellRateHeader, 'sell_rate', limit);
          await this.verifySortForColumn(
            this.sortByCommissionHeader,
            'rep_commission',
            limit
          );
          await this.verifySortForColumn(
            this.sortByFeeHeader,
            'fee_percentage',
            limit
          );
    }

    // View Details

    async openRowByName(searchTerm) {
      const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(esc(searchTerm), 'i');
    
      const row = this.dealsTable
        .filter({ hasText: pattern })
        .first();
    
      await expect(
        row,
        `A row with the name: ${searchTerm} was not found`
      ).toBeVisible();
    
      const nameLink = row.locator('a[href^="/funded_deals/"]').first();
    
      await expect(
        nameLink,
        `A link with the name: ${searchTerm} was not found`
      ).toBeVisible();
    
      await nameLink.scrollIntoViewIfNeeded();
      await nameLink.click();
      await expect(this.page.locator('h1.text-2xl.text-gray-900')).toContainText(searchTerm);
    }

    // Edit Details

    getFieldContainerByLabel(labelText) {
      return this.page
        .locator('div.space-y-2')
        .filter({
          has: this.page.locator('label', { hasText: labelText }),
        })
        .first();
    }

    // Obtains wrapper inline-edit (solo para campos editables)
    async getInlineEditWrapper(labelText) {
      const fieldContainer = this.getFieldContainerByLabel(labelText);
      const inlineWrapper = fieldContainer.locator('[data-controller="inline-edit"]').first();

      await expect(
        inlineWrapper,
        `El campo "${labelText}" no parece ser editable (no tiene data-controller="inline-edit").`
      ).toBeVisible();

      return inlineWrapper;
    }

    // Text / textarea (Notes, etc.)
    async editInlineTextField(labelText, newValue) {
      const inlineWrapper = await this.getInlineEditWrapper(labelText);

      await inlineWrapper.click();

      const input = inlineWrapper.locator('textarea, input[type="text"]').first();
      await input.fill(newValue);

      // Guardar
      await input.press('Enter');

      // Verificamos que el span muestre ese texto
      await expect(
        this.getFieldContainerByLabel(labelText).locator('span').filter({ hasText: newValue })
      ).toBeVisible();
    }

    // Numbers (Amount, Payment, Term Amount, Buy Rate, Sell Rate, Fee, Net, Commission)
    async editInlineNumberField(labelText, newValue) {
      const inlineWrapper = await this.getInlineEditWrapper(labelText);

      await inlineWrapper.click();

      const input = inlineWrapper.locator('input[type="number"], input[type="text"]').first();
      await input.fill(String(newValue));

      await input.press('Enter');

      // Solo validamos que ya no sea N/A o vacío
      await expect(
        this.getFieldContainerByLabel(labelText).locator('span')
      ).not.toHaveText(/N\/A|^\s*$/);
    }

  // Selects (Account Name, Owner, Deal Type, Term Schedule, Position, Position Type, Lender Paid, Rep Paid)
    async editInlineSelectField(labelText, optionLabel) {
      const inlineWrapper = await this.getInlineEditWrapper(labelText);

      await inlineWrapper.click();

      const select = inlineWrapper.locator('select').first();
      await select.selectOption({ label: optionLabel });

      await expect(
        this.getFieldContainerByLabel(labelText).locator('span').filter({ hasText: optionLabel })
      ).toBeVisible();
    }
    
    toUSDate(yyyyMmDd) {
      // "2026-05-31" -> "05/31/2026"
      const [yyyy, mm, dd] = yyyyMmDd.split('-');
      return `${mm}/${dd}/${yyyy}`;
    }

    // Dates (Approval Expiration Date, Exclusivity Expiration, Renewal Date)
    
    async editInlineDateField(labelText, isoDateString) {
      const container = this.getFieldContainerByLabel(labelText);
      const inline = container.locator('[data-controller="inline-edit"]').first();
    
      // 1) Abre modo edición
      await inline.click();
    
      // 2) Espera a que exista el input (puede ser date o text)
      const input = inline.locator('input[type="date"], input[type="text"]').first();
      await expect(input).toBeVisible();
    
      // 3) Llena (input type=date espera YYYY-MM-DD)
      await input.fill(isoDateString);
    
      // 4) Guarda: en muchos inline-edit, Enter no siempre funciona
      // Mejor: blur (click fuera) para disparar el autosave
      await this.page.keyboard.press('Enter').catch(() => {}); // por si no aplica
      await this.page.locator('body').click({ position: { x: 5, y: 5 } });
    
      // 5) Espera a que el editor se cierre (el input desaparece)
      await expect(input).toBeHidden({ timeout: 15000 });
    
      // 6) (Opcional pero útil) si tu app re-renderiza, espera estabilidad del DOM
      await this.page.waitForLoadState('networkidle').catch(() => {});
    }
    

    async editInlineFieldFlexible(labelText, value) {
      // 1) Contenedor del campo por label
      const fieldContainer = this.page
        .locator('div.space-y-2', {
          has: this.page.locator('label', { hasText: labelText }),
        })
        .first();
    
      const inlineWrapper = fieldContainer
        .locator('[data-controller="inline-edit"]')
        .first();
    
      await expect(
        inlineWrapper,
        `El campo "${labelText}" no parece ser editable (no tiene data-controller="inline-edit").`
      ).toBeVisible();
    
      // Entrar en modo edición (abre el inline-edit)
      await inlineWrapper.click();
      await this.page.waitForTimeout(150);
    
      // 2) Caso <select> clásico
      const select = inlineWrapper.locator('select').first();
      if (await select.count()) {
        await expect(select).toBeVisible();
        try {
          await select.selectOption({ label: value });
        } catch {
          await select.selectOption(value);
        }
        // Cerrar/confirmar
        await this.page.keyboard.press('Enter').catch(() => {});
        return;
      }
    
      // 3) Caso AUTOCOMPLETE genérico (user/account/lender/...-autocomplete)
      const autocompleteWrapper = inlineWrapper
        .locator('[data-controller*="autocomplete"]')
        .first(); // match: "user-autocomplete", "account-autocomplete", etc.
    
      if (await autocompleteWrapper.count()) {
        // Input de búsqueda: primer input de texto visible dentro del autocomplete
        const searchInput = autocompleteWrapper
          .locator('input[type="text"]')
          .filter({ hasNot: this.page.locator('[type="hidden"]') })
          .first();
    
        await expect(
          searchInput,
          `No se encontró el input de búsqueda para el campo "${labelText}".`
        ).toBeVisible();
    
        // Escribir valor
        await searchInput.fill(value);
        await this.page.waitForTimeout(200);
    
        // Opción del dropdown: cualquier elemento con data-action que incluya "#select"
        const firstOption = autocompleteWrapper
          .locator('[data-action*="#select"]')
          .first();
    
        await expect(
          firstOption,
          `No hay opciones clickeables en el autocomplete de "${labelText}".`
        ).toBeVisible();
    
        // Usar mousedown porque así está definido el data-action (mousedown->...#select...)
        await firstOption.dispatchEvent('mousedown', { button: 0 });
        await this.page.waitForTimeout(200);
        return;
      }
    
      // 4) Fallback: input/textarea normal
      const input = inlineWrapper
        .locator('input[type="text"], input:not([type]), textarea')
        .first();
    
      await expect(
        input,
        `No se encontró ni <select>, ni autocomplete, ni input/textarea para el campo "${labelText}".`
      ).toBeVisible();
    
      await input.fill(value);
      await this.page.keyboard.press('Enter').catch(() => {});
    }
    
    // Additional Information
    async updateAccountName(accountName) {
      await this.editInlineFieldFlexible('Account Name', accountName);
    }
    async updateOwner(ownerName) {
      await this.editInlineFieldFlexible('Owner', ownerName);
    }
    async updateNotes(notesText) {
      await this.editInlineFieldFlexible('Notes', notesText);
    }

      // Financial Details
    async updateAmount(amount) {
      await this.editInlineNumberField('Amount', amount);
    }
    async updateDealType(dealTypeLabel) {
      await this.editInlineFieldFlexible('Deal Type', dealTypeLabel);
    }
    async updatePayment(payment) {
      await this.editInlineNumberField('Payment', payment);
    }
    async updateTermAmount(termAmount) {
      await this.editInlineNumberField('Term Amount', termAmount);
    }
    async updateTermSchedule(termScheduleLabel) {
      await this.editInlineFieldFlexible('Term Schedule', termScheduleLabel);
    }
    async updateBuyRate(buyRate) {
      await this.editInlineNumberField('Buy Rate (%)', buyRate);
    }
    async updateSellRate(sellRate) {
      await this.editInlineNumberField('Sell Rate (%)', sellRate);
    }
    async updateFeePercentage(feePercentage) {
      await this.editInlineNumberField('Fee (%)', feePercentage);
    }
    async updateNet(netAmount) {
      await this.editInlineNumberField('Net (Less Payoffs)', netAmount);
    }
    async updateCommissionPercentage(commissionPercentage) {
      await this.editInlineNumberField('Commission (%)', commissionPercentage);
    }
    async updatePosition(positionLabel) {
      await this.editInlineSelectField('Position', positionLabel);
    }
    async updatePositionType(positionTypeLabel) {
      await this.editInlineSelectField('Position Type', positionTypeLabel);
    }

    // Important Dates
    async updateApprovalExpirationDate(dateString) {
      await this.editInlineDateField('Approval Expiration Date', dateString);
    }
    async updateExclusivityExpirationDate(dateString) {
      await this.editInlineDateField('Exclusivity Expiration', dateString);
    }
    async updateRenewalDate(dateString) {
      await this.editInlineDateField('Renewal Date', dateString);
    }

    // Payment Status
    async updateLenderPaid(optionLabel) {
      await this.editInlineSelectField('Lender Paid', optionLabel);
    }
    async updateRepPaid(optionLabel) {
      await this.editInlineSelectField('Rep Paid', optionLabel);
    }

    // Approve and Reopen Funded Deal
    async approveFundedDeal(){
      await expect(this.approveBtn).toBeVisible();
      await this.approveBtn.click();
      await expect(this.approvedStatusBadge).toBeVisible();
    }

    async reopenFundedDeal(){
      await expect(this.reopenBtn).toBeVisible();
      await this.reopenBtn.click();
      await expect(this.pendingApprovalStatusBadge).toBeVisible();
    }

    // Delete Funded Deals
    getRowByName(partialName) {
      return this.fundedDealsRows.filter({ hasText: partialName }).first();
    }
    
    async deleteFundedDeal(partialName) {
      const row = this.getRowByName(partialName);
      await expect(row).toBeVisible();
    
      // 🔹 botón ⋮ SOLO dentro del row
      const actionsMenuButton = row.locator('button[data-action="click->dropdown#toggle"]').first();
      await expect(actionsMenuButton).toBeVisible();
      await actionsMenuButton.click();
    
      // 🔹 botón Delete SOLO dentro del row (en el dropdown)
      const deleteBtn = row.locator('button[type="submit"]', { hasText: 'Delete' }).first();
      await expect(deleteBtn).toBeVisible();
    
      // 🔹 aceptar confirm del navegador
      this.page.once('dialog', async (dialog) => {
        await dialog.accept();
      });
    
      await deleteBtn.click();
    
      await this.page.waitForLoadState('networkidle');
    }
    
    

}